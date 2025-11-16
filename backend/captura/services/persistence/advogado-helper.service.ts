// Helper para buscar advogado no banco de dados
// Usado para obter advogado_id a partir do CPF

import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Busca um advogado pelo CPF
 * Se não existir, cria um novo advogado (temporário - em produção deve vir do cadastro)
 */
export async function buscarOuCriarAdvogadoPorCpf(
  cpf: string,
  nome?: string
): Promise<{ id: number }> {
  const supabase = createServiceClient();

  // Buscar advogado existente
  const { data: advogadoExistente, error: erroBusca } = await supabase
    .from('advogados')
    .select('id')
    .eq('cpf', cpf.trim())
    .single();

  if (erroBusca && erroBusca.code !== 'PGRST116') {
    // Erro diferente de "não encontrado"
    throw new Error(`Erro ao buscar advogado: ${erroBusca.message}`);
  }

  if (advogadoExistente) {
    return { id: advogadoExistente.id };
  }

  // Advogado não existe - criar novo
  // NOTA: Em produção, isso deve ser feito no cadastro de advogados
  // Por enquanto, criamos com dados mínimos
  const { data: novoAdvogado, error: erroCriacao } = await supabase
    .from('advogados')
    .insert({
      cpf: cpf.trim(),
      nome_completo: nome?.trim() ?? 'Advogado não cadastrado',
      oab: '000000', // Placeholder - deve ser preenchido no cadastro
      uf_oab: 'RJ', // Placeholder - deve ser preenchido no cadastro
    })
    .select('id')
    .single();

  if (erroCriacao) {
    throw new Error(`Erro ao criar advogado: ${erroCriacao.message}`);
  }

  if (!novoAdvogado) {
    throw new Error('Erro ao criar advogado: nenhum dado retornado');
  }

  return { id: novoAdvogado.id };
}

