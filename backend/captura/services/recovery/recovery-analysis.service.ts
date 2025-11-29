/**
 * Serviço de Análise de Recuperação
 *
 * PROPÓSITO:
 * Analisa logs de captura do MongoDB e identifica gaps (elementos faltantes)
 * comparando com os dados persistidos no PostgreSQL.
 */

import type { CapturaRawLogDocument } from '@/backend/types/mongodb/captura-log';
import type { EntidadeTipoEndereco } from '@/backend/types/partes/enderecos-types';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { buscarLogPorMongoId } from './captura-recovery.service';
import type {
  AnaliseCaptura,
  ElementoRecuperavel,
  GapsAnalise,
  TotaisAnalise,
  ProcessoRecovery,
  PartePJEPayload,
  EnderecoPJEPayload,
  AnaliseAgregadaParams,
  AnaliseAgregadaResult,
} from './types';
import { getCapturaRawLogsCollection } from '@/backend/utils/mongodb/collections';

// ============================================================================
// Funções de Análise Individual
// ============================================================================

/**
 * Analisa um documento MongoDB e identifica gaps de persistência
 *
 * @param mongoId - ID do documento no MongoDB
 * @returns Análise completa com gaps identificados
 */
export async function analisarCaptura(mongoId: string): Promise<AnaliseCaptura | null> {
  const documento = await buscarLogPorMongoId(mongoId);

  if (!documento) {
    return null;
  }

  return analisarDocumento(documento);
}

/**
 * Analisa um documento MongoDB já carregado
 *
 * @param documento - Documento do MongoDB
 * @returns Análise completa com gaps identificados
 */
export async function analisarDocumento(
  documento: CapturaRawLogDocument
): Promise<AnaliseCaptura> {
  const mongoId = documento._id!.toString();

  // Extrair informações do processo
  const processo = extrairInfoProcesso(documento);

  // Verificar se payload está disponível
  const payloadDisponivel =
    documento.payload_bruto !== null && documento.payload_bruto !== undefined;

  // Se não tem payload, retornar análise sem gaps
  if (!payloadDisponivel) {
    return {
      mongoId,
      capturaLogId: documento.captura_log_id,
      tipoCaptura: documento.tipo_captura,
      dataCaptura: documento.criado_em,
      status: documento.status,
      processo,
      totais: {
        partes: 0,
        partesPersistidas: 0,
        enderecosEsperados: 0,
        enderecosPersistidos: 0,
        representantes: 0,
        representantesPersistidos: 0,
      },
      gaps: {
        enderecosFaltantes: [],
        partesFaltantes: [],
        representantesFaltantes: [],
      },
      payloadDisponivel: false,
      erroOriginal: documento.erro,
    };
  }

  // Extrair partes do payload
  const partes = extrairPartesDoPayload(documento.payload_bruto);

  // Calcular totais e identificar gaps
  const { totais, gaps } = await identificarGaps(partes, processo);

  return {
    mongoId,
    capturaLogId: documento.captura_log_id,
    tipoCaptura: documento.tipo_captura,
    dataCaptura: documento.criado_em,
    status: documento.status,
    processo,
    totais,
    gaps,
    payloadDisponivel: true,
    erroOriginal: documento.erro,
  };
}

// ============================================================================
// Funções de Extração de Dados
// ============================================================================

/**
 * Extrai informações do processo do documento
 */
function extrairInfoProcesso(documento: CapturaRawLogDocument): ProcessoRecovery {
  const requisicao = documento.requisicao as Record<string, unknown> | undefined;
  const resultadoProcessado = documento.resultado_processado as Record<string, unknown> | undefined;

  return {
    id: (resultadoProcessado?.processoId as number) ?? null,
    idPje: (requisicao?.processo_id_pje as number) ?? (requisicao?.id_pje as number) ?? 0,
    numeroProcesso:
      (requisicao?.numero_processo as string) ??
      (resultadoProcessado?.numeroProcesso as string) ??
      'N/A',
    trt: documento.trt,
    grau: documento.grau,
  };
}

