"use server";

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { getSupabase } from '@/lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database';
import { getNextRunTime, validateCronExpression } from '@/lib/utils/cron-helpers.server';
import { SCHEDULED_SCRAPES_CONFIG, isSupportedTimezone } from '@/config/scraping';
import { sanitizeError } from '@/lib/utils/sanitization';
import { withPermission } from '@/lib/middleware/rbac-middleware';
import {
  addSchedule,
  pauseSchedule as pauseScheduleInScheduler,
  removeSchedule as removeScheduleFromScheduler,
  resumeSchedule as resumeScheduleInScheduler,
  updateSchedule as updateScheduleInScheduler,
} from '@/lib/services/comunica-cnj-scheduler';
import { getComunicaCNJClient } from '@/lib/services/comunica-cnj-client';
import type {
  ComunicacaoCNJWithRelations,
  ComunicacaoExecutionWithRelations,
  ComunicacaoScheduleWithRelations,
  ComunicacaoSearchFilters,
  CreateComunicacaoScheduleInput,
  ListComunicacaoExecutionsFilters,
  ListComunicacaoSchedulesFilters,
  PaginatedComunicacaoExecutions,
  PaginatedComunicacaoSchedules,
  PaginatedComunicacoes,
  PaginatedComunicacoesAPI,
  UpdateComunicacaoScheduleInput,
} from '@/lib/types/comunica-cnj';
import { ComunicacaoExecutionStatus, ComunicacaoScheduleMode } from '@/lib/types/comunica-cnj';

function toISOString(date: Date): string { return date.toISOString(); }
type ComunicacaoScheduleRow = Tables<'ComunicacaoSchedule'>['Row'];
type ComunicacaoExecutionRow = Tables<'ComunicacaoExecution'>['Row'];

const createComunicacaoScheduleSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  modo: z.enum(['advogados_cadastrados', 'parametros_customizados']),
  cronExpression: z.string(),
  timezone: z.string().optional(),
  active: z.boolean().optional().default(true),
  advogadoIds: z.array(z.string().uuid()).optional(),
  webhookEndpointId: z.string().uuid('ID de endpoint webhook inválido').optional(),
  configuracao: z.object({
    siglaTribunal: z.array(z.string()).optional(),
    texto: z.string().optional(),
    nomeParte: z.string().optional(),
    nomeAdvogado: z.string().optional(),
    numeroOab: z.string().optional(),
    ufOab: z.string().optional(),
    numeroProcesso: z.string().optional(),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    meio: z.enum(['E', 'D']).optional(),
    itensPorPagina: z.number().int().refine((val) => val === 5 || val === 100, { message: 'itensPorPagina deve ser 5 ou 100' }).optional(),
  }).optional(),
});

