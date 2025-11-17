// Serviço de criação de contrato
// Gerencia a lógica de negócio para cadastrar novos contratos

import {
  criarContrato as criarContratoDb,
  type ContratoDados,
  type OperacaoContratoResult,
} from '../persistence/contrato-persistence.service';

/**
 * Cadastra um novo contrato no sistema
 */
export async function cadastrarContrato(
  params: ContratoDados
): Promise<OperacaoContratoResult> {
  console.log('📝 Iniciando cadastro de contrato...', {
    areaDireito: params.areaDireito,
    tipoContrato: params.tipoContrato,
    clienteId: params.clienteId,
  });

  try {
    const resultado = await criarContratoDb(params);

    if (resultado.sucesso && resultado.contrato) {
      console.log('✅ Contrato cadastrado com sucesso:', {
        id: resultado.contrato.id,
        clienteId: resultado.contrato.clienteId,
        status: resultado.contrato.status,
      });
    } else {
      console.error('❌ Erro ao cadastrar contrato:', resultado.erro);
    }

    return resultado;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao cadastrar contrato:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

