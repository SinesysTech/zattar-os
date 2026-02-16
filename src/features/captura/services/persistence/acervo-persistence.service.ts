// Serviço de persistência de acervo (acervo geral + arquivados)
// Salva processos capturados no banco de dados com comparação antes de atualizar

import { createServiceClient } from "@/lib/supabase/service-client";
import type { Processo } from "../../types/types";
import type { CodigoTRT, GrauTRT } from "../../types/trt-types";
import { compararObjetos, removerCamposControle } from "./comparison.util";
import { captureLogService, extrairMensagemErro, type TipoEntidade } from "./capture-log.service";

/**
 * Parâmetros para salvar processos no acervo
 */
export interface SalvarAcervoParams {
  processos: Processo[];
  advogadoId: number;
  origem: "acervo_geral" | "arquivado";
  trt: CodigoTRT;
  grau: GrauTRT;
}

/**
 * Resultado da persistência
 */
export interface SalvarAcervoResult {
  inseridos: number;
  atualizados: number;
  naoAtualizados: number;
  erros: number;
  total: number;
  /** Mapeamento id_pje → id do acervo (para vincular partes depois) */
  mapeamentoIds: Map<number, number>;
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
    return new Date(dateString + "-03:00").toISOString();
  } catch {
    return null;
  }
}

/**
 * Atualiza a materialized view acervo_unificado após persistência no acervo.
 * Necessário porque a view não se atualiza automaticamente.
 */
async function refreshAcervoUnificado(): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.rpc("refresh_acervo_unificado", {
      use_concurrent: true,
    });
    if (error) {
      console.warn(`   ⚠️ [refreshAcervoUnificado] Falha no refresh: ${error.message}`);
    } else {
      console.log(`   🔄 [refreshAcervoUnificado] View materializada atualizada com sucesso`);
    }
  } catch (err) {
    console.warn(`   ⚠️ [refreshAcervoUnificado] Erro inesperado:`, err);
  }
}

/**
 * Busca um processo existente no acervo com todos os campos
 */
