/**
 * Persistência de dados de processos para Dashboard
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { ProcessoResumo } from '@/backend/types/dashboard/types';

/**
 * Obtém resumo de processos do usuário
 */
export async function getProcessosResumo(
  responsavelId?: number
): Promise<ProcessoResumo> {
  const supabase = createServiceClient();

  // Query base
  let query = supabase.from('acervo').select('id, origem, grau, trt', { count: 'exact' });

  // Filtrar por responsável se informado
  if (responsavelId) {
    query = query.eq('responsavel_id', responsavelId);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Erro ao buscar processos:', error);
    throw new Error(`Erro ao buscar processos: ${error.message}`);
  }

  const processos = data || [];
  const total = count || 0;

  // Calcular ativos e arquivados
  const ativos = processos.filter((p) => p.origem === 'acervo_geral').length;
  const arquivados = processos.filter((p) => p.origem === 'arquivado').length;

  // Agrupar por grau
  const porGrauMap = new Map<string, number>();
  processos.forEach((p) => {
    const grauLabel = p.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau';
    porGrauMap.set(grauLabel, (porGrauMap.get(grauLabel) || 0) + 1);
  });
  const porGrau = Array.from(porGrauMap.entries()).map(([grau, count]) => ({
    grau,
    count,
  }));

  // Agrupar por TRT
  const porTRTMap = new Map<string, number>();
  processos.forEach((p) => {
    const trt = p.trt?.replace('TRT', '') || 'N/A';
    porTRTMap.set(trt, (porTRTMap.get(trt) || 0) + 1);
  });
  const porTRT = Array.from(porTRTMap.entries())
    .map(([trt, count]) => ({ trt, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    ativos,
    arquivados,
    porGrau,
    porTRT,
  };
}

/**
 * Obtém total de processos do escritório
 */
export async function getTotalProcessos(): Promise<{
  total: number;
  ativos: number;
}> {
  const supabase = createServiceClient();

  const { count: total } = await supabase
    .from('acervo')
    .select('id', { count: 'exact', head: true });

  const { count: ativos } = await supabase
    .from('acervo')
    .select('id', { count: 'exact', head: true })
    .eq('origem', 'acervo_geral');

  return {
    total: total || 0,
    ativos: ativos || 0,
  };
}
