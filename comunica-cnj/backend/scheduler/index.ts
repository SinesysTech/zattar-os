import cron from 'node-cron';
import { getSupabase } from '@/lib/supabase';
import { getNextRunTime } from '@/lib/utils/cron-helpers.server';
import { SCHEDULED_SCRAPES_CONFIG, isSupportedTimezone } from '@/config/scraping';
import type { Tables } from '@/lib/types/database';
import { getComunicaCNJClient } from '@/lib/services/comunica-cnj-client';
import { ComunicacaoExecutionStatus, ComunicacaoScheduleMode } from '@/lib/types/comunica-cnj';
import { dispatchComunicacaoCompleted, dispatchComunicacaoFailed } from '@/lib/services/webhook-dispatcher';

type ComunicacaoScheduleRow = Tables<'ComunicacaoSchedule'>['Row'];

const activeTasks = new Map<string, cron.ScheduledTask>();
let isInitialized = false;

export async function initializeScheduler(): Promise<void> {
  if (isInitialized) { return; }
  try {
    const supabase = getSupabase();
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!secretKey) { throw new Error('SUPABASE_SECRET_KEY não está configurada.'); }
    const { data: activeSchedules, error } = await supabase.from('ComunicacaoSchedule').select('*').eq('active', true);
    if (error) {
      if (error.code === 'PGRST204' || error.message.includes('does not exist')) { return; }
      if (error.message?.includes('permission denied') || error.code === '42501') { isInitialized = true; return; }
      throw error;
    }
    for (const schedule of activeSchedules || []) {
      try {
        scheduleJob(schedule as ComunicacaoScheduleRow);
        const nextRun = getNextRunTime(schedule.cronExpression, schedule.timezone);
        await supabase.from('ComunicacaoSchedule').update({ nextRunAt: nextRun.toISOString() }).eq('id', schedule.id);
      } catch { /* ignore */ }
    }
    isInitialized = true;
  } catch (error) { throw error; }
}

export function scheduleJob(schedule: ComunicacaoScheduleRow): void {
  try {
    let validatedTimezone = schedule.timezone;
    if (!isSupportedTimezone(validatedTimezone)) { validatedTimezone = SCHEDULED_SCRAPES_CONFIG.defaultTimezone; }
    try { new Date().toLocaleString('en-US', { timeZone: validatedTimezone }); } catch { validatedTimezone = SCHEDULED_SCRAPES_CONFIG.defaultTimezone; }
    const task = cron.schedule(schedule.cronExpression, async () => { await executeScheduledSearch(schedule.id); }, { scheduled: true, timezone: validatedTimezone });
    activeTasks.set(schedule.id, task);
  } catch (error) { throw error; }
}

