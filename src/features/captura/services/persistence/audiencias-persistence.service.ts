// Serviço de persistência de audiências
// Salva audiências capturadas no banco de dados com comparação antes de atualizar

import { createServiceClient } from "@/lib/supabase/service-client";
import type { Audiencia } from "../../types/types";
import type { CodigoTRT, GrauTRT } from "../../types/trt-types";
import { buscarOrgaoJulgador } from "./orgao-julgador-persistence.service";
import { buscarProcessoNoAcervo } from "./acervo-persistence.service";
import { salvarOrgaoJulgador } from "./orgao-julgador-persistence.service";
import {
  salvarClasseJudicial,
  buscarClasseJudicial,
} from "./classe-judicial-persistence.service";
import {
  salvarTipoAudiencia,
  buscarTipoAudiencia,
} from "./tipo-audiencia-persistence.service";
import { salvarSalaAudiencia } from "./sala-audiencia-persistence.service";
import { compararObjetos, removerCamposControle } from "./comparison.util";
import { captureLogService, type TipoEntidade } from "./capture-log.service";

/**
 * Parâmetros para salvar audiências
 */
export interface SalvarAudienciasParams {
  audiencias: Audiencia[];
  advogadoId: number;
  trt: CodigoTRT;
  grau: GrauTRT;
  atas?: Record<number, { documentoId: number; url: string }>;
}

/**
 * Resultado da persistência
 */
export interface SalvarAudienciasResult {
  inseridos: number;
  atualizados: number;
  naoAtualizados: number;
  erros: number;
  total: number;
  orgaosJulgadoresCriados: number;
  classesJudiciaisCriadas: number;
  tiposAudienciaCriados: number;
  salasAudienciaCriadas: number;
}

/**
 * Converte data ISO string para timestamptz
 *
 * IMPORTANTE: A API do PJE retorna datas sem timezone (ex: "2025-12-04T10:00:00")
 * que representam horário de Brasília (America/Sao_Paulo, UTC-3).
 *
 * Se a string não tiver timezone explícito, assumimos Brasília para evitar
 * que o servidor (que pode estar em UTC) interprete incorretamente.
 *
 * @param dateString - Data no formato ISO 8601 (com ou sem timezone)
 * @returns Data em formato ISO 8601 UTC (com Z no final)
 */
function parseDate(dateString: string): string {
  // Se já tem timezone (Z, +HH:MM, -HH:MM), usa direto
  // Regex: procura por Z ou +/-HH:MM após a parte de hora (T)
  const hasTimezone = /Z|[+-]\d{2}:\d{2}$/.test(dateString);

  if (hasTimezone) {
    return new Date(dateString).toISOString();
  }

  // Sem timezone: assumir Brasília (UTC-3)
  // Adiciona o offset de Brasília para conversão correta
  return new Date(dateString + '-03:00').toISOString();
}

/**
 * Busca uma audiência existente com todos os campos
 */
async function buscarAudienciaExistente(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT,
  numeroProcesso: string
): Promise<Record<string, unknown> | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("audiencias")
    .select("*")
    .eq("id_pje", idPje)
    .eq("trt", trt)
    .eq("grau", grau)
    .eq("numero_processo", numeroProcesso.trim())
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar audiência: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

/**
 * Salva múltiplas audiências no banco de dados
 * Compara cada registro antes de atualizar para evitar atualizações desnecessárias
 */
