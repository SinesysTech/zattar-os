// Serviço de persistência de processos pendentes de manifestação
// Salva processos pendentes capturados no banco de dados com comparação antes de atualizar

import { createServiceClient } from "@/lib/supabase/service-client";
import type { Processo } from "../../types/types";
import type { CodigoTRT, GrauTRT } from "../../types/trt-types";
import { compararObjetos, removerCamposControle } from "./comparison.util";
import { captureLogService, extrairMensagemErro, type TipoEntidade } from "./capture-log.service";

/**
 * Processo pendente com campos adicionais específicos
 */
export interface ProcessoPendente extends Processo {
  idDocumento?: number;
  dataCienciaParte?: string;
  dataPrazoLegalParte?: string;
  dataCriacaoExpediente?: string;
  prazoVencido?: boolean;
  siglaOrgaoJulgador?: string;
}

/**
 * Parâmetros para salvar processos pendentes
 */
export interface SalvarPendentesParams {
  processos: ProcessoPendente[];
  advogadoId: number;
  trt: CodigoTRT;
  grau: GrauTRT;
  capturaLogId?: number;
}

/**
 * Resultado da persistência
 */
export interface SalvarPendentesResult {
  inseridos: number;
  atualizados: number;
  naoAtualizados: number;
  conflitos: number;
  erros: number;
  total: number;
}

/**
 * Converte data ISO string para timestamptz ou null
 *
 * IMPORTANTE: A API do PJE retorna datas sem timezone (ex: "2025-12-04T10:00:00")
 * que representam horário de Brasília (America/Sao_Paulo, UTC-3).
 *
 * Se a string não tiver timezone explícito, assumimos Brasília para evitar
 * que o servidor (que pode estar em UTC) interprete incorretamente.
 */
function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    // Se já tem timezone (Z, +HH:MM, -HH:MM), usa direto
    const hasTimezone = /Z|[+-]\d{2}:\d{2}$/.test(dateString);

    if (hasTimezone) {
      return new Date(dateString).toISOString();
    }

    // Sem timezone: assumir Brasília (UTC-3)
    return new Date(dateString + '-03:00').toISOString();
  } catch {
    return null;
  }
}

/**
 * Busca um expediente existente pela chave composta completa.
 * Chave: (id_pje, id_documento, trt, grau, data_criacao_expediente)
 */