export const createComunicacaoScheduleAction = withPermission(
  { moduleSlug: 'comunicacoes', action: 'create' },
  async (input: CreateComunicacaoScheduleInput): Promise<{ success: boolean; data?: { scheduleId: string }; error?: string }> => {
    try {
      const validation = createComunicacaoScheduleSchema.safeParse(input);
      if (!validation.success) {
        return { success: false, error: validation.error.issues[0]?.message || 'Dados inválidos' };
      }
      let tz = input.timezone || SCHEDULED_SCRAPES_CONFIG.defaultTimezone;
      if (!isSupportedTimezone(tz)) { tz = SCHEDULED_SCRAPES_CONFIG.defaultTimezone; }
      const cronValidation = validateCronExpression(input.cronExpression);
      if (!cronValidation.valid) { return { success: false, error: cronValidation.error }; }
      if (input.modo === ComunicacaoScheduleMode.ADVOGADOS_CADASTRADOS) {
        if (!input.advogadoIds || input.advogadoIds.length === 0) { return { success: false, error: 'Pelo menos um advogado deve ser selecionado' }; }
        const supabase = getSupabase();
        const { data: advogados } = await supabase.from('Advogado').select('id').in('id', input.advogadoIds);
        if (!advogados || advogados.length !== input.advogadoIds.length) { return { success: false, error: 'Um ou mais advogados não foram encontrados' }; }
      } else {
        const configuracao = input.configuracao || {} as any;
        const hasFilter = configuracao.siglaTribunal?.length || configuracao.texto || configuracao.nomeParte || configuracao.nomeAdvogado || configuracao.numeroOab || configuracao.numeroProcesso || configuracao.dataInicio;
        if (!hasFilter) { return { success: false, error: 'Pelo menos um filtro deve ser preenchido para parâmetros customizados' }; }
      }
      const supabase = getSupabase();
      if (input.webhookEndpointId) {
        const { data: webhookEndpoint } = await supabase.from('WebhookEndpoint').select('*').eq('id', input.webhookEndpointId).single();
        if (!webhookEndpoint) { return { success: false, error: 'Endpoint webhook não encontrado' }; }
        if (!(webhookEndpoint as any).active) { return { success: false, error: 'Endpoint webhook está inativo' }; }
      }
      const nextRun = getNextRunTime(input.cronExpression, tz);
      const insertData: TablesInsert<'ComunicacaoSchedule'> = {
        name: input.name,
        description: input.description || null,
        modo: input.modo,
        cronExpression: input.cronExpression,
        timezone: tz,
        active: input.active ?? true,
        advogadoIds: input.advogadoIds || null,
        configuracao: input.configuracao || {},
        webhookEndpointId: input.webhookEndpointId || null,
        nextRunAt: nextRun ? toISOString(nextRun) : null,
      };
      const { data: schedule, error: createError } = await supabase.from('ComunicacaoSchedule').insert(insertData as any).select().single();
      if (createError || !schedule) { throw new Error(`Failed to create schedule: ${createError?.message}`); }
      if ((schedule as any).active) { try { addSchedule(schedule as any); } catch { /* ignore */ } }
      return { success: true, data: { scheduleId: (schedule as any).id } };
    } catch (error) { return { success: false, error: sanitizeError(error) }; }
  }
);

export const listComunicacaoSchedulesAction = withPermission(
  { moduleSlug: 'comunicacoes', action: 'read' },
  async (filters?: ListComunicacaoSchedulesFilters): Promise<{ success: boolean; data?: PaginatedComunicacaoSchedules; error?: string }> => {
    try {
      const page = filters?.page || 1; const pageSize = filters?.pageSize || 20; const skip = (page - 1) * pageSize;
      const supabase = getSupabase();
      let query = supabase.from('ComunicacaoSchedule').select(`*, executions:ComunicacaoExecution(*)`, { count: 'exact' });
      if (filters?.active !== undefined) { query = query.eq('active', filters.active); }
      if (filters?.modo) { query = query.eq('modo', filters.modo); }
      const { data: schedules, error, count } = await query.range(skip, skip + pageSize - 1).order('nextRunAt', { ascending: true, nullsFirst: false });
      if (error) { throw new Error(`Failed to list schedules: ${error.message}`); }
      const schedulesWithLimitedExecutions = (schedules || []).map((schedule: any) => ({ ...schedule, executions: Array.isArray(schedule.executions) ? schedule.executions.slice(0, 1).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [], }));
      const total = count ?? 0;
      return { success: true, data: { schedules: schedulesWithLimitedExecutions as ComunicacaoScheduleWithRelations[], total, page, pageSize, totalPages: Math.ceil(total / pageSize), }, };
    } catch (error) { return { success: false, error: sanitizeError(error) }; }
  }
);

