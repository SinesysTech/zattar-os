/**
 * COMUNICA CNJ SERVICE - Camada de Lógica de Negócio
 * Orquestração e regras de negócio para comunicações CNJ
 */

import { Result, ok, err, appError } from '@/core/common/types';
import { createDbClient } from '@/core/common/db';
import { getComunicaCNJClient } from './cnj-client';
import * as repository from './repository';
import { criarExpediente } from '@/core/expedientes/service';
import type {
  ComunicacaoItem,
  ComunicacaoProcessual,
  ConsultarComunicacoesParams,
  ConsultaResult,
  SincronizarParams,
  SincronizacaoResult,
  SincronizacaoStats,
  TribunalInfo,
  RateLimitStatus,
  InserirComunicacaoParams,
  MatchParams,
  GrauTribunal,
  ComunicacaoDestinatario,
  PartesExtraidas,
  CriarExpedienteFromCNJParams,
} from './domain';
import {
  consultarComunicacoesSchema,
  sincronizarComunicacoesSchema,
  vincularExpedienteSchema,
  listarComunicacoesCapturadasSchema,
  ListarComunicacoesParams,
  ComunicacaoCNJ,
} from './domain';
import type { PaginatedResponse } from '@/core/common/types';

// =============================================================================
// UTILITÁRIOS
// =============================================================================

/**
 * Infere o grau do tribunal a partir do nome do órgão julgador
 */
export function inferirGrau(
  nomeOrgao: string,
  siglaTribunal: string
): GrauTribunal {
  const orgaoLower = (nomeOrgao || '').toLowerCase();
  const siglaUpper = (siglaTribunal || '').toUpperCase();

  // Tribunal Superior (TST ou contém "ministro")
  if (siglaUpper === 'TST' || orgaoLower.includes('ministro')) {
    return 'tribunal_superior';
  }

  // Segundo grau (turma, gabinete, etc.)
  if (
    orgaoLower.includes('turma') ||
    orgaoLower.includes('gabinete') ||
    orgaoLower.includes('segundo grau') ||
    orgaoLower.includes('sejusc segundo') ||
    orgaoLower.includes('seção') ||
    orgaoLower.includes('sdc') ||
    orgaoLower.includes('sdi')
  ) {
    return 'segundo_grau';
  }

  // Primeiro grau (vara, comarca, fórum, etc.) - default
  return 'primeiro_grau';
}

/**
 * Normaliza número do processo removendo máscara
 */
export function normalizarNumeroProcesso(numeroProcesso: string): string {
  if (!numeroProcesso) return '';
  return numeroProcesso.replace(/[^0-9]/g, '');
}

/**
 * Extrai partes (polo ativo e passivo) dos destinatários da comunicação
 */
export function extrairPartes(
  destinatarios: ComunicacaoDestinatario[] | null | undefined
): PartesExtraidas {
  if (!destinatarios || !Array.isArray(destinatarios)) {
    return { poloAtivo: [], poloPassivo: [] };
  }

  const poloAtivo: string[] = [];
  const poloPassivo: string[] = [];

  for (const dest of destinatarios) {
    if (!dest.nome) continue;

    if (dest.polo === 'A') {
      poloAtivo.push(dest.nome);
    } else if (dest.polo === 'P') {
      poloPassivo.push(dest.nome);
    }
  }

  return { poloAtivo, poloPassivo };
}

/**
 * Obtém o primeiro nome do polo ativo (autor)
 */
export function obterNomeParteAutora(
  destinatarios: ComunicacaoDestinatario[] | null | undefined
): string {
  const { poloAtivo } = extrairPartes(destinatarios);
  return poloAtivo[0] || 'Não especificado';
}

/**
 * Obtém o primeiro nome do polo passivo (réu)
 */
export function obterNomeParteRe(
  destinatarios: ComunicacaoDestinatario[] | null | undefined
): string {
  const { poloPassivo } = extrairPartes(destinatarios);
  return poloPassivo[0] || 'Não especificado';
}

/**
 * Conta quantidade de partes em cada polo
 */
function contarPartes(
  destinatarios: ComunicacaoDestinatario[] | null | undefined
): { qtdePoloAtivo: number; qtdePoloPassivo: number } {
  const { poloAtivo, poloPassivo } = extrairPartes(destinatarios);
  return {
    qtdePoloAtivo: poloAtivo.length || 1, // Mínimo 1 para evitar 0
    qtdePoloPassivo: poloPassivo.length || 1,
  };
}