export async function salvarAudiencias(
  params: SalvarAudienciasParams
): Promise<SalvarAudienciasResult> {
  const supabase = createServiceClient();
  const { audiencias, advogadoId, trt, grau, atas } = params;

  if (audiencias.length === 0) {
    return {
      inseridos: 0,
      atualizados: 0,
      naoAtualizados: 0,
      erros: 0,
      total: 0,
      orgaosJulgadoresCriados: 0,
      classesJudiciaisCriadas: 0,
      tiposAudienciaCriados: 0,
      salasAudienciaCriadas: 0,
    };
  }

  let orgaosJulgadoresCriados = 0;
  let classesJudiciaisCriadas = 0;
  let tiposAudienciaCriados = 0;
  let salasAudienciaCriadas = 0;

  const cacheOrgaos = new Map<number, { id: number }>();
  const cacheClasses = new Map<number, { id: number }>();
  const cacheTipos = new Map<number, { id: number }>();
  const cacheSalas = new Map<string, { id: number }>();

  // Primeiro, garantir que todos os órgãos julgadores estão salvos
  for (const audiencia of audiencias) {
    if (audiencia.processo?.orgaoJulgador) {
      const orgaoJulgador = audiencia.processo.orgaoJulgador;

      // Verificar se já existe
      const cached = cacheOrgaos.get(orgaoJulgador.id) || null;
      const existe =
        cached || (await buscarOrgaoJulgador(orgaoJulgador.id, trt, grau));

      if (!existe) {
        // Salvar órgão julgador
        const descricao = orgaoJulgador.descricao || "";

        const salvo = await salvarOrgaoJulgador({
          orgaoJulgador: {
            id: orgaoJulgador.id,
            descricao,
            cejusc: orgaoJulgador.cejusc ?? false,
            ativo: orgaoJulgador.ativo ?? false,
            postoAvancado: orgaoJulgador.postoAvancado ?? false,
            novoOrgaoJulgador: orgaoJulgador.novoOrgaoJulgador ?? false,
            codigoServentiaCnj: orgaoJulgador.codigoServentiaCnj ?? 0,
          },
          trt,
          grau,
        });
        cacheOrgaos.set(orgaoJulgador.id, { id: salvo.id });
        orgaosJulgadoresCriados++;
      }
    }

    // Salvar classe judicial (se existir)
    if (audiencia.processo?.classeJudicial) {
      const classeJudicial = audiencia.processo.classeJudicial;
      const cached = cacheClasses.get(classeJudicial.id);
      if (!cached) {
        const resultado = await salvarClasseJudicial({
          classeJudicial,
          trt,
          grau,
        });
        if (resultado.inserido) {
          classesJudiciaisCriadas++;
        }
        cacheClasses.set(classeJudicial.id, { id: resultado.id });
      }
    }

    // Salvar tipo de audiência (se existir)
    if (audiencia.tipo) {
      const resultado = await salvarTipoAudiencia({
        tipoAudiencia: audiencia.tipo,
        trt,
        grau,
      });
      if (resultado.inserido) {
        tiposAudienciaCriados++;
      }
      cacheTipos.set(audiencia.tipo.id, { id: resultado.id });
    }
  }

  // Buscar IDs dos órgãos julgadores, processos, classes judiciais, tipos e salas
  const dadosComRelacoes = await Promise.all(
    audiencias.map(async (audiencia) => {
      let orgaoJulgadorId: number | null = null;
      let processoId: number | null = null;
      let classeJudicialId: number | null = null;
      let tipoAudienciaId: number | null = null;
      let salaAudienciaId: number | null = null;

      // Buscar ID do órgão julgador
      if (audiencia.processo?.orgaoJulgador) {
        const cached =
          cacheOrgaos.get(audiencia.processo.orgaoJulgador.id) || null;
        const orgao =
          cached ||
          (await buscarOrgaoJulgador(
            audiencia.processo.orgaoJulgador.id,
            trt,
            grau
          ));
        orgaoJulgadorId = orgao?.id ?? null;
      }

      // Buscar ID do processo no acervo
      if (audiencia.processo?.id && audiencia.processo?.numero) {
        const processo = await buscarProcessoNoAcervo(
          audiencia.processo.id,
          trt,
          grau,
          audiencia.processo.numero
        );
        processoId = processo?.id ?? null;
      }

      // Buscar ID da classe judicial
      if (audiencia.processo?.classeJudicial) {
        const cached =
          cacheClasses.get(audiencia.processo.classeJudicial.id) || null;
        const classe =
          cached ||
          (await buscarClasseJudicial(
            audiencia.processo.classeJudicial.id,
            trt,
            grau
          ));
        classeJudicialId = classe?.id ?? null;
      }

      // Buscar ID do tipo de audiência
      if (audiencia.tipo) {
        const cached = cacheTipos.get(audiencia.tipo.id) || null;
        const tipo =
          cached || (await buscarTipoAudiencia(audiencia.tipo.id, trt, grau));
        tipoAudienciaId = tipo?.id ?? null;
      }

      // Salvar e buscar ID da sala de audiência
      if (audiencia.salaAudiencia?.nome && orgaoJulgadorId) {
        const salaKey = `${orgaoJulgadorId}:${audiencia.salaAudiencia.nome}`;
        const cached = cacheSalas.get(salaKey);
        if (cached) {
          salaAudienciaId = cached.id;
        } else {
          const resultado = await salvarSalaAudiencia({
            salaAudiencia: audiencia.salaAudiencia,
            trt,
            grau,
            orgaoJulgadorId,
          });
          salaAudienciaId = resultado.id;
          if (resultado.inserido) {
            salasAudienciaCriadas++;
          }
          cacheSalas.set(salaKey, { id: resultado.id });
        }
      }

      return {
        audiencia,
        orgaoJulgadorId,
        processoId,
        classeJudicialId,
        tipoAudienciaId,
        salaAudienciaId,
      };
    })
  );

  let inseridos = 0;
  let atualizados = 0;
  let naoAtualizados = 0;
  let erros = 0;

  const entidade: TipoEntidade = "audiencias";

  // Processar cada audiência individualmente
  for (const {
    audiencia,
    orgaoJulgadorId,
    processoId,
    classeJudicialId,
    tipoAudienciaId,
    salaAudienciaId,
  } of dadosComRelacoes) {
    try {
      const numeroProcesso = audiencia.processo?.numero?.trim() ?? "";

      const dadosNovos = {
        id_pje: audiencia.id,
        advogado_id: advogadoId,
        processo_id: processoId,
        orgao_julgador_id: orgaoJulgadorId,
        classe_judicial_id: classeJudicialId,
        tipo_audiencia_id: tipoAudienciaId,
        sala_audiencia_id: salaAudienciaId,
        trt,
        grau,
        numero_processo: numeroProcesso,
        data_inicio: parseDate(audiencia.dataInicio),
        data_fim: parseDate(audiencia.dataFim),
        // Horários extraídos de pautaAudienciaHorario (formato HH:MM:SS)
        hora_inicio: audiencia.pautaAudienciaHorario?.horaInicial ?? null,
        hora_fim: audiencia.pautaAudienciaHorario?.horaFinal ?? null,
        sala_audiencia_nome: audiencia.salaAudiencia?.nome?.trim() ?? null,
        status: audiencia.status,
        status_descricao: audiencia.statusDescricao?.trim() ?? null,
        designada: audiencia.designada ?? false,
        em_andamento: audiencia.emAndamento ?? false,
        documento_ativo: audiencia.documentoAtivo ?? false,
        polo_ativo_nome: audiencia.poloAtivo?.nome?.trim() ?? null,
        polo_ativo_representa_varios:
          audiencia.poloAtivo?.representaVarios ?? false,
        polo_passivo_nome: audiencia.poloPassivo?.nome?.trim() ?? null,
        polo_passivo_representa_varios:
          audiencia.poloPassivo?.representaVarios ?? false,
        url_audiencia_virtual: audiencia.urlAudienciaVirtual?.trim() ?? null,
        segredo_justica: audiencia.processo?.segredoDeJustica ?? false,
        juizo_digital: audiencia.processo?.juizoDigital ?? false,
        // modalidade é populada automaticamente pelo trigger baseado em url_audiencia_virtual, tipo_audiencia e endereco_presencial
        ata_audiencia_id: atas?.[audiencia.id]?.documentoId ?? null,
        url_ata_audiencia: atas?.[audiencia.id]?.url ?? null,
      };

      // Buscar registro existente
      const registroExistente = await buscarAudienciaExistente(
        audiencia.id,
        trt,
        grau,
        numeroProcesso
      );

      if (!registroExistente) {
        // Inserir
        const { error } = await supabase.from("audiencias").insert(dadosNovos);

        if (error) {
          throw error;
        }

        inseridos++;
        captureLogService.logInserido(
          entidade,
          audiencia.id,
          trt,
          grau,
          numeroProcesso
        );
      } else {
        // Preservar campos que não devem ser sobrescritos se a captura vier vazia
        // Se o registro existente tem URL/endereço preenchido e a captura não traz, manter o existente
        const dadosParaAtualizar = { ...dadosNovos };

        // Preservar url_audiencia_virtual se existente tem valor e captura não
        const urlExistente = registroExistente.url_audiencia_virtual as
          | string
          | null;
        if (urlExistente && !dadosNovos.url_audiencia_virtual) {
          dadosParaAtualizar.url_audiencia_virtual = urlExistente;
        }

        // Comparar antes de atualizar (usando dados já com preservação)
        const comparacao = compararObjetos(
          dadosParaAtualizar,
          registroExistente as Record<string, unknown>
        );

        if (comparacao.saoIdenticos) {
          naoAtualizados++;
          captureLogService.logNaoAtualizado(
            entidade,
            audiencia.id,
            trt,
            grau,
            numeroProcesso
          );
        } else {
          const dadosAnteriores = removerCamposControle(
            registroExistente as Record<string, unknown>
          );

          const { error } = await supabase
            .from("audiencias")
            .update({
              ...dadosParaAtualizar,
              dados_anteriores: dadosAnteriores,
            })
            .eq("id_pje", audiencia.id)
            .eq("trt", trt)
            .eq("grau", grau)
            .eq("numero_processo", numeroProcesso);

          if (error) {
            throw error;
          }

          atualizados++;
          captureLogService.logAtualizado(
            entidade,
            audiencia.id,
            trt,
            grau,
            numeroProcesso,
            comparacao.camposAlterados
          );
        }
      }
    } catch (error) {
      erros++;
      const erroMsg = error instanceof Error ? error.message : String(error);
      captureLogService.logErro(entidade, erroMsg, {
        id_pje: audiencia.id,
        numero_processo: audiencia.processo?.numero,
        trt,
        grau,
      });
      console.error(`Erro ao salvar audiência ${audiencia.id}:`, error);
    }
  }

  return {
    inseridos,
    atualizados,
    naoAtualizados,
    erros,
    total: audiencias.length,
    orgaosJulgadoresCriados,
    classesJudiciaisCriadas,
    tiposAudienciaCriados,
    salasAudienciaCriadas,
  };
}
