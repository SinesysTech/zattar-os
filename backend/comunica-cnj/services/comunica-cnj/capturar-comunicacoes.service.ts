/**
 * Serviço de captura de comunicações CNJ
 * Busca comunicações na API, persiste no banco e vincula com expedientes
 * 
 * ⚠️ SERVIÇO LEGADO - DEPRECATED ⚠️
 * 
 * Este serviço está sendo substituído por `src/core/comunica-cnj/service.ts`.
 * 
 * **MIGRE PARA:**
 * - `sincronizarComunicacoes()` em `@/core/comunica-cnj`
 * 
 * @deprecated Use `src/core/comunica-cnj` para novas integrações
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { getComunicaCNJClient } from '../../client/comunica-cnj-client';
import type {
  CapturaResult,
  CapturaStats,
  ComunicacaoItem,
  ExecutarCapturaParams,
  GrauTribunal,
  InserirComunicaCNJParams,
} from '../../types/types';
import {
  inserirComunicacao,
  buscarPorHash,
  buscarExpedienteCorrespondente,
} from '../persistence/comunica-cnj-persistence.service';
import {
  inferirGrau,
  obterNomeParteAutora,
  obterNomeParteRe,
  contarPartes,
  normalizarNumeroProcesso,
} from './utils';

// =============================================================================
// CAPTURA PRINCIPAL
// =============================================================================

/**
 * Executa captura de comunicações CNJ
 *
 * Fluxo:
 * 1. Busca comunicações na API do CNJ (por OAB ou parâmetros)
 * 2. Para cada comunicação:
 *    a. Verifica se já existe (by hash) -> skip
 *    b. Tenta encontrar expediente correspondente (match)
 *    c. Se não encontrar, cria novo expediente com origem='comunica_cnj'
 *    d. Insere comunicação vinculada ao expediente
 *
 * @param params - Parâmetros de captura
 * @returns Resultado com estatísticas
 */
