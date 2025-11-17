// Serviço de persistência de processos pendentes de manifestação
// Salva processos pendentes capturados no banco de dados

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { Processo } from '@/backend/api/pje-trt/types';
import type { CodigoTRT, GrauTRT } from '../trt/types';

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
 * Salva múltiplos processos pendentes de manifestação
 * Usa UPSERT baseado na constraint unique (id_pje, trt, grau, numero_processo)
 * O trigger sync_pendentes_processo_id() preencherá automaticamente o processo_id
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
      erros: 0,
      total: 0,
    };
  }

  // Converter processos para formato do banco
  const dados = processos.map((processo) => ({
    id_pje: processo.id,
    advogado_id: advogadoId,
    trt,
    grau,
    numero_processo: processo.numeroProcesso.trim(),
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
  }));

  // UPSERT em lotes para melhor performance
  const BATCH_SIZE = 100;
  const inseridos = 0; // UPSERT não distingue inseridos de atualizados, sempre 0
  let atualizados = 0;
  let erros = 0;

  for (let i = 0; i < dados.length; i += BATCH_SIZE) {
    const batch = dados.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('pendentes_manifestacao')
      .upsert(batch, {
        onConflict: 'id_pje,trt,grau,numero_processo',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) {
      console.error(`Erro ao salvar lote de pendentes (${i + 1}-${Math.min(i + BATCH_SIZE, dados.length)}):`, error);
      erros += batch.length;
    } else {
      const count = data?.length ?? 0;
      atualizados += count;
    }
  }

  return {
    inseridos: 0, // UPSERT não distingue inseridos de atualizados
    atualizados: inseridos + atualizados,
    erros,
    total: processos.length,
  };
}

