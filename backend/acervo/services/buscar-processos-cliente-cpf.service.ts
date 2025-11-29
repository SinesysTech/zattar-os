/**
 * Serviço de busca de processos por CPF do cliente
 *
 * Orquestra:
 * - Busca no PostgreSQL (VIEW processos_cliente_por_cpf)
 * - Busca de timelines no MongoDB
 * - Formatação sanitizada para consumo pelo Agente IA
 */

import type {
  ProcessoClienteCpfRow,
  ProcessosClienteCpfResponse,
  ProcessoRespostaIA,
  ClienteIA,
  ResumoProcessosIA,
} from '@/backend/types/acervo/processos-cliente-cpf.types';
import type { TimelineItemEnriquecido } from '@/backend/types/pje-trt/timeline';
import { buscarProcessosPorCpf } from './persistence/buscar-processos-cliente-cpf.service';
import { obterTimelinePorMongoId } from '@/backend/captura/services/timeline/timeline-persistence.service';
import {
  formatarCpf,
  agruparProcessosPorNumero,
  formatarTimeline,
  formatarProcessoParaIA,
} from '../utils/formatar-processo-para-ia';
import {
  sincronizarTimelineEmBackground,
  getMensagemSincronizando,
  type ProcessoParaSincronizar,
} from './sincronizar-timeline-cpf.service';

// ============================================================================
// Tipos Internos
// ============================================================================

interface TimelineCache {
  [mongoId: string]: TimelineItemEnriquecido[] | null;
}

// ============================================================================
// Funções Auxiliares
// ============================================================================

/**
 * Busca todas as timelines necessárias do MongoDB em paralelo
 * Retorna um mapa de mongoId -> timeline
 */
async function buscarTimelinesEmParalelo(
  processos: ProcessoClienteCpfRow[]
): Promise<TimelineCache> {
  // Coletar IDs únicos de MongoDB
  const mongoIds = new Set<string>();
  for (const processo of processos) {
    if (processo.timeline_mongodb_id) {
      mongoIds.add(processo.timeline_mongodb_id);
    }
  }

  if (mongoIds.size === 0) {
    console.log('ℹ️ [BuscarProcessosCpf] Nenhuma timeline para buscar');
    return {};
  }

  console.log(`🔍 [BuscarProcessosCpf] Buscando ${mongoIds.size} timelines do MongoDB`);

  // Buscar em paralelo
  const cache: TimelineCache = {};
  const promises = Array.from(mongoIds).map(async (mongoId) => {
    try {
      const doc = await obterTimelinePorMongoId(mongoId);
      cache[mongoId] = doc?.timeline ?? null;
    } catch (error) {
      console.error(`❌ [BuscarProcessosCpf] Erro ao buscar timeline ${mongoId}:`, error);
      cache[mongoId] = null;
    }
  });

  await Promise.all(promises);

  const encontradas = Object.values(cache).filter(t => t !== null).length;
  console.log(`✅ [BuscarProcessosCpf] ${encontradas}/${mongoIds.size} timelines encontradas`);

  return cache;
}

/**
 * Calcula o resumo estatístico dos processos
 */
function calcularResumo(
  processos: ProcessoRespostaIA[]
): ResumoProcessosIA {
  let emAndamento = 0;
  let arquivados = 0;
  let comAudienciaProxima = 0;

  for (const processo of processos) {
    // Status atual
    const statusLower = processo.status_atual.toLowerCase();
    if (statusLower.includes('arquivado') || statusLower.includes('baixado')) {
      arquivados++;
    } else {
      emAndamento++;
    }

    // Audiência próxima (verificar em ambas instâncias)
    const temAudiencia =
      processo.instancias.primeiro_grau?.proxima_audiencia ||
      processo.instancias.segundo_grau?.proxima_audiencia;
    if (temAudiencia) {
      comAudienciaProxima++;
    }
  }

  return {
    total_processos: processos.length,
    em_andamento: emAndamento,
    arquivados,
    com_audiencia_proxima: comAudienciaProxima,
  };
}

// ============================================================================
// Função Principal
// ============================================================================

/**
 * Busca todos os processos de um cliente pelo CPF
 * Retorna dados sanitizados e formatados para consumo pelo Agente IA WhatsApp
 *
 * @param cpf - CPF do cliente (aceita formato com ou sem pontuação)
 * @returns Resposta formatada com cliente, resumo e processos com timelines
 */