async function buscarPendenteExistente(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT,
  idDocumento: number | null,
  dataCriacaoExpediente: string | null
): Promise<Record<string, unknown> | null> {
  const supabase = createServiceClient();

  let query = supabase
    .from("expedientes")
    .select("*")
    .eq("id_pje", idPje)
    .eq("trt", trt)
    .eq("grau", grau);

  // Filtra por id_documento (pode ser null para expedientes sem documento)
  if (idDocumento !== null && idDocumento !== undefined) {
    query = query.eq("id_documento", idDocumento) as typeof query;
  } else {
    query = query.is("id_documento", null) as typeof query;
  }

  // Filtra por data_criacao_expediente (diferencia reuso de IDs pelo PJE)
  if (dataCriacaoExpediente !== null && dataCriacaoExpediente !== undefined) {
    query = query.eq("data_criacao_expediente", dataCriacaoExpediente) as typeof query;
  } else {
    query = query.is("data_criacao_expediente", null) as typeof query;
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar pendente: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

/**
 * Salva múltiplos processos pendentes de manifestação
 * Compara cada registro antes de atualizar para evitar atualizações desnecessárias
 */
export async function salvarPendentes(
  params: SalvarPendentesParams
): Promise<SalvarPendentesResult> {
  const supabase = createServiceClient();
  const { processos, advogadoId, trt, grau, capturaLogId } = params;

  if (processos.length === 0) {
    return {
      inseridos: 0,
      atualizados: 0,
      naoAtualizados: 0,
      conflitos: 0,
      erros: 0,
      total: 0,
    };
  }

  let inseridos = 0;
  let atualizados = 0;
  let naoAtualizados = 0;
  let conflitos = 0;
  let erros = 0;

  const entidade: TipoEntidade = "expedientes";

  // Batch: buscar todos os registros existentes de uma vez (evita N+1 queries)
  const idsPje = processos.map((p) => p.id);
  const existentesMap = new Map<string, Record<string, unknown>>();

  try {
    const { data: existentes, error: erroBatch } = await supabase
      .from("expedientes")
      .select("*")
      .in("id_pje", idsPje)
      .eq("trt", trt)
      .eq("grau", grau);

    if (erroBatch) {
      console.warn(
        `⚠️ [Pendentes] Erro ao buscar existentes em batch: ${erroBatch.message}. Continuando sem cache.`,
      );
    } else if (existentes) {
      for (const reg of existentes) {
        // Chave composta: id_pje + id_documento + data_criacao_expediente
        // Permite múltiplos expedientes por processo e trata reutilização de IDs pelo PJE
        const key = `${reg.id_pje}:${reg.id_documento ?? '∅'}:${reg.data_criacao_expediente ?? '∅'}`;
        existentesMap.set(key, reg as Record<string, unknown>);
      }
    }
  } catch {
    console.warn(
      `⚠️ [Pendentes] Exceção ao buscar existentes em batch. Continuando sem cache.`,
    );
  }

  // Processar cada processo
  for (const processo of processos) {
    try {
      const numeroProcesso = processo.numeroProcesso.trim();

      const dadosNovos = {
        id_pje: processo.id,
        advogado_id: advogadoId,
        trt,
        grau,
        numero_processo: numeroProcesso,
        descricao_orgao_julgador: processo.descricaoOrgaoJulgador.trim(),
        classe_judicial: processo.classeJudicial.trim(),
        numero: processo.numero,
        segredo_justica: processo.segredoDeJustica,
        codigo_status_processo: processo.codigoStatusProcesso.trim(),
        prioridade_processual: processo.prioridadeProcessual,
        nome_parte_autora: processo.nomeParteAutora.trim(),
        qtde_parte_autora: processo.qtdeParteAutora,
        nome_parte_re: processo.nomeParteRe.trim(),
        qtde_parte_re: processo.qtdeParteRe,
        data_autuacao: parseDate(processo.dataAutuacao),
        juizo_digital: processo.juizoDigital,
        data_arquivamento: parseDate(processo.dataArquivamento),
        id_documento: processo.idDocumento ?? null,
        data_ciencia_parte: parseDate(processo.dataCienciaParte),
        data_prazo_legal_parte: parseDate(processo.dataPrazoLegalParte),
        data_criacao_expediente: parseDate(processo.dataCriacaoExpediente),
        prazo_vencido: processo.prazoVencido ?? false,
        sigla_orgao_julgador: processo.siglaOrgaoJulgador?.trim() ?? null,
        // ultima_captura_id é excluído propositalmente do payload de comparação:
        // muda a cada captura e causaria falso-positivo de "atualizado" em todos
        // os expedientes processados. É estampado separadamente abaixo.
      };

      // Lookup no cache batch (ou fallback para query individual se cache vazio)
      // Chave: id_pje + id_documento + data_criacao_expediente
      const cacheKey = `${processo.id}:${dadosNovos.id_documento ?? '∅'}:${dadosNovos.data_criacao_expediente ?? '∅'}`;
      const registroExistente = existentesMap.has(cacheKey)
        ? existentesMap.get(cacheKey)!
        : existentesMap.size === 0
          ? await buscarPendenteExistente(
              processo.id,
              trt,
              grau,
              dadosNovos.id_documento as number | null,
              dadosNovos.data_criacao_expediente as string | null
            )
          : null;

      if (!registroExistente) {
        // Inserir
        const { error } = await supabase
          .from("expedientes")
          .insert({ ...dadosNovos, ultima_captura_id: capturaLogId ?? null });

        if (error) {
          throw error;
        }

        inseridos++;
        captureLogService.logInserido(
          entidade,
          processo.id,
          trt,
          grau,
          numeroProcesso
        );
      } else {
        // Comparar antes de atualizar
        const comparacao = compararObjetos(
          dadosNovos,
          registroExistente as Record<string, unknown>
        );

        if (comparacao.saoIdenticos) {
          // Dados PJE não mudaram, mas ainda estampamos ultima_captura_id para
          // indicar que esse expediente foi visto nesta captura.
          if (capturaLogId) {
            let updateQuery = supabase
              .from("expedientes")
              .update({ ultima_captura_id: capturaLogId })
              .eq("id_pje", processo.id)
              .eq("trt", trt)
              .eq("grau", grau);

            if (dadosNovos.id_documento !== null && dadosNovos.id_documento !== undefined) {
              updateQuery = updateQuery.eq("id_documento", dadosNovos.id_documento) as typeof updateQuery;
            } else {
              updateQuery = updateQuery.is("id_documento", null) as typeof updateQuery;
            }

            if (dadosNovos.data_criacao_expediente !== null && dadosNovos.data_criacao_expediente !== undefined) {
              updateQuery = updateQuery.eq("data_criacao_expediente", dadosNovos.data_criacao_expediente) as typeof updateQuery;
            } else {
              updateQuery = updateQuery.is("data_criacao_expediente", null) as typeof updateQuery;
            }

            await updateQuery;
          }
          naoAtualizados++;
          captureLogService.logNaoAtualizado(
            entidade,
            processo.id,
            trt,
            grau,
            numeroProcesso
          );
        } else {
          const dadosAnteriores = removerCamposControle(
            registroExistente as Record<string, unknown>
          );

          // OCC: ancorar o UPDATE no updated_at do SELECT. Se outro scraper
          // atualizou a linha entre nosso SELECT e este UPDATE, o filtro não
          // casará, data virá vazio e tratamos como conflito (sem persistir).
          const updatedAtEsperado = registroExistente.updated_at as string | null;

          let updateOCCQuery = supabase
            .from("expedientes")
            .update({
              ...dadosNovos,
              ultima_captura_id: capturaLogId ?? null,
              dados_anteriores: dadosAnteriores,
            })
            .eq("id_pje", processo.id)
            .eq("trt", trt)
            .eq("grau", grau)
            .eq("updated_at", updatedAtEsperado);

          if (dadosNovos.id_documento !== null && dadosNovos.id_documento !== undefined) {
            updateOCCQuery = updateOCCQuery.eq("id_documento", dadosNovos.id_documento) as typeof updateOCCQuery;
          } else {
            updateOCCQuery = updateOCCQuery.is("id_documento", null) as typeof updateOCCQuery;
          }

          if (dadosNovos.data_criacao_expediente !== null && dadosNovos.data_criacao_expediente !== undefined) {
            updateOCCQuery = updateOCCQuery.eq("data_criacao_expediente", dadosNovos.data_criacao_expediente) as typeof updateOCCQuery;
          } else {
            updateOCCQuery = updateOCCQuery.is("data_criacao_expediente", null) as typeof updateOCCQuery;
          }

          const { data: linhasAtualizadas, error } = await updateOCCQuery.select("id");

          if (error) {
            throw error;
          }

          if (!linhasAtualizadas || linhasAtualizadas.length === 0) {
            conflitos++;
            captureLogService.logConflito(
              entidade,
              processo.id,
              trt,
              grau,
              numeroProcesso
            );
            continue;
          }

          atualizados++;
          captureLogService.logAtualizado(
            entidade,
            processo.id,
            trt,
            grau,
            numeroProcesso,
            comparacao.camposAlterados,
            comparacao.valoresAlterados,
          );
        }
      }
    } catch (error) {
      erros++;
      const erroMsg = extrairMensagemErro(error);
      captureLogService.logErro(entidade, erroMsg, {
        id_pje: processo.id,
        numero_processo: processo.numeroProcesso,
        trt,
        grau,
      });
      console.error(
        `Erro ao salvar pendente ${processo.numeroProcesso}:`,
        error
      );
    }
  }

  return {
    inseridos,
    atualizados,
    naoAtualizados,
    conflitos,
    erros,
    total: processos.length,
  };
}

/**
 * Atualiza informações de arquivo/documento de um expediente
 * Usado após upload bem-sucedido de documento para Google Drive
 *
 * @param pendenteId - ID do expediente na tabela expedientes
 * @param arquivoInfo - Informações do arquivo (nome, URLs de visualização e download, file_id)
 * @returns Promise<void>
 * @throws Error se a atualização falhar
 */
export async function atualizarDocumentoPendente(
  pendenteId: number,
  arquivoInfo: {
    arquivo_nome: string;
    arquivo_url: string;
    arquivo_key: string;
    arquivo_bucket: string;
  }
): Promise<void> {
  if (!pendenteId || pendenteId <= 0) {
    throw new Error(
      `ID de expediente inválido ao atualizar documento: ${pendenteId}`
    );
  }

  const supabase = createServiceClient();

  // .select("id") força o retorno das linhas atualizadas para detectar o caso
  // em que o expediente não existe — UPDATE isolado acerta 0 rows sem erro,
  // gerando registro órfão no Backblaze (arquivo existe, expediente não).
  const { data: linhasAtualizadas, error } = await supabase
    .from("expedientes")
    .update({
      arquivo_nome: arquivoInfo.arquivo_nome,
      arquivo_url: arquivoInfo.arquivo_url,
      arquivo_key: arquivoInfo.arquivo_key,
      arquivo_bucket: arquivoInfo.arquivo_bucket,
    })
    .eq("id", pendenteId)
    .select("id");

  if (error) {
    throw new Error(
      `Erro ao atualizar documento do expediente ${pendenteId}: ${error.message}`
    );
  }

  if (!linhasAtualizadas || linhasAtualizadas.length === 0) {
    throw new Error(
      `Expediente ${pendenteId} não encontrado ao vincular arquivo. Arquivo já foi enviado ao storage mas não foi vinculado no banco — verificar Backblaze.`
    );
  }

  console.log(`✅ Documento atualizado no banco para expediente ${pendenteId}`);
}