export const getComunicacaoScheduleAction = withPermission(
  { moduleSlug: 'comunicacoes', action: 'read' },
  async (id: string): Promise<{ success: boolean; data?: ComunicacaoScheduleWithRelations; error?: string }> => {
    try {
      const supabase = getSupabase();
      const { data: schedule, error } = await supabase.from('ComunicacaoSchedule').select(`*, executions:ComunicacaoExecution(*)`).eq('id', id).single();
      if (error?.code === 'PGRST116' || !schedule) { return { success: false, error: 'Agendamento não encontrado' }; }
      const scheduleData = schedule as any;
      const scheduleWithLimitedExecutions = { ...scheduleData, executions: Array.isArray(scheduleData.executions) ? scheduleData.executions.slice(0, 10).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [], };
      return { success: true, data: scheduleWithLimitedExecutions as ComunicacaoScheduleWithRelations };
    } catch (error) { return { success: false, error: sanitizeError(error) }; }
  }
);

export const updateComunicacaoScheduleAction = withPermission(
  { moduleSlug: 'comunicacoes', action: 'update' },
  async ({ id, input }: { id: string; input: UpdateComunicacaoScheduleInput; }): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = getSupabase();
      const { data: existingData, error: findError } = await supabase.from('ComunicacaoSchedule').select('*').eq('id', id).single();
      if (findError?.code === 'PGRST116' || !existingData) { return { success: false, error: 'Agendamento não encontrado' }; }
      const existing = existingData as ComunicacaoScheduleRow;
      if (input.modo === ComunicacaoScheduleMode.ADVOGADOS_CADASTRADOS) {
        if (input.advogadoIds && input.advogadoIds.length === 0) { return { success: false, error: 'Pelo menos um advogado deve ser selecionado' }; }
      }
      if (input.cronExpression) { const cronValidation = validateCronExpression(input.cronExpression); if (!cronValidation.valid) { return { success: false, error: cronValidation.error }; } }
      let tz = input.timezone || existing.timezone; if (input.timezone && !isSupportedTimezone(input.timezone)) { tz = existing.timezone; }
      if (input.webhookEndpointId !== undefined) {
        if (input.webhookEndpointId) {
          const { data: webhookEndpoint } = await supabase.from('WebhookEndpoint').select('*').eq('id', input.webhookEndpointId).single();
          if (!webhookEndpoint) { return { success: false, error: 'Endpoint webhook não encontrado' }; }
          if (!(webhookEndpoint as any).active) { return { success: false, error: 'Endpoint webhook está inativo' }; }
        }
      }
      const updateData: TablesUpdate<'ComunicacaoSchedule'> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.modo !== undefined) updateData.modo = input.modo;
      if (input.cronExpression !== undefined) updateData.cronExpression = input.cronExpression;
      if (input.timezone !== undefined) updateData.timezone = tz;
      if (input.active !== undefined) updateData.active = input.active;
      if (input.advogadoIds !== undefined) updateData.advogadoIds = input.advogadoIds || null;
      if (input.configuracao !== undefined) updateData.configuracao = input.configuracao;
      if (input.webhookEndpointId !== undefined) updateData.webhookEndpointId = input.webhookEndpointId || null;
      if (input.cronExpression || input.timezone) { const cronExpr = input.cronExpression || existing.cronExpression; const nextRun = getNextRunTime(cronExpr, tz); updateData.nextRunAt = nextRun ? toISOString(nextRun) : null; }
      const { data: schedule, error: updateError } = await (supabase.from('ComunicacaoSchedule') as any).update(updateData).eq('id', id).select().single();
      if (updateError || !schedule) { throw new Error(`Failed to update schedule: ${updateError?.message}`); }
      try { updateScheduleInScheduler(id, schedule as any); } catch { /* ignore */ }
      return { success: true };
    } catch (error) { return { success: false, error: sanitizeError(error) }; }
  }
);

export const deleteComunicacaoScheduleAction = withPermission(
  { moduleSlug: 'comunicacoes', action: 'delete' },
  async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      try { removeScheduleFromScheduler(id); } catch { /* ignore */ }
      const supabase = getSupabase();
      const { error: deleteError } = await supabase.from('ComunicacaoSchedule').delete().eq('id', id);
      if (deleteError) { throw new Error(`Failed to delete schedule: ${deleteError.message}`); }
      return { success: true };
    } catch (error) { return { success: false, error: sanitizeError(error) }; }
  }
);

