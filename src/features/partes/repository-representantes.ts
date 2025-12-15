/**
 * Repository para representantes (advogados)
 * Funções de persistência para representantes
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type { Representante, UpsertRepresentantePorCPFParams } from './types/representantes-types';

export interface OperacaoRepresentanteResult {
  sucesso: boolean;
  representante?: Representante;
  criado?: boolean;
  erro?: string;
}

/**
 * Busca representante por CPF
 */
export async function buscarRepresentantePorCPF(cpf: string): Promise<Representante | null> {
  const supabase = createServiceClient();
  
  // Normalizar CPF (remover pontos, traços, espaços)
  const cpfNormalizado = cpf.replace(/[.\-\s]/g, '');
  
  const { data, error } = await supabase
    .from('representantes')
    .select('*')
    .eq('cpf', cpfNormalizado)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar representante por CPF: ${error.message}`);
  }

  return data as Representante | null;
}

/**
 * Cria ou atualiza representante por CPF (upsert idempotente)
 */
export async function upsertRepresentantePorCPF(
  params: UpsertRepresentantePorCPFParams
): Promise<OperacaoRepresentanteResult & { criado: boolean }> {
  const supabase = createServiceClient();
  
  // Normalizar CPF
  const cpfNormalizado = params.cpf.replace(/[.\-\s]/g, '');
  
  // Verificar se já existe
  const existente = await buscarRepresentantePorCPF(cpfNormalizado);
  
  const dadosInsercao: Record<string, unknown> = {
    cpf: cpfNormalizado,
    nome: params.nome.trim(),
    sexo: params.sexo ?? null,
    tipo: params.tipo ?? null,
    oabs: params.oabs ?? null,
    emails: params.emails ?? null,
    email: params.email ?? null,
    ddd_celular: params.ddd_celular ?? null,
    numero_celular: params.numero_celular ?? null,
    ddd_residencial: params.ddd_residencial ?? null,
    numero_residencial: params.numero_residencial ?? null,
    ddd_comercial: params.ddd_comercial ?? null,
    numero_comercial: params.numero_comercial ?? null,
    endereco_id: params.endereco_id ?? null,
    dados_anteriores: existente ? {
      ...existente,
      updated_at: existente.updated_at,
    } : null,
  };

  if (existente) {
    // Atualizar existente
    const { data, error } = await supabase
      .from('representantes')
      .update(dadosInsercao)
      .eq('id', existente.id)
      .select()
      .single();

    if (error) {
      return {
        sucesso: false,
        erro: error.message,
        criado: false,
      };
    }

    return {
      sucesso: true,
      representante: data as Representante,
      criado: false,
    };
  } else {
    // Criar novo
    const { data, error } = await supabase
      .from('representantes')
      .insert(dadosInsercao)
      .select()
      .single();

    if (error) {
      return {
        sucesso: false,
        erro: error.message,
        criado: false,
      };
    }

    return {
      sucesso: true,
      representante: data as Representante,
      criado: true,
    };
  }
}