/**
 * Extrai partes do payload bruto
 *
 * O payload pode ter diferentes estruturas dependendo do tipo de captura:
 * - Captura de partes: payload.partes[] ou payload diretamente é array
 * - Resultado processado pode ter as partes também
 */
function extrairPartesDoPayload(payload: unknown): PartePJEPayload[] {
  if (!payload) {
    return [];
  }

  // Se payload é array, assume que são as partes diretamente
  if (Array.isArray(payload)) {
    return payload as PartePJEPayload[];
  }

  // Se é objeto, tentar extrair de campos conhecidos
  const payloadObj = payload as Record<string, unknown>;

  // Tentar campo 'partes'
  if (Array.isArray(payloadObj.partes)) {
    return payloadObj.partes as PartePJEPayload[];
  }

  // Tentar campo 'data' (algumas APIs retornam assim)
  if (payloadObj.data && Array.isArray(payloadObj.data)) {
    return payloadObj.data as PartePJEPayload[];
  }

  // Tentar campo 'content'
  if (payloadObj.content && Array.isArray(payloadObj.content)) {
    return payloadObj.content as PartePJEPayload[];
  }

  return [];
}

// ============================================================================
// Funções de Identificação de Gaps
// ============================================================================

/**
 * Identifica gaps entre payload e banco de dados
 */
async function identificarGaps(
  partes: PartePJEPayload[],
  processo: ProcessoRecovery
): Promise<{ totais: TotaisAnalise; gaps: GapsAnalise }> {
  const totais: TotaisAnalise = {
    partes: partes.length,
    partesPersistidas: 0,
    enderecosEsperados: 0,
    enderecosPersistidos: 0,
    representantes: 0,
    representantesPersistidos: 0,
  };

  const gaps: GapsAnalise = {
    enderecosFaltantes: [],
    partesFaltantes: [],
    representantesFaltantes: [],
  };

  const supabase = createServiceClient();

  for (const parte of partes) {
    if (!parte.numeroDocumento) {
      continue;
    }

    // Identificar tipo de entidade baseado no polo
    const entidadeTipo = identificarTipoEntidade(parte);

    // Verificar se parte existe no banco
    const entidadeInfo = await buscarEntidadePorDocumento(
      supabase,
      entidadeTipo,
      parte.numeroDocumento
    );

    if (entidadeInfo) {
      totais.partesPersistidas++;

      // Verificar endereço se a parte tem endereço no payload
      if (parte.dadosCompletos?.endereco) {
        totais.enderecosEsperados++;
        const enderecoExiste = await verificarEnderecoExiste(
          supabase,
          entidadeTipo,
          entidadeInfo.id,
          parte.dadosCompletos.endereco as EnderecoPJEPayload
        );

        if (enderecoExiste) {
          totais.enderecosPersistidos++;
        } else {
          // Gap de endereço identificado
          gaps.enderecosFaltantes.push({
            tipo: 'endereco',
            identificador: String(parte.dadosCompletos.endereco.id ?? parte.numeroDocumento),
            nome: `Endereço de ${parte.nome}`,
            dadosBrutos: parte.dadosCompletos.endereco as unknown as Record<string, unknown>,
            statusPersistencia: 'faltando',
            contexto: {
              entidadeId: entidadeInfo.id,
              entidadeTipo,
            },
          });
        }
      }

      // Verificar representantes
      if (parte.representantes && Array.isArray(parte.representantes)) {
        totais.representantes += parte.representantes.length;

        for (const rep of parte.representantes) {
          if (!rep.numeroDocumento) continue;

          const repExiste = await verificarRepresentanteExiste(supabase, rep.numeroDocumento);
          if (repExiste) {
            totais.representantesPersistidos++;
          } else {
            gaps.representantesFaltantes.push({
              tipo: 'representante',
              identificador: rep.numeroDocumento,
              nome: rep.nome ?? 'Representante',
              dadosBrutos: rep as unknown as Record<string, unknown>,
              statusPersistencia: 'faltando',
              contexto: {
                entidadeId: entidadeInfo.id,
                entidadeTipo,
              },
            });
          }
        }
      }
    } else {
      // Parte não existe no banco
      gaps.partesFaltantes.push({
        tipo: 'parte',
        identificador: parte.numeroDocumento,
        nome: parte.nome ?? 'Parte',
        dadosBrutos: parte as unknown as Record<string, unknown>,
        statusPersistencia: 'faltando',
      });

      // Se parte não existe, endereços também estão faltando
      if (parte.dadosCompletos?.endereco) {
        totais.enderecosEsperados++;
        gaps.enderecosFaltantes.push({
          tipo: 'endereco',
          identificador: String(parte.dadosCompletos.endereco.id ?? parte.numeroDocumento),
          nome: `Endereço de ${parte.nome}`,
          dadosBrutos: parte.dadosCompletos.endereco as unknown as Record<string, unknown>,
          statusPersistencia: 'faltando',
          erro: 'Parte principal não existe no banco',
        });
      }
    }
  }

  return { totais, gaps };
}