export async function executeScheduledSearch(scheduleId: string): Promise<void> {
  const startedAt = new Date();
  try {
    const supabase = getSupabase();
    const { data: schedule, error } = await supabase.from('ComunicacaoSchedule').select('*').eq('id', scheduleId).single();
    if (error?.code === 'PGRST116' || !schedule) { return; }
    if (!schedule.active) { return; }
    const { data: execution, error: execError } = await supabase.from('ComunicacaoExecution').insert({ scheduleId: schedule.id, status: ComunicacaoExecutionStatus.RUNNING, startedAt: startedAt.toISOString(), }).select().single();
    if (execError) { throw new Error(`Failed to create execution: ${execError.message}`); }
    const client = getComunicaCNJClient();
    let totalComunicacoes = 0;
    if (schedule.modo === ComunicacaoScheduleMode.ADVOGADOS_CADASTRADOS) {
      const advogadoIds = schedule.advogadoIds as string[] | null;
      if (!advogadoIds || advogadoIds.length === 0) { throw new Error('Nenhum advogado configurado para este agendamento'); }
      const { data: advogados, error: advError } = await supabase.from('Advogado').select('*').in('id', advogadoIds);
      if (advError) { throw new Error(`Failed to load advogados: ${advError.message}`); }
      for (const advogado of advogados || []) {
        const configuracao = schedule.configuracao as any;
        const params: any = { numeroOab: advogado.oabNumero, ufOab: advogado.oabUf, ...configuracao };
        const result = await client.consultarComunicacoes(params);
        const comunicacoesToUpsert = result.data.comunicacoes.map(item => {
          const nomeParte = [...(item.partesAutoras || []), ...(item.partesReus || [])].join(', ') || null;
          const nomeAdvogado = item.advogados?.[0] || null;
          const primeiraOab = item.advogadosOab?.[0];
          const [numeroOab, ufOab] = primeiraOab ? primeiraOab.split('/') : [null, null];
          return { hash: item.hash, siglaTribunal: item.siglaTribunal, numeroProcesso: item.numeroProcesso, nomeParte, nomeAdvogado, numeroOab, ufOab, texto: item.texto, dataDisponibilizacao: new Date(item.dataDisponibilizacao).toISOString(), numeroComunicacao: item.numeroComunicacao?.toString() || null, orgaoId: item.idOrgao?.toString() || null, meio: item.meio, metadados: item, advogadoId: advogado.id };
        });
        await supabase.from('ComunicacaoCNJ').upsert(comunicacoesToUpsert, { onConflict: 'hash', ignoreDuplicates: false });
        totalComunicacoes += result.data.comunicacoes.length;
      }
    } else {
      const configuracao = schedule.configuracao as any;
      const params: any = { ...configuracao };
      const result = await client.consultarComunicacoes(params);
      const comunicacoesToUpsert = result.data.comunicacoes.map(item => {
        const nomeParte = [...(item.partesAutoras || []), ...(item.partesReus || [])].join(', ') || null;
        const nomeAdvogado = item.advogados?.[0] || null;
        const primeiraOab = item.advogadosOab?.[0];
        const [numeroOab, ufOab] = primeiraOab ? primeiraOab.split('/') : [null, null];
        return { hash: item.hash, siglaTribunal: item.siglaTribunal, numeroProcesso: item.numeroProcesso, nomeParte, nomeAdvogado, numeroOab, ufOab, texto: item.texto, dataDisponibilizacao: new Date(item.dataDisponibilizacao).toISOString(), numeroComunicacao: item.numeroComunicacao?.toString() || null, orgaoId: item.idOrgao?.toString() || null, meio: item.meio, metadados: item };
      });
      await supabase.from('ComunicacaoCNJ').upsert(comunicacoesToUpsert, { onConflict: 'hash', ignoreDuplicates: false });
      totalComunicacoes = result.data.comunicacoes.length;
    }
    const completedAt = new Date();
    await supabase.from('ComunicacaoExecution').update({ status: ComunicacaoExecutionStatus.COMPLETED, comunicacoesCount: totalComunicacoes, completedAt: completedAt.toISOString(), }).eq('id', (execution as any).id);
    const nextRun = getNextRunTime(schedule.cronExpression, schedule.timezone);
    await supabase.from('ComunicacaoSchedule').update({ lastRunAt: startedAt.toISOString(), nextRunAt: nextRun.toISOString(), runCount: schedule.runCount + 1, }).eq('id', schedule.id);
    if (schedule.webhookEndpointId) { try { await dispatchComunicacaoCompleted((execution as any).id, schedule.webhookEndpointId); } catch { /* ignore */ } }
  } catch (error) {
    const errorSupabase = getSupabase();
    let scheduleData: { webhookEndpointId: string | null } | null = null;
    let executionId: string | null = null;
    try {
      const { data: scheduleRow } = await errorSupabase.from('ComunicacaoSchedule').select('webhookEndpointId').eq('id', scheduleId).single();
      scheduleData = scheduleRow;
      const { data: execution } = await errorSupabase.from('ComunicacaoExecution').select('id').eq('scheduleId', scheduleId).eq('status', ComunicacaoExecutionStatus.RUNNING).eq('startedAt', startedAt.toISOString()).maybeSingle();
      executionId = execution?.id || null;
    } catch { }
    try {
      await errorSupabase.from('ComunicacaoExecution').update({ status: ComunicacaoExecutionStatus.FAILED, errorMessage: error instanceof Error ? error.message : String(error), completedAt: new Date().toISOString(), }).eq('scheduleId', scheduleId).eq('status', ComunicacaoExecutionStatus.RUNNING).eq('startedAt', startedAt.toISOString());
    } catch { }
    if (scheduleData?.webhookEndpointId && executionId) { try { await dispatchComunicacaoFailed(executionId, scheduleData.webhookEndpointId, error instanceof Error ? error.message : String(error)); } catch { /* ignore */ } }
  }
}

export function addSchedule(schedule: ComunicacaoScheduleRow): void { scheduleJob(schedule); }
export function updateSchedule(scheduleId: string, schedule: ComunicacaoScheduleRow): void { removeSchedule(scheduleId); scheduleJob(schedule); }
export function removeSchedule(scheduleId: string): void { const task = activeTasks.get(scheduleId); if (task) { task.stop(); activeTasks.delete(scheduleId); } }
export async function pauseSchedule(scheduleId: string): Promise<void> { const task = activeTasks.get(scheduleId); if (task) { task.stop(); } }
export async function resumeSchedule(scheduleId: string): Promise<void> { const supabase = getSupabase(); const { data: schedule } = await supabase.from('ComunicacaoSchedule').select('*').eq('id', scheduleId).single(); const existingTask = activeTasks.get(scheduleId); if (existingTask) { existingTask.stop(); activeTasks.delete(scheduleId); } scheduleJob(schedule as any); }
export function stopScheduler(): void { for (const [scheduleId, task] of activeTasks.entries()) { task.stop(); } activeTasks.clear(); isInitialized = false; }
export function getSchedulerStats(): { initialized: boolean; activeSchedules: number; scheduleIds: string[] } { return { initialized: isInitialized, activeSchedules: activeTasks.size, scheduleIds: Array.from(activeTasks.keys()), }; }
