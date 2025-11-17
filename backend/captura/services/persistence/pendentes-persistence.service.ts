// Serviço de persistência de processos pendentes de manifestação
// Salva processos pendentes capturados no banco de dados com comparação antes de atualizar

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { Processo } from '@/backend/types/pje-trt/types';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';
import {
  compararObjetos,
  removerCamposControle,
} from '@/backend/utils/captura/comparison.util';
import {
  captureLogService,
  type TipoEntidade,
} from './capture-log.service';

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
}

/**
 * Resultado da persistência
 */
export interface SalvarPendentesResult {
  inseridos: number;
  atualizados: number;
  naoAtualizados: number;
  erros: number;
  total: number;
}

/**
 * Converte data ISO string para timestamptz ou null
 */
function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    return new Date(dateString).toISOString();
  } catch {
    return null;
  }
}

/**
 * Busca um processo pendente existente com todos os campos
 */
async function buscarPendenteExistente(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT,
  numeroProcesso: string
): Promise<Record<string, unknown> | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('pendentes_manifestacao')
    .select('*')
    .eq('id_pje', idPje)
    .eq('trt', trt)
    .eq('grau', grau)
    .eq('numero_processo', numeroProcesso.trim())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
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
  const { processos, advogadoId, trt, grau } = params;

  if (processos.length === 0) {
    return {
      inseridos: 0,
      atualizados: 0,
      naoAtualizados: 0,
      erros: 0,
      total: 0,
    };
  }

  let inseridos = 0;
  let atualizados = 0;
  let naoAtualizados = 0;
  let erros = 0;

  const entidade: TipoEntidade = 'pendentes_manifestacao';

  // Processar cada processo individualmente
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
      };

      // Buscar registro existente
      const registroExistente = await buscarPendenteExistente(
        processo.id,
        trt,
        grau,
        numeroProcesso
      );

      if (!registroExistente) {
        // Inserir
        const { error } = await supabase
          .from('pendentes_manifestacao')
          .insert(dadosNovos);

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

          const { error } = await supabase
            .from('pendentes_manifestacao')
            .update({
              ...dadosNovos,
              dados_anteriores: dadosAnteriores,
            })
            .eq('id_pje', processo.id)
            .eq('trt', trt)
            .eq('grau', grau)
            .eq('numero_processo', numeroProcesso);

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
            comparacao.camposAlterados
          );
        }
      }
    } catch (error) {
      erros++;
      const erroMsg =
        error instanceof Error ? error.message : String(error);
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
    erros,
    total: processos.length,
  };
}

