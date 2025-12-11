/**
 * Service Layer for Acervo Feature
 * Business logic orchestration
 */

import {
  listarAcervo as listarAcervoDb,
  listarAcervoAgrupado as listarAcervoAgrupadoDb,
  listarAcervoUnificado as listarAcervoUnificadoDb,
  buscarAcervoPorId,
  atribuirResponsavel as atribuirResponsavelDb,
} from './repository';
import type {
  ListarAcervoParams,
  ListarAcervoResult,
  ListarAcervoAgrupadoResult,
  ListarAcervoUnificadoResult,
  ProcessosClienteCpfResponse,
  ProcessoRespostaIA,
  ClienteRespostaIA,
  ResumoProcessosIA,
  ProcessoClienteCpfRow,
} from './types';
import {
  formatarCpf,
  agruparProcessosPorNumero,
  formatarTimeline,
  formatarProcessoParaIA,
  type ProcessoAgrupado,
} from './utils';
import { invalidateAcervoCache } from '@/backend/utils/redis/invalidation';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { obterTimelinePorMongoId } from '@/backend/captura/services/timeline/timeline-persistence.service';
import type { TimelineItemEnriquecido } from '@/backend/types/pje-trt/timeline';

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Lists acervo with filters, pagination, and sorting
 * 
 * Flow:
 * 1. Validates input parameters
 * 2. Applies search filters, origin, TRT, grade, responsible, etc.
 * 3. Applies pagination
 * 4. Applies sorting
 * 5. Returns paginated list of processes
 * 
 * Unification:
 * - If unified=true (default): Groups processes with same numero_processo
 * - If unified=false: Returns all instances separately
 */
export async function obterAcervo(
  params: ListarAcervoParams = {}
): Promise<ListarAcervoResult | ListarAcervoAgrupadoResult | ListarAcervoUnificadoResult> {
  // If agrupar_por is present, use grouping function
  if (params.agrupar_por) {
    return listarAcervoAgrupadoDb(params as ListarAcervoParams & { agrupar_por: string });
  }

  // If unified=true (or not specified, as it's the default), use unification function
  const unified = params.unified ?? true; // Default: true
  if (unified) {
    return listarAcervoUnificadoDb(params);
  }

  // Otherwise, use default listing function (separate instances)
  return listarAcervoDb(params);
}

/**
 * Finds a process by ID
 */
export async function buscarProcessoPorId(id: number) {
  return buscarAcervoPorId(id);
}

/**
 * Assigns responsible user to processes
 * IMPORTANT: Propagates assignment to ALL instances of the same numero_processo
 */
export async function atribuirResponsavel(
  processoIds: number[],
  responsavelId: number | null,
  usuarioExecutouId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate process exists
    const supabase = createServiceClient();
    for (const processoId of processoIds) {
      const { data, error } = await supabase
        .from('acervo')
        .select('id')
        .eq('id', processoId)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: `Processo ${processoId} não encontrado`,
        };
      }
    }

    // Validate responsible exists (if provided)
    if (responsavelId !== null) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', responsavelId)
        .eq('ativo', true)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'Responsável não encontrado ou inativo',
        };
      }
    }

    // Validate executing user exists
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', usuarioExecutouId)
      .eq('ativo', true)
      .single();

    if (errorUsuario || !usuario) {
      return {
        success: false,
        error: 'Usuário não encontrado ou inativo',
      };
    }

    // Assign responsible
    await atribuirResponsavelDb(processoIds, responsavelId);

    // Invalidate cache
    await invalidateAcervoCache();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// ============================================================================
// CPF-based Process Search (for AI Agent)
// ============================================================================

interface TimelineCache {
  [mongoId: string]: TimelineItemEnriquecido[] | null;
}

/**
 * Fetches all necessary timelines from MongoDB in parallel
 */
async function buscarTimelinesEmParalelo(
  processos: ProcessoClienteCpfRow[]
): Promise<TimelineCache> {
  // Collect unique MongoDB IDs
  const mongoIds = new Set<string>();
  for (const processo of processos) {
    if (processo.timeline_mongodb_id) {
      mongoIds.add(processo.timeline_mongodb_id);
    }
  }

  if (mongoIds.size === 0) {
    console.log('ℹ️ [BuscarProcessosCpf] No timelines to fetch');
    return {};
  }

  console.log(`🔍 [BuscarProcessosCpf] Fetching ${mongoIds.size} timelines from MongoDB`);

  // Fetch in parallel
  const cache: TimelineCache = {};
  const promises = Array.from(mongoIds).map(async (mongoId) => {
    try {
      const doc = await obterTimelinePorMongoId(mongoId);
      cache[mongoId] = doc?.timeline ?? null;
    } catch (error) {
      console.error(`❌ [BuscarProcessosCpf] Error fetching timeline ${mongoId}:`, error);
      cache[mongoId] = null;
    }
  });

  await Promise.all(promises);

  const encontradas = Object.values(cache).filter(t => t !== null).length;
  console.log(`✅ [BuscarProcessosCpf] ${encontradas}/${mongoIds.size} timelines found`);

  return cache;
}