export const toggleComunicacaoScheduleAction = withPermission(
  { moduleSlug: 'comunicacoes', action: 'update' },
  async ({ id, active }: { id: string; active: boolean }): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = getSupabase();
      const { data: schedule, error: findError } = await supabase.from('ComunicacaoSchedule').select('*').eq('id', id).single();
      if (findError?.code === 'PGRST116' || !schedule) { return { success: false, error: 'Agendamento não encontrado' }; }
      const updateData: TablesUpdate<'ComunicacaoSchedule'> = { active };
      const { error: updateError } = await (supabase.from('ComunicacaoSchedule') as any).update(updateData).eq('id', id);
      if (updateError) { throw new Error(`Failed to update schedule: ${updateError.message}`); }
      if (active) { try { await resumeScheduleInScheduler(id); } catch { /* ignore */ } } else { try { await pauseScheduleInScheduler(id); } catch { /* ignore */ } }
      return { success: true };
    } catch (error) { return { success: false, error: sanitizeError(error) }; }
  }
);

async function getOrCreateManualSchedule(): Promise<string> {
  const manualScheduleName = '[MANUAL] Busca Manual';
  const supabase = getSupabase();
  const { data: schedule } = await supabase.from('ComunicacaoSchedule').select('id').eq('name', manualScheduleName).maybeSingle();
  if (schedule) { return (schedule as any).id; }
  const now = new Date().toISOString();
  const insertData: TablesInsert<'ComunicacaoSchedule'> = {
    id: randomUUID(),
    name: manualScheduleName,
    description: 'Agendamento interno para buscas manuais',
    modo: ComunicacaoScheduleMode.MANUAL,
    cronExpression: '0 0 * * *',
    timezone: 'America/Sao_Paulo',
    active: false,
    configuracao: {},
    advogadoIds: null,
    webhookEndpointId: null,
    nextRunAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const { data: newSchedule, error: createError } = await supabase.from('ComunicacaoSchedule').insert(insertData as any).select('id').single();
  if (createError || !newSchedule) { throw new Error(`Failed to create manual schedule: ${createError?.message}`); }
  return (newSchedule as any).id;
}

export const searchComunicacoesAction = withPermission(
  { moduleSlug: 'comunicacoes', action: 'read' },
  async ({ filters, executionId }: { filters: ComunicacaoSearchFilters; executionId?: string; }): Promise<{ success: boolean; data?: PaginatedComunicacoesAPI & { executionId: string }; error?: string }> => {
    try {
      const manualScheduleId = await getOrCreateManualSchedule();
      const supabase = getSupabase();
      let execution: ComunicacaoExecutionRow;
      if (executionId) {
        const { data: existingExecution, error: findError } = await supabase.from('ComunicacaoExecution').select('*').eq('id', executionId).single();
        if (findError?.code === 'PGRST116' || !existingExecution) { throw new Error('Execution não encontrada'); }
        execution = existingExecution as ComunicacaoExecutionRow;
      } else {
        const now = new Date().toISOString();
        const insertData: TablesInsert<'ComunicacaoExecution'> = { id: randomUUID(), scheduleId: manualScheduleId, status: ComunicacaoExecutionStatus.RUNNING, startedAt: now, createdAt: now };
        const { data: newExecution, error: createError } = await supabase.from('ComunicacaoExecution').insert(insertData as any).select().single();
        if (createError || !newExecution) { throw new Error(`Failed to create execution: ${createError?.message}`); }
        execution = newExecution as ComunicacaoExecutionRow;
      }
      const client = getComunicaCNJClient();
      const apiParams = {
        siglaTribunal: filters.siglaTribunal,
        texto: filters.texto,
        nomeParte: filters.nomeParte,
        nomeAdvogado: filters.nomeAdvogado,
        numeroOab: filters.numeroOab,
        ufOab: filters.ufOab,
        numeroProcesso: filters.numeroProcesso,
        numeroComunicacao: filters.numeroComunicacao,
        orgaoId: filters.orgaoId,
        dataInicio: filters.dataInicio,
        dataFim: filters.dataFim,
        meio: filters.meio,
        pagina: filters.pagina || 1,
        itensPorPagina: filters.itensPorPagina || 100,
      } as any;
      const result = await client.consultarComunicacoes(apiParams);
      const apiResponse = result.data as any;
      const items = apiResponse.items || apiResponse.comunicacoes || [];
      const comunicacoes = items.map((item: any) => {
        const destinatarios = item.destinatarios || [];
        const partesAutoras = destinatarios.filter((d: any) => d.polo === 'A').map((d: any) => d.nome);
        const partesReus = destinatarios.filter((d: any) => d.polo === 'P').map((d: any) => d.nome);
        const destinatarioAdvogados = item.destinatarioadvogados || [];
        const advogados = destinatarioAdvogados.map((da: any) => da.advogado?.nome).filter(Boolean);
        const advogadosOab = destinatarioAdvogados.map((da: any) => { const adv = da.advogado; return adv ? `${adv.numero_oab}/${adv.uf_oab}` : null; }).filter(Boolean);
        return {
          id: item.id,
          hash: item.hash,
          numeroProcesso: item.numero_processo,
          numeroProcessoComMascara: item.numeroprocessocommascara,
          siglaTribunal: item.siglaTribunal,
          nomeClasse: item.nomeClasse,
          codigoClasse: item.codigoClasse,
          tipoComunicacao: item.tipoComunicacao,
          tipoDocumento: item.tipoDocumento,
          numeroComunicacao: item.numeroComunicacao,
          texto: item.texto,
          link: item.link,
          nomeOrgao: item.nomeOrgao,
          idOrgao: item.idOrgao,
          dataDisponibilizacao: item.data_disponibilizacao,
          dataDisponibilizacaoFormatada: item.datadisponibilizacao,
          dataCancelamento: item.data_cancelamento,
          meio: item.meio,
          meioCompleto: item.meiocompleto,
          ativo: item.ativo,
          status: item.status,
          motivoCancelamento: item.motivo_cancelamento,
          destinatarios,
          destinatarioAdvogados,
          partesAutoras,
          partesReus,
          advogados,
          advogadosOab,
        };
      });
      if (!executionId) {
        const updateData: TablesUpdate<'ComunicacaoExecution'> = { status: ComunicacaoExecutionStatus.COMPLETED, completedAt: toISOString(new Date()), comunicacoesCount: comunicacoes.length };
        await (supabase.from('ComunicacaoExecution') as any).update(updateData).eq('id', execution.id);
      }
      return { success: true, data: { comunicacoes, paginacao: { pagina: filters.pagina || 1, itensPorPagina: filters.itensPorPagina || 100, total: apiResponse.count || apiResponse.total || 0, totalPaginas: Math.ceil((apiResponse.count || 0) / (filters.itensPorPagina || 100)), }, executionId: execution.id } };
    } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Erro ao buscar comunicações' }; }
  }
);

export const finalizeManualSearchExecutionAction = withPermission(
  { moduleSlug: 'comunicacoes', action: 'update' },
  async ({ executionId, totalComunicacoesCount }: { executionId: string; totalComunicacoesCount: number; }): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = getSupabase();
      const updateData: TablesUpdate<'ComunicacaoExecution'> = { status: ComunicacaoExecutionStatus.COMPLETED, completedAt: toISOString(new Date()), comunicacoesCount: totalComunicacoesCount };
      const { error: updateError } = await (supabase.from('ComunicacaoExecution') as any).update(updateData).eq('id', executionId);
      if (updateError) { throw new Error(`Failed to update execution: ${updateError.message}`); }
      return { success: true };
    } catch (error) { return { success: false, error: sanitizeError(error) }; }
  }
);

