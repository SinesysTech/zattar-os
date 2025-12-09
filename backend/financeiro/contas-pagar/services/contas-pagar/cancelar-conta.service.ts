/**
 * Serviço de Cancelamento de Contas a Pagar
 * Gerencia a lógica de negócio para cancelamento de contas
 */

import {
  buscarContaPagarPorId,
  cancelarContaPagar as cancelarContaPagarPersistence,
  listarContasPagar,
} from '../persistence/contas-pagar-persistence.service';
import type {
  ContaPagar,
  CancelarContaPagarDTO,
  OperacaoContaPagarResult,
} from '@/backend/types/financeiro/contas-pagar.types';

// ============================================================================
// Serviço Principal
// ============================================================================

/**
 * Cancela uma conta a pagar
 *
 * Fluxo:
 * 1. Busca a conta e valida se pode ser cancelada
 * 2. Atualiza status para 'cancelado'
 * 3. Adiciona motivo às observações
 * 4. Retorna conta atualizada
 */
export const cancelarContaPagar = async (
  contaId: number,
  dados?: CancelarContaPagarDTO
): Promise<OperacaoContaPagarResult> => {
  try {
    // Buscar conta atual
    const contaAtual = await buscarContaPagarPorId(contaId);

    if (!contaAtual) {
      return {
        sucesso: false,
        erro: 'Conta a pagar não encontrada',
      };
    }

    // Validar status
    if (contaAtual.status === 'confirmado') {
      return {
        sucesso: false,
        erro: 'Não é possível cancelar conta já paga. Use estorno se necessário.',
      };
    }

    if (contaAtual.status === 'cancelado') {
      return {
        sucesso: false,
        erro: 'Conta já está cancelada',
      };
    }

    // Cancelar a conta
    const contaCancelada = await cancelarContaPagarPersistence(contaId, dados?.motivo);

    return {
      sucesso: true,
      contaPagar: contaCancelada,
      detalhes: {
        motivoCancelamento: dados?.motivo,
        dataCancelamento: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Erro ao cancelar conta:', error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido ao cancelar conta',
    };
  }
};

/**
 * Cancela uma conta recorrente e opcionalmente todas as futuras geradas
 */
export const cancelarContaRecorrente = async (
  contaId: number,
  opcoes: {
    motivo?: string;
    cancelarFuturas?: boolean;
  }
): Promise<{
  sucesso: boolean;
  contaPrincipal?: ContaPagar;
  contasFuturasCanceladas?: number;
  erro?: string;
}> => {
  try {
    // Buscar conta atual
    const contaAtual = await buscarContaPagarPorId(contaId);

    if (!contaAtual) {
      return {
        sucesso: false,
        erro: 'Conta a pagar não encontrada',
      };
    }

    // Cancelar a conta principal
    const resultadoPrincipal = await cancelarContaPagar(contaId, { motivo: opcoes.motivo });

    if (!resultadoPrincipal.sucesso) {
      return {
        sucesso: false,
        erro: resultadoPrincipal.erro,
      };
    }

    let contasFuturasCanceladas = 0;

    // Se solicitado e a conta é um template recorrente, cancelar futuras
    if (opcoes.cancelarFuturas && contaAtual.recorrente) {
      const resultado = await cancelarContasFilhasRecorrentes(contaId, opcoes.motivo);
      contasFuturasCanceladas = resultado.canceladas;
    }

    return {
      sucesso: true,
      contaPrincipal: resultadoPrincipal.contaPagar,
      contasFuturasCanceladas,
    };
  } catch (error) {
    console.error('Erro ao cancelar conta recorrente:', error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
};

/**
 * Cancela contas futuras geradas a partir de um template
 */
const cancelarContasFilhasRecorrentes = async (
  templateId: number,
  motivo?: string
): Promise<{ canceladas: number; erros: number }> => {
  const hoje = new Date().toISOString().split('T')[0];
  let canceladas = 0;
  let erros = 0;

  // Buscar contas pendentes geradas deste template com vencimento futuro
  const resultado = await listarContasPagar({
    pagina: 1,
    limite: 100,
    status: 'pendente',
    dataVencimentoInicio: hoje,
  });

  // Filtrar apenas as que foram geradas deste template
  const contasFilhas = resultado.items.filter(
    (c) => c.lancamentoOrigemId === templateId
  );

  for (const conta of contasFilhas) {
    try {
      await cancelarContaPagarPersistence(
        conta.id,
        motivo || 'Cancelamento automático - template recorrente cancelado'
      );
      canceladas++;
    } catch (error) {
      console.error(`Erro ao cancelar conta filha ${conta.id}:`, error);
      erros++;
    }
  }

  return { canceladas, erros };
};

/**
 * Cancela múltiplas contas em lote
 */
export const cancelarContasEmLote = async (
  contaIds: number[],
  motivo?: string
): Promise<{
  sucesso: boolean;
  resultados: Array<{ contaId: number; sucesso: boolean; erro?: string }>;
  totalCanceladas: number;
  totalErros: number;
}> => {
  const resultados: Array<{ contaId: number; sucesso: boolean; erro?: string }> = [];
  let totalCanceladas = 0;
  let totalErros = 0;

  for (const contaId of contaIds) {
    const resultado = await cancelarContaPagar(contaId, { motivo });

    if (resultado.sucesso) {
      resultados.push({ contaId, sucesso: true });
      totalCanceladas++;
    } else {
      resultados.push({ contaId, sucesso: false, erro: resultado.erro });
      totalErros++;
    }
  }

  return {
    sucesso: totalErros === 0,
    resultados,
    totalCanceladas,
    totalErros,
  };
};

/**
 * Verifica se uma conta pode ser cancelada
 */
export const podeSerCancelada = async (contaId: number): Promise<{
  pode: boolean;
  motivo?: string;
}> => {
  const conta = await buscarContaPagarPorId(contaId);

  if (!conta) {
    return { pode: false, motivo: 'Conta não encontrada' };
  }

  if (conta.status === 'confirmado') {
    return { pode: false, motivo: 'Conta já foi paga' };
  }

  if (conta.status === 'cancelado') {
    return { pode: false, motivo: 'Conta já está cancelada' };
  }

  return { pode: true };
};

/**
 * Reverter cancelamento (reativar conta)
 */
export const reativarContaCancelada = async (
  contaId: number,
  _motivo?: string
): Promise<OperacaoContaPagarResult> => {
  try {
    const conta = await buscarContaPagarPorId(contaId);

    if (!conta) {
      return {
        sucesso: false,
        erro: 'Conta a pagar não encontrada',
      };
    }

    if (conta.status !== 'cancelado') {
      return {
        sucesso: false,
        erro: 'Apenas contas canceladas podem ser reativadas',
      };
    }

    // Para reativar, usamos o persistence service diretamente
    // Esta funcionalidade precisaria de uma função específica no persistence
    // Por enquanto, retornamos erro informando que não é suportado
    return {
      sucesso: false,
      erro: 'Funcionalidade de reativação ainda não implementada. Crie uma nova conta.',
    };
  } catch (error) {
    console.error('Erro ao reativar conta:', error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
};
