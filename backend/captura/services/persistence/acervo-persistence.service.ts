// Serviço de persistência de acervo (acervo geral + arquivados)
// Salva processos capturados no banco de dados

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { Processo } from '@/backend/api/pje-trt/types';
import type { CodigoTRT, GrauTRT } from '../trt/types';

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
 * Salva múltiplos processos no acervo
 * Usa UPSERT baseado na constraint unique (id_pje, trt, grau, numero_processo)
 */
export async function salvarAcervo(
  params: SalvarAcervoParams
): Promise<SalvarAcervoResult> {
  const supabase = createServiceClient();
  const { processos, advogadoId, origem, trt, grau } = params;

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
    origem,
    trt,
    grau,
    numero_processo: processo.numeroProcesso.trim(),
    numero: processo.numero,
    descricao_orgao_julgador: processo.descricaoOrgaoJulgador.trim(),
    classe_judicial: processo.classeJudicial.trim(),
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
    data_proxima_audiencia: parseDate(processo.dataProximaAudiencia),
    tem_associacao: processo.temAssociacao ?? false,
  }));

  // UPSERT em lotes para melhor performance
  const BATCH_SIZE = 100;
  const inseridos = 0; // UPSERT não distingue inseridos de atualizados, sempre 0
  let atualizados = 0;
  let erros = 0;

  for (let i = 0; i < dados.length; i += BATCH_SIZE) {
    const batch = dados.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('acervo')
      .upsert(batch, {
        onConflict: 'id_pje,trt,grau,numero_processo',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) {
      console.error(`Erro ao salvar lote de processos (${i + 1}-${Math.min(i + BATCH_SIZE, dados.length)}):`, error);
      erros += batch.length;
    } else {
      // Contar inseridos vs atualizados (aproximação: se retornou dados, foi upsert bem-sucedido)
      const count = data?.length ?? 0;
      // Não temos como distinguir inseridos de atualizados com upsert, então contamos como atualizados
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