export const listComunicacoesAction = withPermission(
  { moduleSlug: 'comunicacoes', action: 'read' },
  async (filters?: { siglaTribunal?: string; numeroProcesso?: string; numeroOab?: string; dataInicio?: Date; dataFim?: Date; page?: number; pageSize?: number; }): Promise<{ success: boolean; data?: PaginatedComunicacoes; error?: string }> => {
    try {
      const page = filters?.page || 1; const pageSize = filters?.pageSize || 50; const skip = (page - 1) * pageSize;
      const supabase = getSupabase();
      let query = supabase.from('ComunicacaoCNJ').select(`*, advogado:Advogado(*)`, { count: 'exact' });
      if (filters?.siglaTribunal) { query = query.eq('siglaTribunal', filters.siglaTribunal); }
      if (filters?.numeroProcesso) { query = query.ilike('numeroProcesso', `%${filters.numeroProcesso}%`); }
      if (filters?.numeroOab) { query = query.eq('numeroOab', filters.numeroOab); }
      if (filters?.dataInicio) { query = query.gte('dataDisponibilizacao', filters.dataInicio.toISOString()); }
      if (filters?.dataFim) { query = query.lte('dataDisponibilizacao', filters.dataFim.toISOString()); }
      const { data: comunicacoes, error, count } = await query.range(skip, skip + pageSize - 1).order('dataDisponibilizacao', { ascending: false });
      if (error) { throw new Error(`Failed to list comunicacoes: ${error.message}`); }
      const total = count ?? 0;
      return { success: true, data: { comunicacoes: comunicacoes as ComunicacaoCNJWithRelations[], paginacao: { pagina: page, itensPorPagina: pageSize, total, totalPaginas: Math.ceil(total / pageSize), }, } };
    } catch (error) { return { success: false, error: sanitizeError(error) }; }
  }
);

