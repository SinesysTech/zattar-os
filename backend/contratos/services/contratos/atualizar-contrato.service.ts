// Serviço de atualização de contrato
// Gerencia a lógica de negócio para atualizar contratos existentes

import {
  atualizarContrato as atualizarContratoDb,
  type ContratoDados,
  type OperacaoContratoResult,
} from '../persistence/contrato-persistence.service';

/**
 * Atualiza um contrato existente
 */
export async function atualizarContrato(
  id: number,
  params: Partial<ContratoDados>
): Promise<OperacaoContratoResult> {
  console.log('📝 Atualizando contrato...', { id, campos: Object.keys(params) });

  try {
    const resultado = await atualizarContratoDb(id, params);

    if (resultado.sucesso && resultado.contrato) {
      console.log('✅ Contrato atualizado com sucesso:', {
        id: resultado.contrato.id,
        status: resultado.contrato.status,
      });
    } else {
      console.error('❌ Erro ao atualizar contrato:', resultado.erro);
    }

    return resultado;
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro inesperado ao atualizar contrato:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

