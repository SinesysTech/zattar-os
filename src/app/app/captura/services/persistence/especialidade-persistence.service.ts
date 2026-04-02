// Serviço de persistência de especialidades de perícia
// Salva especialidades de perícia capturadas no banco de dados

import { createServiceClient } from '@/lib/supabase/service-client';
import type { CodigoTRT, GrauTRT } from '../../types/trt-types';
import { getCached, setCached } from '@/lib/redis/cache-utils';

/**
 * Dados de uma especialidade de perícia vindo da API do PJE
 */
export interface EspecialidadePericiaInput {
  id: number;
  descricao: string;
}

/**
 * Parâmetros para salvar especialidade de perícia
 */
export interface SalvarEspecialidadeParams {
  especialidade: EspecialidadePericiaInput;
  trt: CodigoTRT;
  grau: GrauTRT;
}

/**
 * Salva ou atualiza uma especialidade de perícia no banco de dados
 * Usa UPSERT baseado na constraint unique (id_pje, trt, grau)
 */
export async function salvarEspecialidade(
  params: SalvarEspecialidadeParams
): Promise<{ id: number; inserido: boolean }> {
  const supabase = createServiceClient();

  const { especialidade, trt, grau } = params;

  const dados = {
    id_pje: especialidade.id,
    trt,
    grau,
    descricao: especialidade.descricao.trim(),
    ativo: true,
  };

  // UPSERT: se já existe (mesmo id_pje, trt, grau), atualiza; senão, insere
  const { data, error } = await supabase
    .from('especialidades_pericia')
    .upsert(dados, {
      onConflict: 'id_pje,trt,grau',
      ignoreDuplicates: false,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Erro ao salvar especialidade de perícia: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao salvar especialidade de perícia: nenhum dado retornado');
  }

  // Verificar se foi inserido ou atualizado checando se existia antes
  // Como não temos essa informação direta do upsert, vamos assumir inserido=true
  // (o importante é ter o ID para uso posterior)
  return { id: data.id, inserido: true };
}

/**
 * Busca uma especialidade de perícia pelo ID do PJE, TRT e grau
 */
export async function buscarEspecialidade(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT
): Promise<{ id: number } | null> {
  const cacheKey = `especialidade_pericia:${trt}:${grau}:${idPje}`;
  const cached = await getCached<{ id: number }>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('especialidades_pericia')
    .select('id')
    .eq('id_pje', idPje)
    .eq('trt', trt)
    .eq('grau', grau)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhum registro encontrado
      return null;
    }
    throw new Error(`Erro ao buscar especialidade de perícia: ${error.message}`);
  }

  const result = data ? { id: data.id } : null;
  if (result !== null) {
    await setCached(cacheKey, result, 3600);
  }
  return result;
}