export const getComunicacaoAction = withPermission(
  { moduleSlug: 'comunicacoes', action: 'read' },
  async (id: string): Promise<{ success: boolean; data?: ComunicacaoCNJWithRelations; error?: string }> => {
    try {
      const supabase = getSupabase();
      const { data: comunicacao, error } = await supabase.from('ComunicacaoCNJ').select(`*, advogado:Advogado(*)`).eq('id', id).single();
      if (error?.code === 'PGRST116' || !comunicacao) { return { success: false, error: 'Comunicação não encontrada' }; }
      return { success: true, data: comunicacao as ComunicacaoCNJWithRelations };
    } catch (error) { return { success: false, error: sanitizeError(error) }; }
  }
);

export const listComunicacaoExecutionsAction = withPermission(
  { moduleSlug: 'comunicacoes', action: 'read' },
  async (filters?: ListComunicacaoExecutionsFilters): Promise<{ success: boolean; data?: PaginatedComunicacaoExecutions; error?: string }> => {
    try {
      const page = filters?.page || 1; const pageSize = filters?.pageSize || 20; const skip = (page - 1) * pageSize;
      const supabase = getSupabase();
      let query = supabase.from('ComunicacaoExecution').select(`*, schedule:ComunicacaoSchedule(*)`, { count: 'exact' });
      if (filters?.scheduleId) { query = query.eq('scheduleId', filters.scheduleId); }
      if (filters?.status && filters.status.length > 0) { query = query.in('status', filters.status); }
      if (filters?.startDate) { query = query.gte('createdAt', filters.startDate.toISOString()); }
      if (filters?.endDate) { query = query.lte('createdAt', filters.endDate.toISOString()); }
      const { data: executions, error, count } = await query.range(skip, skip + pageSize - 1).order('createdAt', { ascending: false });
      if (error) { throw new Error(`Failed to list executions: ${error.message}`); }
      const total = count ?? 0;
      return { success: true, data: { executions: executions as ComunicacaoExecutionWithRelations[], total, page, pageSize, totalPages: Math.ceil(total / pageSize), } };
    } catch (error) { return { success: false, error: sanitizeError(error) }; }
  }
);