async function buscarProcessoExistente(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT,
  numeroProcesso: string,
): Promise<Record<string, unknown> | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("acervo")
    .select("*")
    .eq("id_pje", idPje)
    .eq("trt", trt)
    .eq("grau", grau)
    .eq("numero_processo", numeroProcesso.trim())
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Nenhum registro encontrado
      return null;
    }
    throw new Error(`Erro ao buscar processo no acervo: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

/**
 * Salva múltiplos processos no acervo
 * Compara cada registro antes de atualizar para evitar atualizações desnecessárias
 */
export async function salvarAcervo(
  params: SalvarAcervoParams,
): Promise<SalvarAcervoResult> {
  const supabase = createServiceClient();
  const { processos, advogadoId, origem, trt, grau } = params;

  const mapeamentoIds = new Map<number, number>();

  if (processos.length === 0) {
    return {
      inseridos: 0,
      atualizados: 0,
      naoAtualizados: 0,
      erros: 0,
      total: 0,
      mapeamentoIds,
    };
  }

  let inseridos = 0;
  let atualizados = 0;
  let naoAtualizados = 0;
  let erros = 0;

  const entidade: TipoEntidade = "acervo";
  const totalProcessos = processos.length;

  console.log(`   🔄 [salvarAcervo] Iniciando persistência de ${totalProcessos} processos (${origem})...`);

  // Processar cada processo individualmente para comparar antes de persistir
  let contador = 0;
  for (const processo of processos) {
    contador++;

    // Log de progresso a cada 20 processos ou no primeiro/último
    if (contador === 1 || contador === totalProcessos || contador % 20 === 0) {
      console.log(`   📊 [salvarAcervo] Progresso: ${contador}/${totalProcessos} (${Math.round(contador / totalProcessos * 100)}%)`);
    }

    try {
      const numeroProcesso = processo.numeroProcesso.trim();

      // Converter processo para formato do banco
      // Tratar valores nulos/vazios com valores padrão seguros
      const classeJudicial = processo.classeJudicial
        ? processo.classeJudicial.trim()
        : "Não informada";

      const dadosNovos = {
        id_pje: processo.id,
        advogado_id: advogadoId,
        origem,
        trt,
        grau,
        numero_processo: numeroProcesso,
        numero: processo.numero ?? 0,
        descricao_orgao_julgador: processo.descricaoOrgaoJulgador?.trim() || "",
        classe_judicial: classeJudicial,
        segredo_justica: processo.segredoDeJustica ?? false,
        codigo_status_processo: processo.codigoStatusProcesso?.trim() || "",
        prioridade_processual: processo.prioridadeProcessual ?? 0,
        nome_parte_autora: processo.nomeParteAutora?.trim() || "",
        qtde_parte_autora: processo.qtdeParteAutora ?? 1,
        nome_parte_re: processo.nomeParteRe?.trim() || "",
        qtde_parte_re: processo.qtdeParteRe ?? 1,
        data_autuacao: parseDate(processo.dataAutuacao),
        juizo_digital: processo.juizoDigital ?? false,
        data_arquivamento: parseDate(processo.dataArquivamento),
        data_proxima_audiencia: parseDate(processo.dataProximaAudiencia),
        tem_associacao: processo.temAssociacao ?? false,
      };

      // Buscar registro existente
      const registroExistente = await buscarProcessoExistente(
        processo.id,
        trt,
        grau,
        numeroProcesso,
      );

      if (!registroExistente) {
        // Registro não existe - inserir e retornar o ID gerado
        const { data: inserted, error } = await supabase
          .from("acervo")
          .insert(dadosNovos)
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        // Mapear id_pje → id do acervo
        if (inserted?.id) {
          mapeamentoIds.set(processo.id, inserted.id);
        }

        inseridos++;
        captureLogService.logInserido(
          entidade,
          processo.id,
          trt,
          grau,
          numeroProcesso,
        );
      } else {
        // Registro existe - mapear o ID existente
        const idExistente = registroExistente.id as number;
        mapeamentoIds.set(processo.id, idExistente);

        // Comparar antes de atualizar
        const comparacao = compararObjetos(
          dadosNovos,
          registroExistente as Record<string, unknown>,
        );

        if (comparacao.saoIdenticos) {
          // Registro idêntico - não atualizar
          naoAtualizados++;
          captureLogService.logNaoAtualizado(
            entidade,
            processo.id,
            trt,
            grau,
            numeroProcesso,
          );
        } else {
          // Registro diferente - atualizar com dados anteriores
          const dadosAnteriores = removerCamposControle(
            registroExistente as Record<string, unknown>,
          );

          const { error } = await supabase
            .from("acervo")
            .update({
              ...dadosNovos,
              dados_anteriores: dadosAnteriores,
            })
            .eq("id_pje", processo.id)
            .eq("trt", trt)
            .eq("grau", grau)
            .eq("numero_processo", numeroProcesso);

          if (error) {
            throw error;
          }

          atualizados++;
          captureLogService.logAtualizado(
            entidade,
            processo.id,
            trt,
            grau,
            numeroProcesso,
            comparacao.camposAlterados,
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
        `   ❌ [salvarAcervo] Erro no processo ${contador}/${totalProcessos} (${processo.numeroProcesso}):`,
        error,
      );
    }
  }

  console.log(`   ✅ [salvarAcervo] Persistência concluída: ${inseridos} inseridos, ${atualizados} atualizados, ${naoAtualizados} sem alteração, ${erros} erros`);

  // Refresh da view materializada se houve alterações
  if (inseridos > 0 || atualizados > 0) {
    await refreshAcervoUnificado();
  }

  return {
    inseridos,
    atualizados,
    naoAtualizados,
    erros,
    total: processos.length,
    mapeamentoIds,
  };
}

// ============================================================================
// VERSÃO OTIMIZADA COM BATCH OPERATIONS
// ============================================================================

/**
 * Converte processo para formato do banco
 */
function processoParaDadosBanco(
  processo: Processo,
  advogadoId: number,
  origem: "acervo_geral" | "arquivado",
  trt: CodigoTRT,
  grau: GrauTRT,
) {
  const numeroProcesso = processo.numeroProcesso.trim();
  const classeJudicial = processo.classeJudicial
    ? processo.classeJudicial.trim()
    : "Não informada";

  return {
    id_pje: processo.id,
    advogado_id: advogadoId,
    origem,
    trt,
    grau,
    numero_processo: numeroProcesso,
    numero: processo.numero ?? 0,
    descricao_orgao_julgador: processo.descricaoOrgaoJulgador?.trim() || "",
    classe_judicial: classeJudicial,
    segredo_justica: processo.segredoDeJustica ?? false,
    codigo_status_processo: processo.codigoStatusProcesso?.trim() || "",
    prioridade_processual: processo.prioridadeProcessual ?? 0,
    nome_parte_autora: processo.nomeParteAutora?.trim() || "",
    qtde_parte_autora: processo.qtdeParteAutora ?? 1,
    nome_parte_re: processo.nomeParteRe?.trim() || "",
    qtde_parte_re: processo.qtdeParteRe ?? 1,
    data_autuacao: parseDate(processo.dataAutuacao),
    juizo_digital: processo.juizoDigital ?? false,
    data_arquivamento: parseDate(processo.dataArquivamento),
    data_proxima_audiencia: parseDate(processo.dataProximaAudiencia),
    tem_associacao: processo.temAssociacao ?? false,
  };
}

/**
 * Salva múltiplos processos no acervo usando BATCH OPERATIONS (otimizado)
 *
 * Reduz de ~438 queries para ~3-5 queries:
 * 1. Batch SELECT: busca todos existentes de uma vez
 * 2. Batch INSERT: insere todos novos de uma vez
 * 3. Updates individuais: apenas para registros alterados (necessário por causa de dados_anteriores)
 *
 * Performance: ~2-5s vs ~30-60s da versão sequencial
 */
export async function salvarAcervoBatch(
  params: SalvarAcervoParams,
): Promise<SalvarAcervoResult> {
  const supabase = createServiceClient();
  const { processos, advogadoId, origem, trt, grau } = params;

  const mapeamentoIds = new Map<number, number>();

  if (processos.length === 0) {
    return {
      inseridos: 0,
      atualizados: 0,
      naoAtualizados: 0,
      erros: 0,
      total: 0,
      mapeamentoIds,
    };
  }

  const entidade: TipoEntidade = "acervo";
  const totalProcessos = processos.length;

  console.log(`   🚀 [salvarAcervoBatch] Iniciando persistência BATCH de ${totalProcessos} processos (${origem})...`);

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 1: BATCH SELECT - Buscar todos os existentes de uma vez
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`   📥 [salvarAcervoBatch] Fase 1: Buscando registros existentes...`);

  const idsPje = processos.map(p => p.id);

  const { data: existentes, error: erroBusca } = await supabase
    .from("acervo")
    .select("*")
    .in("id_pje", idsPje)
    .eq("trt", trt)
    .eq("grau", grau);

  if (erroBusca) {
    throw new Error(`Erro ao buscar processos existentes: ${erroBusca.message}`);
  }

  // Criar mapa de existentes: id_pje → registro completo
  const mapaExistentes = new Map<number, Record<string, unknown>>();
  for (const registro of (existentes ?? [])) {
    mapaExistentes.set(registro.id_pje as number, registro as Record<string, unknown>);
    // Já mapeia os IDs existentes
    mapeamentoIds.set(registro.id_pje as number, registro.id as number);
  }

  console.log(`   ✅ [salvarAcervoBatch] ${mapaExistentes.size} registros existentes encontrados`);

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 2: CLASSIFICAR - Separar em novos, alterados, sem alteração
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`   🔍 [salvarAcervoBatch] Fase 2: Classificando processos...`);

  const novos: Array<ReturnType<typeof processoParaDadosBanco>> = [];
  const paraAtualizar: Array<{
    dados: ReturnType<typeof processoParaDadosBanco>;
    existente: Record<string, unknown>;
    camposAlterados: string[];
  }> = [];
  let naoAtualizados = 0;
  let erros = 0;

  for (const processo of processos) {
    try {
      const dadosNovos = processoParaDadosBanco(processo, advogadoId, origem, trt, grau);
      const existente = mapaExistentes.get(processo.id);

      if (!existente) {
        // Novo registro
        novos.push(dadosNovos);
      } else {
        // Registro existe - comparar
        const comparacao = compararObjetos(dadosNovos, existente);

        if (comparacao.saoIdenticos) {
          naoAtualizados++;
          captureLogService.logNaoAtualizado(
            entidade,
            processo.id,
            trt,
            grau,
            processo.numeroProcesso,
          );
        } else {
          paraAtualizar.push({
            dados: dadosNovos,
            existente,
            camposAlterados: comparacao.camposAlterados,
          });
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
    }
  }

  console.log(`   📊 [salvarAcervoBatch] Classificação: ${novos.length} novos, ${paraAtualizar.length} para atualizar, ${naoAtualizados} sem alteração`);

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 3: BATCH INSERT - Inserir todos os novos de uma vez
  // ═══════════════════════════════════════════════════════════════════════════
  let inseridos = 0;

  if (novos.length > 0) {
    console.log(`   📤 [salvarAcervoBatch] Fase 3: Inserindo ${novos.length} novos registros em batch...`);

    // Inserir em lotes de 100 para evitar problemas com payloads muito grandes
    const BATCH_SIZE = 100;
    for (let i = 0; i < novos.length; i += BATCH_SIZE) {
      const lote = novos.slice(i, i + BATCH_SIZE);

      const { data: inseridos_lote, error: erroInsert } = await supabase
        .from("acervo")
        .insert(lote)
        .select("id, id_pje");

      if (erroInsert) {
        console.error(`   ❌ [salvarAcervoBatch] Erro ao inserir lote ${Math.floor(i / BATCH_SIZE) + 1}:`, erroInsert);
        erros += lote.length;
        continue;
      }

      // Mapear IDs dos inseridos
      for (const registro of (inseridos_lote ?? [])) {
        mapeamentoIds.set(registro.id_pje as number, registro.id as number);
        inseridos++;

        // Log individual de inserção
        const processoOriginal = processos.find(p => p.id === registro.id_pje);
        if (processoOriginal) {
          captureLogService.logInserido(
            entidade,
            registro.id_pje as number,
            trt,
            grau,
            processoOriginal.numeroProcesso,
          );
        }
      }

      if (novos.length > BATCH_SIZE) {
        console.log(`   📊 [salvarAcervoBatch] Inseridos: ${Math.min(i + BATCH_SIZE, novos.length)}/${novos.length}`);
      }
    }

    console.log(`   ✅ [salvarAcervoBatch] ${inseridos} registros inseridos`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 4: UPDATES INDIVIDUAIS - Necessário por causa de dados_anteriores
  // ═══════════════════════════════════════════════════════════════════════════
  let atualizados = 0;

  if (paraAtualizar.length > 0) {
    console.log(`   🔄 [salvarAcervoBatch] Fase 4: Atualizando ${paraAtualizar.length} registros...`);

    for (let i = 0; i < paraAtualizar.length; i++) {
      const { dados, existente, camposAlterados } = paraAtualizar[i];

      try {
        const dadosAnteriores = removerCamposControle(existente);

        const { error: erroUpdate } = await supabase
          .from("acervo")
          .update({
            ...dados,
            dados_anteriores: dadosAnteriores,
          })
          .eq("id", existente.id as number);

        if (erroUpdate) {
          throw erroUpdate;
        }

        atualizados++;
        captureLogService.logAtualizado(
          entidade,
          dados.id_pje,
          trt,
          grau,
          dados.numero_processo,
          camposAlterados,
        );
      } catch (error) {
        erros++;
        const erroMsg = extrairMensagemErro(error);
        captureLogService.logErro(entidade, erroMsg, {
          id_pje: dados.id_pje,
          numero_processo: dados.numero_processo,
          trt,
          grau,
        });
        console.error(`   ❌ [salvarAcervoBatch] Erro ao atualizar ${dados.numero_processo}:`, error);
      }

      // Log de progresso a cada 20 updates
      if ((i + 1) % 20 === 0 || i === paraAtualizar.length - 1) {
        console.log(`   📊 [salvarAcervoBatch] Atualizados: ${i + 1}/${paraAtualizar.length}`);
      }
    }

    console.log(`   ✅ [salvarAcervoBatch] ${atualizados} registros atualizados`);
  }

  console.log(`   🏁 [salvarAcervoBatch] Persistência BATCH concluída: ${inseridos} inseridos, ${atualizados} atualizados, ${naoAtualizados} sem alteração, ${erros} erros`);

  // Refresh da view materializada se houve alterações
  if (inseridos > 0 || atualizados > 0) {
    await refreshAcervoUnificado();
  }

  return {
    inseridos,
    atualizados,
    naoAtualizados,
    erros,
    total: processos.length,
    mapeamentoIds,
  };
}

/**
 * Busca um processo no acervo pelo ID do PJE, TRT, grau e número do processo
 */
export async function buscarProcessoNoAcervo(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT,
  numeroProcesso: string,
): Promise<{ id: number } | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("acervo")
    .select("id")
    .eq("id_pje", idPje)
    .eq("trt", trt)
    .eq("grau", grau)
    .eq("numero_processo", numeroProcesso.trim())
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Nenhum registro encontrado
      return null;
    }
    throw new Error(`Erro ao buscar processo no acervo: ${error.message}`);
  }

  return data ? { id: data.id } : null;
}