/**
 * Identifica o tipo de entidade baseado no polo da parte
 */
function identificarTipoEntidade(parte: PartePJEPayload): EntidadeTipoEndereco {
  const polo = parte.polo?.toUpperCase();
  const tipoDescricao = parte.tipoParte?.descricao?.toUpperCase();

  // Se for polo ativo (autor/reclamante), geralmente é cliente
  if (polo === 'AT' || polo === 'ATIVO') {
    return 'cliente';
  }

  // Se for polo passivo (réu/reclamado), geralmente é parte contrária
  if (polo === 'PA' || polo === 'PASSIVO') {
    return 'parte_contraria';
  }

  // Verificar por tipo de parte
  if (tipoDescricao) {
    if (tipoDescricao.includes('PERITO') || tipoDescricao.includes('TESTEMUNHA') || tipoDescricao.includes('MINISTÉRIO')) {
      return 'terceiro';
    }
  }

  // Default: parte_contraria
  return 'parte_contraria';
}

/**
 * Busca entidade por documento (CPF/CNPJ)
 */
async function buscarEntidadePorDocumento(
  supabase: ReturnType<typeof createServiceClient>,
  tipo: EntidadeTipoEndereco,
  documento: string
): Promise<{ id: number } | null> {
  const documentoLimpo = documento.replace(/\D/g, '');
  const isCpf = documentoLimpo.length === 11;
  const campo = isCpf ? 'cpf' : 'cnpj';

  let tabela: string;
  switch (tipo) {
    case 'cliente':
      tabela = 'clientes';
      break;
    case 'parte_contraria':
      tabela = 'partes_contrarias';
      break;
    case 'terceiro':
      tabela = 'terceiros';
      break;
    default:
      return null;
  }

  const { data, error } = await supabase
    .from(tabela)
    .select('id')
    .eq(campo, documentoLimpo)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return { id: data.id };
}

/**
 * Verifica se endereço existe para uma entidade
 */
async function verificarEnderecoExiste(
  supabase: ReturnType<typeof createServiceClient>,
  entidadeTipo: EntidadeTipoEndereco,
  entidadeId: number,
  enderecoPJE: EnderecoPJEPayload
): Promise<boolean> {
  // Primeiro tenta buscar por id_pje se disponível
  if (enderecoPJE.id) {
    const { data } = await supabase
      .from('enderecos')
      .select('id')
      .eq('id_pje', enderecoPJE.id)
      .eq('entidade_tipo', entidadeTipo)
      .eq('entidade_id', entidadeId)
      .maybeSingle();

    if (data) {
      return true;
    }
  }

  // Se não tem id_pje ou não encontrou, buscar por entidade
  const { data } = await supabase
    .from('enderecos')
    .select('id')
    .eq('entidade_tipo', entidadeTipo)
    .eq('entidade_id', entidadeId)
    .eq('ativo', true)
    .limit(1)
    .maybeSingle();

  return !!data;
}

/**
 * Verifica se representante existe por CPF
 */
async function verificarRepresentanteExiste(
  supabase: ReturnType<typeof createServiceClient>,
  documento: string
): Promise<boolean> {
  const documentoLimpo = documento.replace(/\D/g, '');

  const { data } = await supabase
    .from('representantes')
    .select('id')
    .eq('cpf', documentoLimpo)
    .maybeSingle();

  return !!data;
}

