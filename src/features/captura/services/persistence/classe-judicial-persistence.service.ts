// Serviço de persistência de classes judiciais
// Verifica se já existe e compara antes de atualizar

import { createServiceClient } from '@/lib/utils/supabase/service-client';
import type { CodigoTRT, GrauTRT } from '../../types/trt-types';
import {
  compararObjetos,
} from '@/lib/utils/captura/comparison.util';
import { CACHE_PREFIXES, withCache } from '@/lib/utils/redis/cache-utils';

/**
 * Interface para classe judicial do PJE
 */
export interface ClasseJudicialPJE {
  id: number;
  codigo: string;
  descricao: string;
  sigla: string;
  requerProcessoReferenciaCodigo?: string;
  controlaValorCausa?: boolean;
  podeIncluirAutoridade?: boolean;
  pisoValorCausa?: number;
  tetoValorCausa?: number;
  ativo?: boolean;
  idClasseJudicialPai?: number | null;
  possuiFilhos?: boolean;
}

/**
 * Parâmetros para salvar classe judicial
 */
export interface SalvarClasseJudicialParams {
  classeJudicial: ClasseJudicialPJE;
  trt: CodigoTRT;
  grau: GrauTRT;
}

/**
 * Busca classe judicial existente
 */
export async function buscarClasseJudicial(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT
): Promise<{ id: number } | null> {
  const key = `${CACHE_PREFIXES.classeJudicial}:${trt}:${grau}:${idPje}`;
  return withCache(key, async () => {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('classe_judicial')
      .select('id')
      .eq('id_pje', idPje)
      .eq('trt', trt)
      .eq('grau', grau)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Erro ao buscar classe judicial: ${error.message}`);
    }

    return data as { id: number };
  }, 3600);
}

/**
 * Busca classe judicial existente com todos os campos
 */
async function buscarClasseJudicialCompleta(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT
): Promise<Record<string, unknown> | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('classe_judicial')
    .select('*')
    .eq('id_pje', idPje)
    .eq('trt', trt)
    .eq('grau', grau)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar classe judicial: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

/**
 * Salva ou atualiza classe judicial
 * Retorna: { inserido: boolean, atualizado: boolean, descartado: boolean, id: number }
 */
export async function salvarClasseJudicial(
  params: SalvarClasseJudicialParams
): Promise<{ inserido: boolean; atualizado: boolean; descartado: boolean; id: number }> {
  const supabase = createServiceClient();
  const { classeJudicial, trt, grau } = params;

  const dadosNovos = {
    id_pje: classeJudicial.id,
    trt,
    grau,
    codigo: classeJudicial.codigo,
    descricao: classeJudicial.descricao,
    sigla: classeJudicial.sigla || null,
    requer_processo_referencia_codigo: classeJudicial.requerProcessoReferenciaCodigo || null,
    controla_valor_causa: classeJudicial.controlaValorCausa ?? false,
    pode_incluir_autoridade: classeJudicial.podeIncluirAutoridade ?? false,
    piso_valor_causa: classeJudicial.pisoValorCausa || null,
    teto_valor_causa: classeJudicial.tetoValorCausa || null,
    ativo: classeJudicial.ativo ?? true,
    id_classe_judicial_pai: classeJudicial.idClasseJudicialPai || null,
    possui_filhos: classeJudicial.possuiFilhos ?? false,
  };

  // Buscar registro existente
  const registroExistente = await buscarClasseJudicialCompleta(
    classeJudicial.id,
    trt,
    grau
  );

  if (!registroExistente) {
    // Inserir
    const { data, error } = await supabase
      .from('classe_judicial')
      .insert(dadosNovos)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erro ao inserir classe judicial: ${error.message}`);
    }

    return { inserido: true, atualizado: false, descartado: false, id: data.id };
  }

  // Comparar antes de atualizar
  const comparacao = compararObjetos(dadosNovos, registroExistente);

  if (comparacao.saoIdenticos) {
    // Descartado - dados idênticos
    return {
      inserido: false,
      atualizado: false,
      descartado: true,
      id: registroExistente.id as number,
    };
  }

  // Atualizar
  const { error } = await supabase
    .from('classe_judicial')
    .update(dadosNovos)
    .eq('id_pje', classeJudicial.id)
    .eq('trt', trt)
    .eq('grau', grau);

  if (error) {
    throw new Error(`Erro ao atualizar classe judicial: ${error.message}`);
  }

  return {
    inserido: false,
    atualizado: true,
    descartado: false,
    id: registroExistente.id as number,
  };
}