// =============================================================================
// SERVIÇOS DE CONSULTA (sem persistência)
// =============================================================================

/**
 * Busca comunicações na API do CNJ (sem persistência)
 */
export async function buscarComunicacoes(
  params: ConsultarComunicacoesParams
): Promise<Result<ConsultaResult>> {
  // Validação com Zod
  const validation = consultarComunicacoesSchema.safeParse(params);
  if (!validation.success) {
    return err(
      appError(
        'VALIDATION_ERROR',
        'Parâmetros de consulta inválidos.',
        validation.error.flatten().fieldErrors
      )
    );
  }

  try {
    const client = getComunicaCNJClient();
    const { data, rateLimit } = await client.consultarComunicacoes(
      validation.data
    );

    return ok({
      comunicacoes: data.comunicacoes,
      paginacao: data.paginacao,
      rateLimit,
    });
  } catch (error) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        error instanceof Error ? error.message : 'Erro ao consultar comunicações.',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Obtém status atual do rate limit
 */
export function obterStatusRateLimit(): RateLimitStatus {
  const client = getComunicaCNJClient();
  return client.getRateLimitStatus();
}

/**
 * Obtém certidão (PDF) de uma comunicação
 * @param hash - Hash único da comunicação
 * @returns Result com Buffer do PDF
 */
export async function obterCertidao(hash: string): Promise<Result<Buffer>> {
  if (!hash || typeof hash !== 'string' || hash.trim().length === 0) {
    return err(
      appError('VALIDATION_ERROR', 'Hash inválido.')
    );
  }

  try {
    const client = getComunicaCNJClient();
    const pdfBuffer = await client.obterCertidao(hash);
    return ok(pdfBuffer);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao obter certidão.';
    
    // Verifica se é erro de certidão não encontrada
    if (errorMessage.includes('não encontrada') || errorMessage.includes('404')) {
      return err(
        appError('NOT_FOUND', 'Certidão não encontrada.')
      );
    }

    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        errorMessage,
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Lista tribunais disponíveis na API do CNJ
 */
export async function listarTribunaisDisponiveis(): Promise<Result<TribunalInfo[]>> {
  try {
    const client = getComunicaCNJClient();
    const tribunais = await client.listarTribunais();
    return ok(tribunais);
  } catch (error) {
    return err(
      appError(
        'EXTERNAL_SERVICE_ERROR',
        error instanceof Error ? error.message : 'Erro ao listar tribunais.',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// SERVIÇOS DE LISTAGEM (com persistência)
// =============================================================================

/**
 * Lista comunicações capturadas do banco de dados
 * Valida parâmetros, chama repositório e trata erros
 */
export async function listarComunicacoesCapturadas(
  params: ListarComunicacoesParams
): Promise<Result<PaginatedResponse<ComunicacaoCNJ>>> {
  // Validação com Zod
  const validation = listarComunicacoesCapturadasSchema.safeParse(params);
  if (!validation.success) {
    return err(
      appError(
        'VALIDATION_ERROR',
        'Parâmetros de listagem inválidos.',
        validation.error.flatten().fieldErrors
      )
    );
  }

  try {
    const result = await repository.findAllComunicacoes(validation.data);
    
    // Converte erros de banco em appError caso o repositório não retorne Result
    if (!result.success) {
      return err(
        appError(
          'DATABASE_ERROR',
          result.error.message || 'Erro ao listar comunicações capturadas.',
          result.error.metadata
        )
      );
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        error instanceof Error ? error.message : 'Erro ao listar comunicações capturadas.',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// SERVIÇOS DE SINCRONIZAÇÃO (com persistência)
// =============================================================================

/**
 * Sincroniza comunicações da API CNJ para o banco de dados
 * Busca comunicações, verifica duplicatas, vincula expedientes e cria novos quando necessário
 */
export async function sincronizarComunicacoes(
  params: SincronizarParams
): Promise<Result<SincronizacaoResult>> {
  // Validação com Zod
  const validation = sincronizarComunicacoesSchema.safeParse(params);
  if (!validation.success) {
    return err(
      appError(
        'VALIDATION_ERROR',
        'Parâmetros de sincronização inválidos.',
        validation.error.flatten().fieldErrors
      )
    );
  }

  const stats: SincronizacaoStats = {
    total: 0,
    novos: 0,
    duplicados: 0,
    vinculados: 0,
    expedientesCriados: 0,
    erros: 0,
  };
  const errors: string[] = [];

  try {
    const client = getComunicaCNJClient();

    // Busca comunicações na API (paginado)
    let pagina = 1;
    let temMaisPaginas = true;

    while (temMaisPaginas) {
      const consultaResult = await client.consultarComunicacoes({
        numeroOab: validation.data.numeroOab,
        ufOab: validation.data.ufOab,
        siglaTribunal: validation.data.siglaTribunal,
        dataInicio: validation.data.dataInicio,
        dataFim: validation.data.dataFim,
        pagina,
        itensPorPagina: 100,
      });

      stats.total += consultaResult.data.comunicacoes.length;

      // Processa cada comunicação
      for (const comunicacao of consultaResult.data.comunicacoes) {
        try {
          const resultado = await processarComunicacao(
            comunicacao,
            validation.data.advogadoId
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
            '[comunica-cnj-service] Erro ao processar comunicação:',
            error
          );
        }
      }

      // Verifica se há mais páginas
      temMaisPaginas = pagina < consultaResult.data.paginacao.totalPaginas;
      pagina++;
    }

    return ok({
      success: true,
      stats,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[comunica-cnj-service] Erro na sincronização:', error);

    return ok({
      success: false,
      stats,
      errors: [msg, ...errors],
    });
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
 */
async function processarComunicacao(
  comunicacao: ComunicacaoItem,
  advogadoId?: number
): Promise<ProcessamentoResult> {
  // 1. Verifica se já existe
  const existenteResult = await repository.findComunicacaoByHash(comunicacao.hash);
  if (!existenteResult.success) {
    return { status: 'erro', erro: existenteResult.error.message };
  }
  if (existenteResult.data) {
    return { status: 'duplicado' };
  }

  // 2. Infere grau do tribunal
  const grau = inferirGrau(comunicacao.nomeOrgao, comunicacao.siglaTribunal);

  // 3. Normaliza número do processo
  const numeroProcesso = normalizarNumeroProcesso(comunicacao.numeroProcesso);

  // 4. Tenta encontrar expediente correspondente
  const matchParams: MatchParams = {
    numeroProcesso,
    trt: comunicacao.siglaTribunal,
    grau,
    dataDisponibilizacao: comunicacao.dataDisponibilizacao,
  };

  const expedienteResult = await repository.findExpedienteCorrespondente(matchParams);
  if (!expedienteResult.success) {
    return { status: 'erro', erro: expedienteResult.error.message };
  }

  let expedienteId = expedienteResult.data;
  let expedienteCriado = false;

  // 5. Se não encontrou, cria novo expediente
  if (!expedienteId) {
    const criarResult = await criarExpedienteFromComunicacao(comunicacao, grau);
    if (!criarResult.success) {
      return { status: 'erro', erro: criarResult.error.message };
    }
    expedienteId = criarResult.data;
    expedienteCriado = true;
  }

  // 6. Insere comunicação
  const dadosComunicacao: InserirComunicacaoParams = {
    idCnj: comunicacao.id,
    hash: comunicacao.hash,
    numeroComunicacao: comunicacao.numeroComunicacao,
    numeroProcesso,
    numeroProcessoMascara: comunicacao.numeroProcessoComMascara,
    siglaTribunal: comunicacao.siglaTribunal,
    orgaoId: comunicacao.idOrgao,
    nomeOrgao: comunicacao.nomeOrgao,
    tipoComunicacao: comunicacao.tipoComunicacao,
    tipoDocumento: comunicacao.tipoDocumento,
    nomeClasse: comunicacao.nomeClasse,
    codigoClasse: comunicacao.codigoClasse,
    meio: comunicacao.meio,
    meioCompleto: comunicacao.meioCompleto,
    texto: comunicacao.texto,
    link: comunicacao.link,
    dataDisponibilizacao: comunicacao.dataDisponibilizacao,
    ativo: comunicacao.ativo,
    status: comunicacao.status,
    motivoCancelamento: comunicacao.motivoCancelamento ?? null,
    dataCancelamento: comunicacao.dataCancelamento ?? null,
    destinatarios: comunicacao.destinatarios,
    destinatariosAdvogados: comunicacao.destinatarioAdvogados,
    expedienteId,
    advogadoId: advogadoId ?? null,
    metadados: comunicacao as unknown as Record<string, unknown>,
  };

  const inserirResult = await repository.saveComunicacao(dadosComunicacao);
  if (!inserirResult.success) {
    return { status: 'erro', erro: inserirResult.error.message };
  }

  if (!inserirResult.data) {
    // Duplicado (inserido entre verificação e inserção)
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
 */
async function buscarDataAutuacaoDoAcervo(
  numeroProcesso: string,
  siglaTribunal: string,
  grau: GrauTribunal
): Promise<{ dataAutuacao: string; processoId: number } | null> {
  const db = createDbClient();

  // Primeiro tenta buscar pelo grau exato
  const { data: processoGrauExato } = await db
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
    const { data: processoPrimeiroGrau } = await db
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
  const { data: processoQualquer } = await db
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
 */
async function criarExpedienteFromComunicacao(
  comunicacao: ComunicacaoItem,
  grau: GrauTribunal
): Promise<Result<number>> {
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
  const idPje = -Date.now();

  // Prepara dados para criar expediente
  const expedienteData = {
    idPje,
    advogadoId: null,
    processoId: dadosAcervo?.processoId ?? null,
    trt: comunicacao.siglaTribunal,
    grau,
    numeroProcesso,
    descricaoOrgaoJulgador: comunicacao.nomeOrgao || 'Não especificado',
    classeJudicial: comunicacao.nomeClasse || 'Não especificado',
    numero: 0,
    segredoJustica: false,
    codigoStatusProcesso: 'DISTRIBUIDO',
    prioridadeProcessual: 0,
    nomeParteAutora,
    qtdeParteAutora: qtdePoloAtivo,
    nomeParteRe,
    qtdeParteRe: qtdePoloPassivo,
    dataAutuacao: dadosAcervo?.dataAutuacao ?? null,
    juizoDigital: false,
    dataArquivamento: null,
    idDocumento: null,
    dataCienciaParte: comunicacao.dataDisponibilizacao,
    dataPrazoLegalParte: null,
    dataCriacaoExpediente: comunicacao.dataDisponibilizacao,
    prazoVencido: false,
    siglaOrgaoJulgador: null,
    dadosAnteriores: null,
    responsavelId: null,
    baixadoEm: null,
    protocoloId: null,
    justificativaBaixa: null,
    tipoExpedienteId: null,
    descricaoArquivos: comunicacao.tipoComunicacao || 'Comunicação CNJ',
    arquivoNome: null,
    arquivoUrl: null,
    arquivoBucket: null,
    arquivoKey: null,
    observacoes: null,
    origem: 'comunica_cnj' as const,
  };

  const criarResult = await criarExpediente(expedienteData);
  if (!criarResult.success) {
    return err(criarResult.error);
  }

  console.log('[comunica-cnj-service] Expediente criado:', {
    id: criarResult.data.id,
    numeroProcesso,
    trt: comunicacao.siglaTribunal,
    dataAutuacao: dadosAcervo?.dataAutuacao ?? 'não encontrada no acervo',
    processoVinculado: dadosAcervo?.processoId ?? 'não vinculado',
  });

  return ok(criarResult.data.id);
}

// =============================================================================
// SERVIÇOS DE VINCULAÇÃO
// =============================================================================

/**
 * Vincula comunicação a um expediente
 */
export async function vincularComunicacaoAExpediente(
  comunicacaoId: number,
  expedienteId: number
): Promise<Result<void>> {
  // Validação
  const validation = vincularExpedienteSchema.safeParse({
    comunicacaoId,
    expedienteId,
  });
  if (!validation.success) {
    return err(
      appError(
        'VALIDATION_ERROR',
        'IDs inválidos.',
        validation.error.flatten().fieldErrors
      )
    );
  }

  // Verifica se comunicação existe
  const comunicacaoResult = await repository.findComunicacaoById(comunicacaoId);
  if (!comunicacaoResult.success) {
    return err(comunicacaoResult.error);
  }
  if (!comunicacaoResult.data) {
    return err(appError('NOT_FOUND', 'Comunicação não encontrada.'));
  }

  // Verifica se expediente existe (usando service de expedientes)
  const { findExpedienteById } = await import('@/core/expedientes/repository');
  const expedienteResult = await findExpedienteById(expedienteId);
  if (!expedienteResult.success) {
    return err(expedienteResult.error);
  }
  if (!expedienteResult.data) {
    return err(appError('NOT_FOUND', 'Expediente não encontrado.'));
  }

  // Vincula
  const vincularResult = await repository.vincularExpediente(
    comunicacaoId,
    expedienteId
  );
  if (!vincularResult.success) {
    return err(vincularResult.error);
  }

  return ok(undefined);
}