// ============================================================================
// Funções de Análise Agregada
// ============================================================================

/**
 * Realiza análise agregada de gaps em múltiplos logs
 */
export async function analisarGapsAgregado(
  params: AnaliseAgregadaParams
): Promise<AnaliseAgregadaResult> {
  const collection = await getCapturaRawLogsCollection();

  // Construir filtro
  const matchStage: Record<string, unknown> = {
    status: 'success', // Apenas logs de sucesso (podem ter gaps)
    payload_bruto: { $ne: null }, // Apenas com payload disponível
  };

  if (params.capturaLogId) {
    matchStage.captura_log_id = params.capturaLogId;
  }

  if (params.tipoCaptura) {
    matchStage.tipo_captura = params.tipoCaptura;
  }

  if (params.trt) {
    matchStage.trt = params.trt;
  }

  if (params.grau) {
    matchStage.grau = params.grau;
  }

  if (params.dataInicio || params.dataFim) {
    matchStage.criado_em = {};
    if (params.dataInicio) {
      (matchStage.criado_em as Record<string, Date>).$gte = new Date(params.dataInicio);
    }
    if (params.dataFim) {
      (matchStage.criado_em as Record<string, Date>).$lte = new Date(params.dataFim);
    }
  }

  // Buscar documentos (limitado para performance)
  const documentos = await collection
    .find(matchStage)
    .limit(1000)
    .toArray();

  let totalLogs = documentos.length;
  let logsComGaps = 0;
  const resumoGaps = { enderecos: 0, partes: 0, representantes: 0 };
  const processosGaps: Map<string, { trt: string; gaps: number }> = new Map();
  const trtStats: Map<string, { total: number; gaps: number }> = new Map();

  for (const doc of documentos) {
    const analise = await analisarDocumento(doc);

    const totalGapsDoc =
      analise.gaps.enderecosFaltantes.length +
      analise.gaps.partesFaltantes.length +
      analise.gaps.representantesFaltantes.length;

    // Atualizar estatísticas de TRT
    const trtKey = analise.processo.trt;
    const trtStat = trtStats.get(trtKey) || { total: 0, gaps: 0 };
    trtStat.total++;
    trtStat.gaps += totalGapsDoc;
    trtStats.set(trtKey, trtStat);

    if (totalGapsDoc > 0) {
      logsComGaps++;
      resumoGaps.enderecos += analise.gaps.enderecosFaltantes.length;
      resumoGaps.partes += analise.gaps.partesFaltantes.length;
      resumoGaps.representantes += analise.gaps.representantesFaltantes.length;

      // Registrar processo com gaps
      const processoKey = analise.processo.numeroProcesso;
      const processoStat = processosGaps.get(processoKey) || { trt: trtKey, gaps: 0 };
      processoStat.gaps += totalGapsDoc;
      processosGaps.set(processoKey, processoStat);
    }
  }

  // Top processos com gaps
  const topProcessosComGaps = Array.from(processosGaps.entries())
    .map(([numeroProcesso, stat]) => ({
      numeroProcesso,
      trt: stat.trt,
      totalGaps: stat.gaps,
    }))
    .sort((a, b) => b.totalGaps - a.totalGaps)
    .slice(0, 10);

  // Distribuição por TRT
  const distribuicaoPorTrt = Array.from(trtStats.entries())
    .map(([trt, stat]) => ({
      trt,
      totalLogs: stat.total,
      totalGaps: stat.gaps,
    }))
    .sort((a, b) => a.trt.localeCompare(b.trt));

  return {
    totalLogs,
    logsComGaps,
    resumoGaps,
    topProcessosComGaps,
    distribuicaoPorTrt,
  };
}

/**
 * Verifica rapidamente se um log possui gaps (sem análise completa)
 */
export async function verificarSeLogPossuiGaps(mongoId: string): Promise<boolean> {
  const analise = await analisarCaptura(mongoId);
  if (!analise) return false;

  return (
    analise.gaps.enderecosFaltantes.length > 0 ||
    analise.gaps.partesFaltantes.length > 0 ||
    analise.gaps.representantesFaltantes.length > 0
  );
}

