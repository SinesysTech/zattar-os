import { createServiceClient } from '@/lib/supabase/service-client';

/**
 * Busca o advogado no banco pelo CPF.
 *
 * Importante: este helper NÃO cria advogado automaticamente, porque a entidade
 * `advogados` exige campos (ex.: OAB/UF) que não estão disponíveis no fluxo de
 * autenticação do PJE (temos apenas CPF/nome).
 *
 * Se precisar de criação automática no futuro, isso deve ser feito com um
 * contrato de entrada completo (cpf + nome + oab + uf_oab), em um caso de uso
 * explícito.
 */
export async function buscarOuCriarAdvogadoPorCpf(
  cpf: string,
  nome?: string
): Promise<{ id: number }> {
  const cpfLimpo = (cpf || '').replace(/\D/g, '');
  if (cpfLimpo.length !== 11) {
    throw new Error('CPF do advogado inválido');
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('advogados')
    .select('id')
    .eq('cpf', cpfLimpo)
    .single();

  if (error || !data?.id) {
    const nomeInfo = nome ? ` (${nome})` : '';
    throw new Error(`Advogado não encontrado para CPF ${cpfLimpo}${nomeInfo}`);
  }

  return { id: data.id as number };
}


