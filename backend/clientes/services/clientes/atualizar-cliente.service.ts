// Serviço de atualização de cliente
// Gerencia a lógica de negócio para atualizar clientes existentes

import {
  atualizarCliente as atualizarClienteDb,
  type OperacaoClienteResult,
} from '../persistence/cliente-persistence.service';
import type { AtualizarClienteParams } from '@/backend/types/partes';

/**
 * Atualiza um cliente existente
 *
 * Fluxo:
 * 1. Verifica se o cliente existe
 * 2. Valida os dados fornecidos
 * 3. Verifica duplicidades se campos únicos foram alterados
 * 4. Atualiza o registro no banco de dados
 * 5. Retorna o cliente atualizado ou erro
 */
export async function atualizarCliente(
  params: AtualizarClienteParams
): Promise<OperacaoClienteResult> {
  console.log('📝 Atualizando cliente...', { id: params.id, campos: Object.keys(params) });

  try {
    const resultado = await atualizarClienteDb(params);

    if (resultado.sucesso && resultado.cliente) {
      console.log('✅ Cliente atualizado com sucesso:', {
        id: resultado.cliente.id,
        nome: resultado.cliente.nome,
      });
    } else {
      console.error('❌ Erro ao atualizar cliente:', resultado.erro);
    }

    return resultado;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao atualizar cliente:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