// ============================================================================
// Extração de Todos os Elementos
// ============================================================================

/**
 * Resultado da extração de todos os elementos
 */
export interface TodosElementosResult {
  partes: ElementoRecuperavel[];
  enderecos: ElementoRecuperavel[];
  representantes: ElementoRecuperavel[];
  totais: {
    partes: number;
    partesExistentes: number;
    partesFaltantes: number;
    enderecos: number;
    enderecosExistentes: number;
    enderecosFaltantes: number;
    representantes: number;
    representantesExistentes: number;
    representantesFaltantes: number;
  };
}

/**
 * Extrai TODOS os elementos do payload (não apenas gaps)
 * Verifica o status de persistência de cada um no PostgreSQL
 *
 * @param mongoId - ID do documento no MongoDB
 * @returns Todos os elementos com status de persistência
 */
export async function extrairTodosElementos(
  mongoId: string
): Promise<TodosElementosResult | null> {
  const documento = await buscarLogPorMongoId(mongoId);

  if (!documento || !documento.payload_bruto) {
    return null;
  }

  const supabase = createServiceClient();
  const partes = extrairPartesDoPayload(documento.payload_bruto);

  const elementosPartes: ElementoRecuperavel[] = [];
  const elementosEnderecos: ElementoRecuperavel[] = [];
  const elementosRepresentantes: ElementoRecuperavel[] = [];

  const totais = {
    partes: 0,
    partesExistentes: 0,
    partesFaltantes: 0,
    enderecos: 0,
    enderecosExistentes: 0,
    enderecosFaltantes: 0,
    representantes: 0,
    representantesExistentes: 0,
    representantesFaltantes: 0,
  };

  for (const parte of partes) {
    if (!parte.numeroDocumento) {
      continue;
    }

    totais.partes++;

    // Identificar tipo de entidade baseado no polo
    const entidadeTipo = identificarTipoEntidade(parte);

    // Verificar se parte existe no banco
    const entidadeInfo = await buscarEntidadePorDocumento(
      supabase,
      entidadeTipo,
      parte.numeroDocumento
    );

    const parteExiste = !!entidadeInfo;

    if (parteExiste) {
      totais.partesExistentes++;
    } else {
      totais.partesFaltantes++;
    }

    // Adicionar parte à lista
    elementosPartes.push({
      tipo: 'parte',
      identificador: parte.numeroDocumento,
      nome: parte.nome ?? 'Parte sem nome',
      dadosBrutos: parte as unknown as Record<string, unknown>,
      statusPersistencia: parteExiste ? 'existente' : 'faltando',
      contexto: {
        entidadeId: entidadeInfo?.id,
        entidadeTipo,
      },
    });

    // Processar endereço se a parte tem endereço no payload
    if (parte.dadosCompletos?.endereco) {
      totais.enderecos++;
      const enderecoPJE = parte.dadosCompletos.endereco as EnderecoPJEPayload;

      let enderecoExiste = false;
      let enderecoId: number | undefined;

      if (entidadeInfo) {
        const enderecoInfo = await buscarEnderecoExistente(
          supabase,
          entidadeTipo,
          entidadeInfo.id,
          enderecoPJE
        );
        enderecoExiste = !!enderecoInfo;
        enderecoId = enderecoInfo?.id;
      }

      if (enderecoExiste) {
        totais.enderecosExistentes++;
      } else {
        totais.enderecosFaltantes++;
      }

      elementosEnderecos.push({
        tipo: 'endereco',
        identificador: String(enderecoPJE.id ?? parte.numeroDocumento),
        nome: `Endereço de ${parte.nome ?? parte.numeroDocumento}`,
        dadosBrutos: enderecoPJE as unknown as Record<string, unknown>,
        statusPersistencia: enderecoExiste ? 'existente' : 'faltando',
        contexto: {
          entidadeId: entidadeInfo?.id,
          entidadeTipo,
          enderecoId,
        },
        erro: !entidadeInfo ? 'Parte principal não existe no banco' : undefined,
      });
    }

    // Processar representantes
    if (parte.representantes && Array.isArray(parte.representantes)) {
      for (const rep of parte.representantes) {
        if (!rep.numeroDocumento) continue;

        totais.representantes++;

        const repInfo = await buscarRepresentanteExistente(supabase, rep.numeroDocumento);
        const repExiste = !!repInfo;

        if (repExiste) {
          totais.representantesExistentes++;
        } else {
          totais.representantesFaltantes++;
        }

        elementosRepresentantes.push({
          tipo: 'representante',
          identificador: rep.numeroDocumento,
          nome: rep.nome ?? 'Representante sem nome',
          dadosBrutos: rep as unknown as Record<string, unknown>,
          statusPersistencia: repExiste ? 'existente' : 'faltando',
          contexto: {
            entidadeId: repInfo?.id ?? entidadeInfo?.id,
            entidadeTipo,
          },
        });

        // Endereço do representante
        if (rep.dadosCompletos?.endereco) {
          totais.enderecos++;
          const enderecoRepPJE = rep.dadosCompletos.endereco as EnderecoPJEPayload;

          // Verificar se endereço do representante existe
          // Para representantes, usamos tipo 'representante' se existir na tabela
          let enderecoRepExiste = false;

          if (repInfo) {
            const enderecoRepInfo = await supabase
              .from('enderecos')
              .select('id')
              .eq('entidade_tipo', 'representante')
              .eq('entidade_id', repInfo.id)
              .eq('ativo', true)
              .maybeSingle();

            enderecoRepExiste = !!enderecoRepInfo.data;

            if (enderecoRepExiste) {
              totais.enderecosExistentes++;
            } else {
              totais.enderecosFaltantes++;
            }
          } else {
            totais.enderecosFaltantes++;
          }

          elementosEnderecos.push({
            tipo: 'endereco',
            identificador: String(enderecoRepPJE.id ?? `rep-${rep.numeroDocumento}`),
            nome: `Endereço de ${rep.nome ?? 'Representante'}`,
            dadosBrutos: enderecoRepPJE as unknown as Record<string, unknown>,
            statusPersistencia: enderecoRepExiste ? 'existente' : 'faltando',
            contexto: {
              entidadeId: repInfo?.id,
              entidadeTipo: 'representante' as EntidadeTipoEndereco,
            },
            erro: !repInfo ? 'Representante não existe no banco' : undefined,
          });
        }
      }
    }
  }

  return {
    partes: elementosPartes,
    enderecos: elementosEnderecos,
    representantes: elementosRepresentantes,
    totais,
  };
}