export async function executarCaptura(
  params: ExecutarCapturaParams
): Promise<CapturaResult> {
  const client = getComunicaCNJClient();
  const stats: CapturaStats = {
    total: 0,
    novos: 0,
    duplicados: 0,
    vinculados: 0,
    expedientesCriados: 0,
    erros: 0,
  };
  const errors: string[] = [];

  try {
    console.log('[capturar-comunicacoes] Iniciando captura:', params);

    // Busca comunicações na API
    let pagina = 1;
    let temMaisPaginas = true;

    while (temMaisPaginas) {
      const { data } = await client.consultarComunicacoes({
        numeroOab: params.numero_oab,
        ufOab: params.uf_oab,
        siglaTribunal: params.sigla_tribunal,
        dataInicio: params.data_inicio,
        dataFim: params.data_fim,
        pagina,
        itensPorPagina: 100,
      });

      stats.total += data.comunicacoes.length;

      // Processa cada comunicação
      for (const comunicacao of data.comunicacoes) {
        try {
          const resultado = await processarComunicacao(
            comunicacao,
            params.advogado_id
          );

          switch (resultado.status) {
            case 'novo':
              stats.novos++;
              if (resultado.expedienteCriado) {
                stats.expedientesCriados++;
              }
              if (resultado.vinculado) {
                stats.vinculados++;
              }
              break;
            case 'duplicado':
              stats.duplicados++;
              break;
            case 'erro':
              stats.erros++;
              if (resultado.erro) {
                errors.push(resultado.erro);
              }
              break;
          }
        } catch (error) {
          stats.erros++;
          const msg =
            error instanceof Error ? error.message : 'Erro desconhecido';
          errors.push(`Erro ao processar comunicação ${comunicacao.hash}: ${msg}`);
          console.error(
            '[capturar-comunicacoes] Erro ao processar comunicação:',
            error
          );
        }
      }

      // Verifica se há mais páginas
      temMaisPaginas = pagina < data.paginacao.totalPaginas;
      pagina++;
    }

    console.log('[capturar-comunicacoes] Captura finalizada:', stats);

    return {
      success: true,
      stats,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[capturar-comunicacoes] Erro na captura:', error);

    return {
      success: false,
      stats,
      errors: [msg, ...errors],
    };
  }
}

// =============================================================================
// PROCESSAMENTO INDIVIDUAL
// =============================================================================

interface ProcessamentoResult {
  status: 'novo' | 'duplicado' | 'erro';
  vinculado?: boolean;
  expedienteCriado?: boolean;
  erro?: string;
}

/**
 * Processa uma comunicação individual
 *
 * @param comunicacao - Comunicação da API
 * @param advogadoId - ID do advogado que está capturando
 * @returns Resultado do processamento
 */
async function processarComunicacao(
  comunicacao: ComunicacaoItem,
  advogadoId?: number
): Promise<ProcessamentoResult> {
  // 1. Verifica se já existe
  const existente = await buscarPorHash(comunicacao.hash);
  if (existente) {
    return { status: 'duplicado' };
  }

  // 2. Infere grau do tribunal
  const grau = inferirGrau(comunicacao.nomeOrgao, comunicacao.siglaTribunal);

  // 3. Normaliza número do processo
  const numeroProcesso = normalizarNumeroProcesso(comunicacao.numeroProcesso);

  // 4. Tenta encontrar expediente correspondente
  let expedienteId = await buscarExpedienteCorrespondente(
    numeroProcesso,
    comunicacao.siglaTribunal,
    grau,
    comunicacao.dataDisponibilizacao
  );

  let expedienteCriado = false;

  // 5. Se não encontrou, cria novo expediente
  if (!expedienteId) {
    try {
      expedienteId = await criarExpedienteFromComunicacao(comunicacao, grau);
      expedienteCriado = true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao criar expediente';
      console.error('[capturar-comunicacoes] Erro ao criar expediente:', error);
      return { status: 'erro', erro: msg };
    }
  }

  // 6. Insere comunicação
  const dadosComunicacao: InserirComunicaCNJParams = {
    id_cnj: comunicacao.id,
    hash: comunicacao.hash,
    numero_comunicacao: comunicacao.numeroComunicacao,
    numero_processo: numeroProcesso,
    numero_processo_mascara: comunicacao.numeroProcessoComMascara,
    sigla_tribunal: comunicacao.siglaTribunal,
    orgao_id: comunicacao.idOrgao,
    nome_orgao: comunicacao.nomeOrgao,
    tipo_comunicacao: comunicacao.tipoComunicacao,
    tipo_documento: comunicacao.tipoDocumento,
    nome_classe: comunicacao.nomeClasse,
    codigo_classe: comunicacao.codigoClasse,
    meio: comunicacao.meio,
    meio_completo: comunicacao.meioCompleto,
    texto: comunicacao.texto,
    link: comunicacao.link,
    data_disponibilizacao: comunicacao.dataDisponibilizacao,
    ativo: comunicacao.ativo,
    status: comunicacao.status,
    motivo_cancelamento: comunicacao.motivoCancelamento ?? null,
    data_cancelamento: comunicacao.dataCancelamento ?? null,
    destinatarios: comunicacao.destinatarios,
    destinatarios_advogados: comunicacao.destinatarioAdvogados,
    expediente_id: expedienteId,
    advogado_id: advogadoId ?? null,
    metadados: comunicacao as unknown as Record<string, unknown>,
  };

  const comunicacaoInserida = await inserirComunicacao(dadosComunicacao);

  if (!comunicacaoInserida) {
    return { status: 'duplicado' };
  }

  return {
    status: 'novo',
    vinculado: expedienteId !== null,
    expedienteCriado,
  };
}

// =============================================================================
// CRIAÇÃO DE EXPEDIENTE
// =============================================================================

/**
 * Busca data de autuação real do processo na tabela acervo
 *
 * @param numeroProcesso - Número do processo normalizado
 * @param siglaTribunal - Sigla do tribunal (TRT3, TRT19, etc.)
 * @param grau - Grau do tribunal
 * @returns Data de autuação e ID do processo, ou null se não encontrado
 */
async function buscarDataAutuacaoDoAcervo(
  numeroProcesso: string,
  siglaTribunal: string,
  grau: GrauTribunal
): Promise<{ dataAutuacao: string; processoId: number } | null> {
  const supabase = createServiceClient();

  // Primeiro tenta buscar pelo grau exato
  const { data: processoGrauExato } = await supabase
    .from('acervo')
    .select('id, data_autuacao')
    .eq('numero_processo', numeroProcesso)
    .eq('trt', siglaTribunal)
    .eq('grau', grau)
    .limit(1)
    .single();

  if (processoGrauExato?.data_autuacao) {
    return {
      dataAutuacao: processoGrauExato.data_autuacao,
      processoId: processoGrauExato.id,
    };
  }

  // Se não encontrou, tenta buscar pelo primeiro grau (data de autuação original)
  if (grau !== 'primeiro_grau') {
    const { data: processoPrimeiroGrau } = await supabase
      .from('acervo')
      .select('id, data_autuacao')
      .eq('numero_processo', numeroProcesso)
      .eq('trt', siglaTribunal)
      .eq('grau', 'primeiro_grau')
      .limit(1)
      .single();

    if (processoPrimeiroGrau?.data_autuacao) {
      return {
        dataAutuacao: processoPrimeiroGrau.data_autuacao,
        processoId: processoPrimeiroGrau.id,
      };
    }
  }

  // Última tentativa: qualquer registro desse processo nesse tribunal
  const { data: processoQualquer } = await supabase
    .from('acervo')
    .select('id, data_autuacao')
    .eq('numero_processo', numeroProcesso)
    .eq('trt', siglaTribunal)
    .order('data_autuacao', { ascending: true })
    .limit(1)
    .single();

  if (processoQualquer?.data_autuacao) {
    return {
      dataAutuacao: processoQualquer.data_autuacao,
      processoId: processoQualquer.id,
    };
  }

  return null;
}

/**
 * Cria expediente a partir de comunicação CNJ
 *
 * @param comunicacao - Comunicação da API
 * @param grau - Grau inferido
 * @returns ID do expediente criado
 */
async function criarExpedienteFromComunicacao(
  comunicacao: ComunicacaoItem,
  grau: GrauTribunal
): Promise<number> {
  const supabase = createServiceClient();

  const numeroProcesso = normalizarNumeroProcesso(comunicacao.numeroProcesso);
  const nomeParteAutora = obterNomeParteAutora(comunicacao.destinatarios);
  const nomeParteRe = obterNomeParteRe(comunicacao.destinatarios);
  const { qtdePoloAtivo, qtdePoloPassivo } = contarPartes(comunicacao.destinatarios);

  // Busca data de autuação real do acervo
  const dadosAcervo = await buscarDataAutuacaoDoAcervo(
    numeroProcesso,
    comunicacao.siglaTribunal,
    grau
  );

  // Gera id_pje único negativo para expedientes criados via CNJ
  // Usamos timestamp negativo para garantir unicidade
  const idPje = -Date.now();

  const expedienteData = {
    id_pje: idPje,
    advogado_id: null,
    processo_id: dadosAcervo?.processoId ?? null, // Vincula ao processo se encontrado no acervo
    trt: comunicacao.siglaTribunal,
    grau,
    numero_processo: numeroProcesso,
    descricao_orgao_julgador: comunicacao.nomeOrgao || 'Não especificado',
    classe_judicial: comunicacao.nomeClasse || 'Não especificado',
    numero: 0,
    segredo_justica: false,
    codigo_status_processo: 'DISTRIBUIDO',
    prioridade_processual: 0,
    nome_parte_autora: nomeParteAutora,
    qtde_parte_autora: qtdePoloAtivo,
    nome_parte_re: nomeParteRe,
    qtde_parte_re: qtdePoloPassivo,
    data_autuacao: dadosAcervo?.dataAutuacao ?? null, // Data real do acervo ou null
    juizo_digital: false,
    data_arquivamento: null,
    id_documento: null,
    data_ciencia_parte: comunicacao.dataDisponibilizacao, // Data de ciência = data de disponibilização da comunicação
    data_prazo_legal_parte: null, // Data fim do prazo deve ser preenchida pelo usuário após análise
    data_criacao_expediente: comunicacao.dataDisponibilizacao,
    prazo_vencido: false,
    sigla_orgao_julgador: null,
    dados_anteriores: null,
    responsavel_id: null,
    baixado_em: null,
    protocolo_id: null,
    justificativa_baixa: null,
    tipo_expediente_id: null,
    descricao_arquivos: comunicacao.tipoComunicacao || 'Comunicação CNJ',
    arquivo_nome: null,
    arquivo_url: null,
    arquivo_bucket: null,
    arquivo_key: null,
    observacoes: null,
    origem: 'comunica_cnj',
  };

  const { data, error } = await supabase
    .from('expedientes')
    .insert(expedienteData)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Erro ao criar expediente: ${error.message}`);
  }

  console.log('[capturar-comunicacoes] Expediente criado:', {
    id: data.id,
    numeroProcesso,
    trt: comunicacao.siglaTribunal,
    dataAutuacao: dadosAcervo?.dataAutuacao ?? 'não encontrada no acervo',
    processoVinculado: dadosAcervo?.processoId ?? 'não vinculado',
  });

  return data.id;
}

// =============================================================================
// CAPTURA POR ADVOGADO
// =============================================================================

/**
 * Executa captura para um advogado específico
 *
 * @param advogadoId - ID do advogado
 * @returns Resultado da captura
 */
export async function executarCapturaPorAdvogado(
  advogadoId: number
): Promise<CapturaResult> {
  const supabase = createServiceClient();

  // Busca dados do advogado
  const { data: advogado, error } = await supabase
    .from('advogados')
    .select('id, numero_oab, uf_oab')
    .eq('id', advogadoId)
    .single();

  if (error || !advogado) {
    return {
      success: false,
      stats: {
        total: 0,
        novos: 0,
        duplicados: 0,
        vinculados: 0,
        expedientesCriados: 0,
        erros: 1,
      },
      errors: [`Advogado não encontrado: ${advogadoId}`],
    };
  }

  if (!advogado.numero_oab || !advogado.uf_oab) {
    return {
      success: false,
      stats: {
        total: 0,
        novos: 0,
        duplicados: 0,
        vinculados: 0,
        expedientesCriados: 0,
        erros: 1,
      },
      errors: ['Advogado sem OAB cadastrada'],
    };
  }

  // Executa captura
  return executarCaptura({
    advogado_id: advogadoId,
    numero_oab: advogado.numero_oab,
    uf_oab: advogado.uf_oab,
  });
}

// =============================================================================
// CAPTURA POR AGENDAMENTO
// =============================================================================

/**
 * Executa captura para um agendamento
 * Usado pelo scheduler
 *
 * @param agendamentoId - ID do agendamento
 * @returns Resultado da captura
 */
export async function executarCapturaPorAgendamento(
  agendamentoId: number
): Promise<CapturaResult> {
  const supabase = createServiceClient();

  // Busca dados do agendamento
  const { data: agendamento, error } = await supabase
    .from('agendamentos')
    .select(`
      id,
      advogado_id,
      advogados (
        id,
        numero_oab,
        uf_oab
      )
    `)
    .eq('id', agendamentoId)
    .eq('tipo_captura', 'comunica_cnj')
    .single();

  if (error || !agendamento) {
    return {
      success: false,
      stats: {
        total: 0,
        novos: 0,
        duplicados: 0,
        vinculados: 0,
        expedientesCriados: 0,
        erros: 1,
      },
      errors: [`Agendamento não encontrado: ${agendamentoId}`],
    };
  }

  // Type assertion through unknown to handle Supabase's type inference
  const advogadoRaw = agendamento.advogados as unknown;
  const advogadoData = Array.isArray(advogadoRaw) ? advogadoRaw[0] : advogadoRaw;
  const advogado = advogadoData as { id: number; numero_oab: string; uf_oab: string } | null;

  if (!advogado?.numero_oab || !advogado?.uf_oab) {
    return {
      success: false,
      stats: {
        total: 0,
        novos: 0,
        duplicados: 0,
        vinculados: 0,
        expedientesCriados: 0,
        erros: 1,
      },
      errors: ['Advogado do agendamento sem OAB cadastrada'],
    };
  }

  // Executa captura
  return executarCaptura({
    advogado_id: advogado.id,
    numero_oab: advogado.numero_oab,
    uf_oab: advogado.uf_oab,
  });
}
