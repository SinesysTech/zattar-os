// Serviço de persistência de órgãos julgadores
// Salva órgãos julgadores capturados das audiências no banco de dados

import { createServiceClient } from '@/lib/supabase/service-client';
import type { CodigoTRT, GrauTRT } from '../../types/trt-types';
import { getCached, setCached } from '@/lib/redis/cache-utils';

/**
 * Dados de um órgão julgador vindo da API do PJE
 */
export interface OrgaoJulgadorPJE {
  id: number;
  descricao: string;
  cejusc?: boolean;
  ativo?: boolean;
  postoAvancado?: boolean;
  novoOrgaoJulgador?: boolean;
  codigoServentiaCnj?: number;
}

/**
 * Parâmetros para salvar órgão julgador
 */
export interface SalvarOrgaoJulgadorParams {
  orgaoJulgador: OrgaoJulgadorPJE;
  trt: CodigoTRT;
  grau: GrauTRT;
}

/**
 * Salva ou atualiza um órgão julgador no banco de dados
 * Usa UPSERT baseado na constraint unique (id_pje, trt, grau)
 */
export async function salvarOrgaoJulgador(
  params: SalvarOrgaoJulgadorParams
): Promise<{ id: number }> {
  const supabase = createServiceClient();

  const { orgaoJulgador, trt, grau } = params;

  const dados = {
    id_pje: orgaoJulgador.id,
    trt,
    grau,
    descricao: orgaoJulgador.descricao.trim(),
    cejusc: orgaoJulgador.cejusc ?? false,
    ativo: orgaoJulgador.ativo ?? true,
    posto_avancado: orgaoJulgador.postoAvancado ?? false,
    novo_orgao_julgador: orgaoJulgador.novoOrgaoJulgador ?? false,
    codigo_serventia_cnj: orgaoJulgador.codigoServentiaCnj ?? 0,
  };

  // UPSERT: se já existe (mesmo id_pje, trt, grau), atualiza; senão, insere
  const { data, error } = await supabase
    .from('orgao_julgador')
    .upsert(dados, {
      onConflict: 'id_pje,trt,grau',
      ignoreDuplicates: false,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Erro ao salvar órgão julgador: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao salvar órgão julgador: nenhum dado retornado');
  }

  return { id: data.id };
}

/**
 * Busca um órgão julgador pelo ID do PJE, TRT e grau
 */
export async function buscarOrgaoJulgador(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT
): Promise<{ id: number } | null> {
  const cacheKey = `orgao_julgador:${trt}:${grau}:${idPje}`;
  const cached = await getCached<{ id: number }>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('orgao_julgador')
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
    throw new Error(`Erro ao buscar órgão julgador: ${error.message}`);
  }

  const result = data ? { id: data.id } : null;
  if (result !== null) {
    await setCached(cacheKey, result, 3600);
  }
  return result;
}

/**
 * Busca um órgão julgador pela descrição, TRT e grau
 * Usado quando não temos o ID do PJE (ex: perícias)
 */
export async function buscarOrgaoJulgadorPorDescricao(
  descricao: string,
  trt: CodigoTRT,
  grau: GrauTRT
): Promise<{ id: number } | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('orgao_julgador')
    .select('id')
    .eq('descricao', descricao.trim())
    .eq('trt', trt)
    .eq('grau', grau)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar órgão julgador: ${error.message}`);
  }

  return data ? { id: data.id } : null;
}