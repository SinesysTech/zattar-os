// Serviço de persistência de tipos de audiência
// Verifica se já existe e compara antes de atualizar

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';
import { compararObjetos } from '@/backend/utils/captura/comparison.util';

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
 * Parâmetros para salvar tipo de audiência
 */
export interface SalvarTipoAudienciaParams {
  tipoAudiencia: TipoAudienciaPJE;
  trt: CodigoTRT;
  grau: GrauTRT;
}

/**
 * Busca tipo de audiência existente
 */
export async function buscarTipoAudiencia(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT
): Promise<{ id: number } | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tipo_audiencia')
    .select('id')
    .eq('id_pje', idPje)
    .eq('trt', trt)
    .eq('grau', grau)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar tipo de audiência: ${error.message}`);
  }

  return data as { id: number };
}

/**
 * Busca tipo de audiência existente com todos os campos
 */
async function buscarTipoAudienciaCompleta(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT
): Promise<Record<string, unknown> | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tipo_audiencia')
    .select('*')
    .eq('id_pje', idPje)
    .eq('trt', trt)
    .eq('grau', grau)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar tipo de audiência: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

/**
 * Salva ou atualiza tipo de audiência
 * Retorna: { inserido: boolean, atualizado: boolean, descartado: boolean, id: number }
 */
export async function salvarTipoAudiencia(
  params: SalvarTipoAudienciaParams
): Promise<{ inserido: boolean; atualizado: boolean; descartado: boolean; id: number }> {
  const supabase = createServiceClient();
  const { tipoAudiencia, trt, grau } = params;

  const dadosNovos = {
    id_pje: tipoAudiencia.id,
    trt,
    grau,
    codigo: tipoAudiencia.codigo,
    descricao: tipoAudiencia.descricao,
    is_virtual: tipoAudiencia.isVirtual,
  };

  // Buscar registro existente
  const registroExistente = await buscarTipoAudienciaCompleta(
    tipoAudiencia.id,
    trt,
    grau
  );

  if (!registroExistente) {
    // Inserir
    const { data, error } = await supabase
      .from('tipo_audiencia')
      .insert(dadosNovos)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erro ao inserir tipo de audiência: ${error.message}`);
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
    .from('tipo_audiencia')
    .update(dadosNovos)
    .eq('id_pje', tipoAudiencia.id)
    .eq('trt', trt)
    .eq('grau', grau);

  if (error) {
    throw new Error(`Erro ao atualizar tipo de audiência: ${error.message}`);
  }

  return {
    inserido: false,
    atualizado: true,
    descartado: false,
    id: registroExistente.id as number,
  };
}