/**
 * Calculates statistical summary of processes
 */
function calcularResumo(processos: ProcessoRespostaIA[]): ResumoProcessosIA {
  let comAudienciaProxima = 0;

  for (const processo of processos) {
    const temAudiencia =
      processo.instancias.primeiro_grau?.proxima_audiencia ||
      processo.instancias.segundo_grau?.proxima_audiencia;
    if (temAudiencia) {
      comAudienciaProxima++;
    }
  }

  return {
    total_processos: processos.length,
    com_audiencia_proxima: comAudienciaProxima,
  };
}

/**
 * Searches for processes by client CPF
 * Returns sanitized and formatted data for AI Agent consumption
 */
export async function buscarProcessosClientePorCpf(
  cpf: string
): Promise<ProcessosClienteCpfResponse> {
  // Normalize CPF (remove punctuation)
  const cpfNormalizado = cpf.replace(/\D/g, '');

  if (cpfNormalizado.length !== 11) {
    return {
      success: false,
      error: 'CPF inválido. Deve conter 11 dígitos.',
    };
  }

  console.log(`🔍 [BuscarProcessosCpf] Starting search for CPF ${cpfNormalizado.substring(0, 3)}***`);

  try {
    // 1. Search processes in PostgreSQL
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('processos_cliente_por_cpf')
      .select('*')
      .eq('cpf', cpfNormalizado);

    if (error) {
      throw new Error(`Erro ao buscar processos: ${error.message}`);
    }

    const processosDb = (data || []) as ProcessoClienteCpfRow[];

    if (processosDb.length === 0) {
      console.log('ℹ️ [BuscarProcessosCpf] No processes found');
      return {
        success: false,
        error: 'Nenhum processo encontrado para este CPF.',
      };
    }

    console.log(`✅ [BuscarProcessosCpf] ${processosDb.length} records found in PostgreSQL`);

    // Extract client data (first record is enough, all have same CPF)
    const primeiroRegistro = processosDb[0];
    const cliente: ClienteRespostaIA = {
      nome: primeiroRegistro.cliente_nome,
      cpf: formatarCpf(primeiroRegistro.cpf),
    };

    // 2. Group by numero_processo
    const processosAgrupados = agruparProcessosPorNumero(processosDb);
    console.log(`📊 [BuscarProcessosCpf] ${processosAgrupados.length} unique processes after grouping`);

    // 3. Fetch timelines from MongoDB in parallel
    const timelineCache = await buscarTimelinesEmParalelo(processosDb);

    // 4. Format each process for response
    const processosFormatados: ProcessoRespostaIA[] = [];

    for (const agrupado of processosAgrupados) {
      // Fetch timelines for instances
      const timelinePrimeiroGrau = agrupado.instancias.primeiro_grau?.timeline_mongodb_id
        ? formatarTimeline(timelineCache[agrupado.instancias.primeiro_grau.timeline_mongodb_id] ?? null)
        : [];

      const timelineSegundoGrau = agrupado.instancias.segundo_grau?.timeline_mongodb_id
        ? formatarTimeline(timelineCache[agrupado.instancias.segundo_grau.timeline_mongodb_id] ?? null)
        : [];

      const temTimeline = timelinePrimeiroGrau.length > 0 || timelineSegundoGrau.length > 0;

      // Format process
      const processoFormatado = formatarProcessoParaIA(
        agrupado,
        timelinePrimeiroGrau,
        timelineSegundoGrau,
        {
          timelineStatus: temTimeline ? 'disponivel' : 'indisponivel',
        }
      );

      processosFormatados.push(processoFormatado);
    }

    // 5. Sort by last movement (most recent first)
    processosFormatados.sort((a, b) => {
      const dataA = a.ultima_movimentacao?.data ?? '01/01/1900';
      const dataB = b.ultima_movimentacao?.data ?? '01/01/1900';

      const parseData = (str: string) => {
        const [dia, mes, ano] = str.split('/').map(Number);
        return new Date(ano, mes - 1, dia).getTime();
      };

      return parseData(dataB) - parseData(dataA);
    });

    // 6. Calculate statistical summary
    const resumo = calcularResumo(processosFormatados);

    console.log(`✅ [BuscarProcessosCpf] Response assembled successfully`, {
      cliente: cliente.nome,
      totalProcessos: resumo.total_processos,
      comAudienciaProxima: resumo.com_audiencia_proxima,
    });

    return {
      success: true,
      data: {
        cliente,
        resumo,
        processos: processosFormatados,
      },
    };

  } catch (error) {
    console.error('❌ [BuscarProcessosCpf] Error in search:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno ao buscar processos',
    };
  }
}
