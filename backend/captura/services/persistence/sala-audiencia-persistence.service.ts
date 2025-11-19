// Serviço de persistência de salas de audiência
// Verifica se já existe e compara antes de atualizar

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';
import { compararObjetos } from '@/backend/utils/captura/comparison.util';
import { getCached, setCached, generateCacheKey, CACHE_PREFIXES } from '@/lib/redis/cache-utils';

/**
 * Interface para sala de audiência do PJE
 */
export interface SalaAudienciaPJE {
  id?: number; // Pode ser undefined se não vier do PJE
  nome: string;
}

/**
 * Parâmetros para salvar sala de audiência
 */
export interface SalvarSalaAudienciaParams {
  salaAudiencia: SalaAudienciaPJE;
  trt: CodigoTRT;
  grau: GrauTRT;
  orgaoJulgadorId: number;
}

/**
 * Busca sala de audiência existente pelo nome, TRT, grau e órgão julgador
 */
export async function buscarSalaAudiencia(
  nome: string,
  trt: CodigoTRT,
  grau: GrauTRT,
  orgaoJulgadorId: number
): Promise<{ id: number } | null> {
  const trimmedNome = nome.trim();
  const cacheKey = generateCacheKey(CACHE_PREFIXES.salaAudiencia, { trt, grau, orgaoJulgadorId, nome: trimmedNome });

  // Try to get from cache
  const cached = await getCached<{ id: number }>(cacheKey);
  if (cached !== null) {
    console.debug(`Cache hit for sala_audiencia: ${cacheKey}`);
    return cached;
  }

  console.debug(`Cache miss for sala_audiencia: ${cacheKey}`);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('sala_audiencia')
    .select('id')
    .eq('nome', trimmedNome)
    .eq('trt', trt)
    .eq('grau', grau)
    .eq('orgao_julgador_id', orgaoJulgadorId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Cache null result for 1 hour to avoid repeated misses
      await setCached(cacheKey, null, 3600);
      return null;
    }
    throw new Error(`Erro ao buscar sala de audiência: ${error.message}`);
  }

  const result = data as { id: number };

  // Cache the result for 1 hour
  await setCached(cacheKey, result, 3600);

  return result;
}

/**
 * Busca sala de audiência existente com todos os campos
 */
async function buscarSalaAudienciaCompleta(
  nome: string,
  trt: CodigoTRT,
  grau: GrauTRT,
  orgaoJulgadorId: number
): Promise<Record<string, unknown> | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('sala_audiencia')
    .select('*')
    .eq('nome', nome.trim())
    .eq('trt', trt)
    .eq('grau', grau)
    .eq('orgao_julgador_id', orgaoJulgadorId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar sala de audiência: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

/**
 * Salva ou atualiza sala de audiência
 * Retorna: { inserido: boolean, atualizado: boolean, descartado: boolean, id: number }
 */
export async function salvarSalaAudiencia(
  params: SalvarSalaAudienciaParams
): Promise<{ inserido: boolean; atualizado: boolean; descartado: boolean; id: number }> {
  const supabase = createServiceClient();
  const { salaAudiencia, trt, grau, orgaoJulgadorId } = params;

  const nome = salaAudiencia.nome.trim();

  const dadosNovos = {
    id_pje: salaAudiencia.id || null,
    trt,
    grau,
    orgao_julgador_id: orgaoJulgadorId,
    nome,
  };

  // Buscar registro existente
  const registroExistente = await buscarSalaAudienciaCompleta(
    nome,
    trt,
    grau,
    orgaoJulgadorId
  );

  if (!registroExistente) {
    // Inserir
    const { data, error } = await supabase
      .from('sala_audiencia')
      .insert(dadosNovos)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erro ao inserir sala de audiência: ${error.message}`);
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

  // Atualizar (apenas id_pje pode mudar)
  const { error } = await supabase
    .from('sala_audiencia')
    .update({ id_pje: dadosNovos.id_pje })
    .eq('nome', nome)
    .eq('trt', trt)
    .eq('grau', grau)
    .eq('orgao_julgador_id', orgaoJulgadorId);

  if (error) {
    throw new Error(`Erro ao atualizar sala de audiência: ${error.message}`);
  }

  return {
    inserido: false,
    atualizado: true,
    descartado: false,
    id: registroExistente.id as number,
  };
}