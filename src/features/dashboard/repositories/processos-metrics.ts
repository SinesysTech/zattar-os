/**
 * DASHBOARD FEATURE - Processos Metrics Repository
 *
 * Métricas e estatísticas de processos.
 * Responsabilidades:
 * - Resumo de processos do usuário
 * - Total de processos do escritório
 */

import { createClient } from '@/lib/supabase/server';
import type { ProcessoResumo } from '../domain';

/**
 * Obtém resumo de processos do usuário
 *
 * IMPORTANTE: Contagem baseada em número CNJ único (numero_processo),
 * pois um mesmo processo pode ter múltiplos registros em instâncias diferentes
 * (1º grau, 2º grau/TRT, TST, STF).
 */
export async function buscarProcessosResumo(
  responsavelId?: number
): Promise<ProcessoResumo> {
  const supabase = await createClient();

  let query = supabase
    .from('acervo')
    .select('numero_processo, origem, grau, trt')
    .not('numero_processo', 'is', null)
    .neq('numero_processo', '');

  if (responsavelId) {
    query = query.eq('responsavel_id', responsavelId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar processos:', error);
    throw new Error(`Erro ao buscar processos: ${error.message}`);
  }

  const processos = (data || []).filter(
    (p): p is typeof p & { numero_processo: string } =>
      p.numero_processo !== null &&
      p.numero_processo !== undefined &&
      p.numero_processo.trim() !== ''
  );

  // Contagem por número CNJ único
  const processosUnicos = new Set(processos.map((p) => p.numero_processo));
  const total = processosUnicos.size;

  // Contagem de processos únicos ativos (acervo_geral)
  const processosAtivos = processos.filter((p) => p.origem === 'acervo_geral');
  const ativosUnicos = new Set(processosAtivos.map((p) => p.numero_processo));
  const ativos = ativosUnicos.size;

  // Contagem de processos únicos arquivados
  const processosArquivados = processos.filter((p) => p.origem === 'arquivado');
  const arquivadosUnicos = new Set(processosArquivados.map((p) => p.numero_processo));
  const arquivados = arquivadosUnicos.size;

  // Distribuição por grau (processos únicos por grau)
  // Nota: um processo pode aparecer em múltiplos graus, então agrupamos pelo grau mais alto
  const processosPorGrau = new Map<string, Set<string>>();
  processos.forEach((p) => {
    const grauLabel = p.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau';
    if (!processosPorGrau.has(grauLabel)) {
      processosPorGrau.set(grauLabel, new Set());
    }
    processosPorGrau.get(grauLabel)!.add(p.numero_processo);
  });
  const porGrau = Array.from(processosPorGrau.entries()).map(([grau, processosSet]) => ({
    grau,
    count: processosSet.size,
  }));

  // Distribuição por TRT (processos únicos por TRT)
  const processosPorTRT = new Map<string, Set<string>>();
  processos.forEach((p) => {
    const trt = p.trt?.replace('TRT', '') || 'N/A';
    if (!processosPorTRT.has(trt)) {
      processosPorTRT.set(trt, new Set());
    }
    processosPorTRT.get(trt)!.add(p.numero_processo);
  });
  const porTRT = Array.from(processosPorTRT.entries())
    .map(([trt, processosSet]) => ({ trt, count: processosSet.size }))
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
 *
 * IMPORTANTE: Contagem baseada em número CNJ único (numero_processo),
 * pois um mesmo processo pode ter múltiplos registros em instâncias diferentes.
 */
export async function buscarTotalProcessos(): Promise<{
  total: number;
  ativos: number;
}> {
  const supabase = await createClient();

  // Usar função SQL para contar diretamente no banco (sem limite de 1000 registros)
  const { data: totalData, error: totalError } = await supabase.rpc(
    'count_processos_unicos',
    {
      p_origem: null,
      p_responsavel_id: null,
      p_data_inicio: null,
      p_data_fim: null,
    }
  );

  const { data: ativosData, error: ativosError } = await supabase.rpc(
    'count_processos_unicos',
    {
      p_origem: 'acervo_geral',
      p_responsavel_id: null,
      p_data_inicio: null,
      p_data_fim: null,
    }
  );

  return {
    total: totalError ? 0 : (totalData as number) || 0,
    ativos: ativosError ? 0 : (ativosData as number) || 0,
  };
}
