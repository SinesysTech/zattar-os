// Serviço de criação de cliente
// Gerencia a lógica de negócio para cadastrar novos clientes

import {
  criarCliente as criarClienteDb,
  type OperacaoClienteResult,
} from '../persistence/cliente-persistence.service';
import type { CriarPessoaParams } from '@/types/contracts/pessoa';
import type { CriarClienteParams } from '@/types/contracts/partes';

function pessoaToClienteParams(params: CriarPessoaParams): CriarClienteParams {
  const { papel_processual, ...rest } = params;
  return rest;
}

/**
 * Cadastra um novo cliente no sistema
 *
 * Fluxo:
 * 1. Valida os dados de entrada
 * 2. Verifica duplicidades (CPF/CNPJ)
 * 3. Cria o registro no banco de dados
 * 4. Retorna o cliente criado ou erro
 */
export async function cadastrarCliente(
  params: CriarPessoaParams
): Promise<OperacaoClienteResult> {
  console.log('📝 Iniciando cadastro de cliente...', {
    tipo_pessoa: params.tipo_pessoa,
    nome: params.nome,
    documento: params.tipo_pessoa === 'pf'
      ? params.cpf?.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.***.$3-$4')
      : params.cnpj?.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.***.$3/$4-$5'),
  });

  try {
    const clienteParams = pessoaToClienteParams(params);
    const resultado = await criarClienteDb(clienteParams);

    if (resultado.sucesso && resultado.cliente) {
      console.log('✅ Cliente cadastrado com sucesso:', {
        id: resultado.cliente.id,
        tipo_pessoa: resultado.cliente.tipo_pessoa,
        nome: resultado.cliente.nome,
      });
    } else {
      console.error('❌ Erro ao cadastrar cliente:', resultado.erro);
    }

    return resultado;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao cadastrar cliente:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

