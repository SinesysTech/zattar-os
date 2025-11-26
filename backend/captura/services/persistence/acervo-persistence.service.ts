// Serviço de persistência de acervo (acervo geral + arquivados)
// Salva processos capturados no banco de dados com comparação antes de atualizar

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
 * Parâmetros para salvar processos no acervo
 */
export interface SalvarAcervoParams {
  processos: Processo[];
  advogadoId: number;
  origem: 'acervo_geral' | 'arquivado';
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
 * Busca um processo existente no acervo com todos os campos
 */
async function buscarProcessoExistente(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT,
  numeroProcesso: string
): Promise<Record<string, unknown> | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('acervo')
    .select('*')
    .eq('id_pje', idPje)
    .eq('trt', trt)
    .eq('grau', grau)
    .eq('numero_processo', numeroProcesso.trim())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
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
  params: SalvarAcervoParams
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

  const entidade: TipoEntidade = 'acervo';

  // Processar cada processo individualmente para comparar antes de persistir
  for (const processo of processos) {
    try {
      const numeroProcesso = processo.numeroProcesso.trim();

      // Converter processo para formato do banco
      // Tratar valores nulos/vazios com valores padrão seguros
      const classeJudicial = processo.classeJudicial
        ? processo.classeJudicial.trim()
        : 'Não informada';
      
      const dadosNovos = {
        id_pje: processo.id,
        advogado_id: advogadoId,
        origem,
        trt,
        grau,
        numero_processo: numeroProcesso,
        numero: processo.numero ?? 0,
        descricao_orgao_julgador: processo.descricaoOrgaoJulgador?.trim() || '',
        classe_judicial: classeJudicial,
        segredo_justica: processo.segredoDeJustica ?? false,
        codigo_status_processo: processo.codigoStatusProcesso?.trim() || '',
        prioridade_processual: processo.prioridadeProcessual ?? 0,
        nome_parte_autora: processo.nomeParteAutora?.trim() || '',
        qtde_parte_autora: processo.qtdeParteAutora ?? 1,
        nome_parte_re: processo.nomeParteRe?.trim() || '',
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
        numeroProcesso
      );

      if (!registroExistente) {
        // Registro não existe - inserir e retornar o ID gerado
        const { data: inserted, error } = await supabase
          .from('acervo')
          .insert(dadosNovos)
          .select('id')
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
          numeroProcesso
        );
      } else {
        // Registro existe - mapear o ID existente
        const idExistente = registroExistente.id as number;
        mapeamentoIds.set(processo.id, idExistente);

        // Comparar antes de atualizar
        const comparacao = compararObjetos(
          dadosNovos,
          registroExistente as Record<string, unknown>
        );

        if (comparacao.saoIdenticos) {
          // Registro idêntico - não atualizar
          naoAtualizados++;
          captureLogService.logNaoAtualizado(
            entidade,
            processo.id,
            trt,
            grau,
            numeroProcesso
          );
        } else {
          // Registro diferente - atualizar com dados anteriores
          const dadosAnteriores = removerCamposControle(
            registroExistente as Record<string, unknown>
          );

          const { error } = await supabase
            .from('acervo')
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
        `Erro ao salvar processo ${processo.numeroProcesso}:`,
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
  numeroProcesso: string
): Promise<{ id: number } | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('acervo')
    .select('id')
    .eq('id_pje', idPje)
    .eq('trt', trt)
    .eq('grau', grau)
    .eq('numero_processo', numeroProcesso.trim())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhum registro encontrado
      return null;
    }
    throw new Error(`Erro ao buscar processo no acervo: ${error.message}`);
  }

  return data ? { id: data.id } : null;
}

