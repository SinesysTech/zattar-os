/**
 * Persistência de dados de audiências para Dashboard
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { AudienciasResumo, AudienciaProxima } from '@/backend/types/dashboard/types';

/**
 * Obtém resumo de audiências do usuário
 */
export async function getAudienciasResumo(
  responsavelId?: number
): Promise<AudienciasResumo> {
  const supabase = createServiceClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);

  const em30dias = new Date(hoje);
  em30dias.setDate(em30dias.getDate() + 30);

  // Query base - audiências futuras designadas
  let baseQuery = supabase
    .from('audiencias')
    .select('id, data_inicio', { count: 'exact' })
    .gte('data_inicio', hoje.toISOString())
    .eq('designada', true);

  if (responsavelId) {
    baseQuery = baseQuery.eq('responsavel_id', responsavelId);
  }

  const { data, count, error } = await baseQuery;

  if (error) {
    console.error('Erro ao buscar audiências:', error);
    throw new Error(`Erro ao buscar audiências: ${error.message}`);
  }

  const audiencias = data || [];

  // Calcular métricas
  const hojeStr = hoje.toISOString().split('T')[0];
  const amanhaStr = amanha.toISOString().split('T')[0];

  const hojeCount = audiencias.filter((a) => {
    const dataAud = new Date(a.data_inicio).toISOString().split('T')[0];
    return dataAud === hojeStr;
  }).length;

  const amanhaCount = audiencias.filter((a) => {
    const dataAud = new Date(a.data_inicio).toISOString().split('T')[0];
    return dataAud === amanhaStr;
  }).length;

  const proximos7dias = audiencias.filter((a) => {
    const dataAud = new Date(a.data_inicio);
    return dataAud >= hoje && dataAud < em7dias;
  }).length;

  const proximos30dias = audiencias.filter((a) => {
    const dataAud = new Date(a.data_inicio);
    return dataAud >= hoje && dataAud < em30dias;
  }).length;

  return {
    total: count || 0,
    hoje: hojeCount,
    amanha: amanhaCount,
    proximos7dias,
    proximos30dias,
  };
}

/**
 * Obtém lista de próximas audiências
 * Prioridade: 1) Audiências de hoje, 2) Audiências de amanhã, 3) Próximas disponíveis
 */
export async function getProximasAudiencias(
  responsavelId?: number,
  limite: number = 5
): Promise<AudienciaProxima[]> {
  const supabase = createServiceClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeStr = hoje.toISOString().split('T')[0];

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const amanhaStr = amanha.toISOString().split('T')[0];

  const selectFields = `
    id,
    processo_id,
    numero_processo,
    data_inicio,
    hora_inicio,
    sala_audiencia_nome,
    url_audiencia_virtual,
    responsavel_id,
    tipo_audiencia:tipo_audiencia_id (descricao),
    usuarios:responsavel_id (nome_exibicao)
  `;

  // Tentar buscar audiências de HOJE primeiro
  let query = supabase
    .from('audiencias')
    .select(selectFields)
    .eq('designada', true)
    .gte('data_inicio', `${hojeStr}T00:00:00`)
    .lt('data_inicio', `${hojeStr}T23:59:59`)
    .order('hora_inicio', { ascending: true })
    .limit(limite);

  if (responsavelId) {
    query = query.eq('responsavel_id', responsavelId);
  }

  let { data } = await query;

  // Se não houver audiências hoje, buscar de AMANHÃ
  if (!data?.length) {
    query = supabase
      .from('audiencias')
      .select(selectFields)
      .eq('designada', true)
      .gte('data_inicio', `${amanhaStr}T00:00:00`)
      .lt('data_inicio', `${amanhaStr}T23:59:59`)
      .order('hora_inicio', { ascending: true })
      .limit(limite);

    if (responsavelId) {
      query = query.eq('responsavel_id', responsavelId);
    }

    ({ data } = await query);
  }

  // Se ainda não houver, buscar PRÓXIMAS disponíveis
  if (!data?.length) {
    query = supabase
      .from('audiencias')
      .select(selectFields)
      .eq('designada', true)
      .gte('data_inicio', hoje.toISOString())
      .order('data_inicio', { ascending: true })
      .limit(limite);

    if (responsavelId) {
      query = query.eq('responsavel_id', responsavelId);
    }

    ({ data } = await query);
  }

  return (data || []).map((a) => ({
    id: a.id,
    processo_id: a.processo_id,
    numero_processo: a.numero_processo,
    data_audiencia: a.data_inicio,
    hora_audiencia: a.hora_inicio,
    tipo_audiencia: (a.tipo_audiencia as { descricao?: string })?.descricao || null,
    local: null,
    sala: a.sala_audiencia_nome,
    url_audiencia_virtual: a.url_audiencia_virtual,
    responsavel_id: a.responsavel_id,
    responsavel_nome: (a.usuarios as { nome_exibicao?: string })?.nome_exibicao || null,
  }));
}

/**
 * Obtém total de audiências do mês
 */
export async function getAudienciasMes(): Promise<number> {
  const supabase = createServiceClient();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const fimMes = new Date(inicioMes);
  fimMes.setMonth(fimMes.getMonth() + 1);

  const { count } = await supabase
    .from('audiencias')
    .select('id', { count: 'exact', head: true })
    .gte('data_inicio', inicioMes.toISOString())
    .lt('data_inicio', fimMes.toISOString());

  return count || 0;
}