/**
 * Busca endereço existente para uma entidade
 */
async function buscarEnderecoExistente(
  supabase: ReturnType<typeof createServiceClient>,
  entidadeTipo: EntidadeTipoEndereco,
  entidadeId: number,
  enderecoPJE: EnderecoPJEPayload
): Promise<{ id: number } | null> {
  // Primeiro tenta buscar por id_pje se disponível
  if (enderecoPJE.id) {
    const { data } = await supabase
      .from('enderecos')
      .select('id')
      .eq('id_pje', enderecoPJE.id)
      .eq('entidade_tipo', entidadeTipo)
      .eq('entidade_id', entidadeId)
      .maybeSingle();

    if (data) {
      return { id: data.id };
    }
  }

  // Se não tem id_pje ou não encontrou, buscar por entidade
  const { data } = await supabase
    .from('enderecos')
    .select('id')
    .eq('entidade_tipo', entidadeTipo)
    .eq('entidade_id', entidadeId)
    .eq('ativo', true)
    .limit(1)
    .maybeSingle();

  return data ? { id: data.id } : null;
}

/**
 * Busca representante existente por CPF
 */
async function buscarRepresentanteExistente(
  supabase: ReturnType<typeof createServiceClient>,
  documento: string
): Promise<{ id: number } | null> {
  const documentoLimpo = documento.replace(/\D/g, '');

  const { data } = await supabase
    .from('representantes')
    .select('id')
    .eq('cpf', documentoLimpo)
    .maybeSingle();

  return data ? { id: data.id } : null;
}

