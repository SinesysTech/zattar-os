// Serviço de persistência de tipos de audiência
// Nova estrutura: deduplicado por descrição, com trts_metadata JSONB

import { createServiceClient } from '@/lib/supabase/service-client';
import type { CodigoTRT, GrauTRT } from '../../types/trt-types';
import { getCached, setCached, deleteCached } from '@/lib/redis/cache-utils';

/**
 * Interface para tipo de audiência do PJE
 */
export interface TipoAudienciaPJE {
  id: number;
  codigo: string;
  descricao: string;
  isVirtual: boolean;
}

/**
 * Metadados de um TRT para tipo de audiência
 */
export interface TipoAudienciaTrtMetadata {
  trt: string;
  grau: string;
  id_pje: number;
  codigo: string;
}

/**
 * Parâmetros para salvar tipo de audiência
 */
export interface SalvarTipoAudienciaParams {
  tipoAudiencia: TipoAudienciaPJE;
  trt: CodigoTRT;
  grau: GrauTRT;
}

/**
 * Busca tipo de audiência por descrição
 */
export async function buscarTipoAudienciaPorDescricao(
  descricao: string
): Promise<{ id: number; trts_metadata: TipoAudienciaTrtMetadata[] } | null> {
  const key = `tipo_audiencia:descricao:${descricao}`;
  const cached = await getCached<{ id: number; trts_metadata: TipoAudienciaTrtMetadata[] }>(key);
  if (cached !== null) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tipo_audiencia')
    .select('id, trts_metadata')
    .eq('descricao', descricao)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar tipo de audiência: ${error.message}`);
  }

  const result = data as { id: number; trts_metadata: TipoAudienciaTrtMetadata[] };
  await setCached(key, result, 3600);
  return result;
}

/**
 * Busca tipo de audiência existente por ID PJE + TRT + Grau
 * Mantém compatibilidade com código legado
 */
export async function buscarTipoAudiencia(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT
): Promise<{ id: number } | null> {
  const key = `tipo_audiencia:${trt}:${grau}:${idPje}`;
  const cached = await getCached<{ id: number }>(key);
  if (cached !== null) {
    return cached;
  }

  const supabase = createServiceClient();

  // Busca pelo trts_metadata JSONB
  const { data, error } = await supabase
    .from('tipo_audiencia')
    .select('id, trts_metadata')
    .single();

  if (error) {
    // Fallback: buscar todos e filtrar manualmente
    const { data: allData, error: allError } = await supabase
      .from('tipo_audiencia')
      .select('id, trts_metadata');

    if (allError) {
      throw new Error(`Erro ao buscar tipo de audiência: ${allError.message}`);
    }

    // Filtrar pelo metadata
    const found = (allData as Array<{ id: number; trts_metadata: TipoAudienciaTrtMetadata[] }>)?.find(
      item => item.trts_metadata?.some(
        m => m.id_pje === idPje && m.trt === trt && m.grau === grau
      )
    );

    if (!found) {
      return null;
    }

    const result = { id: found.id };
    await setCached(key, result, 3600);
    return result;
  }

  const result = { id: (data as { id: number }).id };
  await setCached(key, result, 3600);
  return result;
}

/**
 * Salva ou atualiza tipo de audiência
 * Nova lógica: busca por descrição, faz merge do trts_metadata
 * Retorna: { inserido: boolean, atualizado: boolean, descartado: boolean, id: number }
 */
export async function salvarTipoAudiencia(
  params: SalvarTipoAudienciaParams
): Promise<{ inserido: boolean; atualizado: boolean; descartado: boolean; id: number }> {
  const supabase = createServiceClient();
  const { tipoAudiencia, trt, grau } = params;

  const novoMetadata: TipoAudienciaTrtMetadata = {
    trt,
    grau,
    id_pje: tipoAudiencia.id,
    codigo: tipoAudiencia.codigo,
  };

  // Buscar por descrição (agora é a chave única)
  const existente = await buscarTipoAudienciaPorDescricao(tipoAudiencia.descricao);

  if (!existente) {
    // Detecta is_virtual pelo nome se contém "videoconfer"
    const isVirtual = tipoAudiencia.isVirtual ||
      tipoAudiencia.descricao.toLowerCase().includes('videoconfer');

    // Inserir novo registro
    const { data, error } = await supabase
      .from('tipo_audiencia')
      .insert({
        descricao: tipoAudiencia.descricao,
        is_virtual: isVirtual,
        trts_metadata: [novoMetadata],
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erro ao inserir tipo de audiência: ${error.message}`);
    }

    // Invalidar caches
    await deleteCached(`tipo_audiencia:descricao:${tipoAudiencia.descricao}`);

    return { inserido: true, atualizado: false, descartado: false, id: data.id };
  }

  // Verificar se já existe este TRT/grau no metadata
  const trtsMetadata = existente.trts_metadata || [];
  const jaExiste = trtsMetadata.some(
    m => m.trt === trt && m.grau === grau && m.id_pje === tipoAudiencia.id
  );

  if (jaExiste) {
    // Descartado - TRT/grau já existe para esta descrição
    return {
      inserido: false,
      atualizado: false,
      descartado: true,
      id: existente.id,
    };
  }

  // Fazer merge: adicionar novo TRT/grau ao metadata existente
  const metadataAtualizado = [...trtsMetadata, novoMetadata];

  // is_virtual é true se o novo tipo é virtual OU se já era virtual antes
  // Também detecta por nome se contém "videoconfer"
  const isVirtual = tipoAudiencia.isVirtual ||
    tipoAudiencia.descricao.toLowerCase().includes('videoconfer');

  const { error } = await supabase
    .from('tipo_audiencia')
    .update({
      trts_metadata: metadataAtualizado,
      is_virtual: isVirtual,
    })
    .eq('id', existente.id);

  if (error) {
    throw new Error(`Erro ao atualizar tipo de audiência: ${error.message}`);
  }

  // Invalidar caches
  await deleteCached(`tipo_audiencia:descricao:${tipoAudiencia.descricao}`);
  await deleteCached(`tipo_audiencia:${trt}:${grau}:${tipoAudiencia.id}`);

  return {
    inserido: false,
    atualizado: true,
    descartado: false,
    id: existente.id,
  };
}