export async function buscarProcessosClientePorCpf(
  cpf: string
): Promise<ProcessosClienteCpfResponse> {
  // Normalizar CPF (remover pontuação)
  const cpfNormalizado = cpf.replace(/\D/g, '');

  if (cpfNormalizado.length !== 11) {
    return {
      success: false,
      error: 'CPF inválido. Deve conter 11 dígitos.',
    };
  }

  console.log(`🔍 [BuscarProcessosCpf] Iniciando busca para CPF ${cpfNormalizado.substring(0, 3)}***`);

  try {
    // 1. Buscar processos no PostgreSQL
    const resultado = await buscarProcessosPorCpf(cpfNormalizado);
    const processosDb = resultado.processos;

    if (processosDb.length === 0) {
      console.log('ℹ️ [BuscarProcessosCpf] Nenhum processo encontrado');
      return {
        success: false,
        error: 'Nenhum processo encontrado para este CPF.',
      };
    }

    console.log(`✅ [BuscarProcessosCpf] ${processosDb.length} registros encontrados no PostgreSQL`);

    // Extrair dados do cliente (primeiro registro serve, todos têm o mesmo CPF)
    const primeiroRegistro = processosDb[0];
    const cliente: ClienteIA = {
      nome: primeiroRegistro.cliente_nome,
      cpf: formatarCpf(primeiroRegistro.cpf),
    };

    // 2. Agrupar por numero_processo (mesmo processo pode ter primeiro e segundo grau)
    const processosAgrupados = agruparProcessosPorNumero(processosDb);
    console.log(`📊 [BuscarProcessosCpf] ${processosAgrupados.length} processos únicos após agrupamento`);

    // 3. Buscar timelines do MongoDB em paralelo
    const timelineCache = await buscarTimelinesEmParalelo(processosDb);

    // 4. Identificar processos sem timeline para sincronização lazy
    const processosSemTimeline: ProcessoParaSincronizar[] = [];

    for (const processo of processosDb) {
      // Só sincronizar se não tem timeline E tem id_pje e advogado_id
      if (!processo.timeline_mongodb_id && processo.id_pje && processo.advogado_id) {
        processosSemTimeline.push({
          processoId: processo.id_pje,
          numeroProcesso: processo.numero_processo,
          trt: processo.trt,
          grau: processo.grau,
          advogadoId: processo.advogado_id,
        });
      }
    }

    // 5. Disparar sincronização em background (fire-and-forget)
    if (processosSemTimeline.length > 0) {
      console.log(`🔄 [BuscarProcessosCpf] ${processosSemTimeline.length} processos sem timeline, disparando sincronização`);
      sincronizarTimelineEmBackground(processosSemTimeline);
    }

    // 6. Formatar cada processo para a resposta
    const processosFormatados: ProcessoRespostaIA[] = [];
    const mensagemSincronizando = getMensagemSincronizando();

    for (const agrupado of processosAgrupados) {
      // Buscar timelines das instâncias
      const timelinePrimeiroGrau = agrupado.instancias.primeiro_grau?.timeline_mongodb_id
        ? formatarTimeline(timelineCache[agrupado.instancias.primeiro_grau.timeline_mongodb_id] ?? null)
        : [];

      const timelineSegundoGrau = agrupado.instancias.segundo_grau?.timeline_mongodb_id
        ? formatarTimeline(timelineCache[agrupado.instancias.segundo_grau.timeline_mongodb_id] ?? null)
        : [];

      // Verificar se este processo está sem timeline e foi disparada sincronização
      const temTimeline = timelinePrimeiroGrau.length > 0 || timelineSegundoGrau.length > 0;
      const estaSincronizando = !temTimeline && processosSemTimeline.some(
        p => p.numeroProcesso === agrupado.numero_processo
      );

      // Formatar processo com status de timeline
      const processoFormatado = formatarProcessoParaIA(
        agrupado,
        timelinePrimeiroGrau,
        timelineSegundoGrau,
        {
          timelineStatus: temTimeline ? 'disponivel' : (estaSincronizando ? 'sincronizando' : 'indisponivel'),
          timelineMensagem: estaSincronizando ? mensagemSincronizando : undefined,
        }
      );

      processosFormatados.push(processoFormatado);
    }

    // 7. Ordenar por última movimentação (mais recentes primeiro)
    processosFormatados.sort((a, b) => {
      const dataA = a.ultima_movimentacao?.data ?? '01/01/1900';
      const dataB = b.ultima_movimentacao?.data ?? '01/01/1900';

      // Converter DD/MM/YYYY para comparação
      const parseData = (str: string) => {
        const [dia, mes, ano] = str.split('/').map(Number);
        return new Date(ano, mes - 1, dia).getTime();
      };

      return parseData(dataB) - parseData(dataA);
    });

    // 8. Calcular resumo estatístico
    const resumo = calcularResumo(processosFormatados);

    console.log(`✅ [BuscarProcessosCpf] Resposta montada com sucesso`, {
      cliente: cliente.nome,
      totalProcessos: resumo.total_processos,
      emAndamento: resumo.em_andamento,
      arquivados: resumo.arquivados,
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
    console.error('❌ [BuscarProcessosCpf] Erro na busca:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno ao buscar processos',
    };
  }
}
