/**
 * Serviço de Cancelamento de Contas a Receber
 * Gerencia a lógica de negócio para cancelamento de contas
 */

import {
  buscarContaReceberPorId,
  cancelarContaReceber as cancelarContaReceberPersistence,
  listarContasReceber,
} from '../persistence/contas-receber-persistence.service';
import type {
  CancelarContaReceberDTO,
  OperacaoContaReceberResult,
} from '@/backend/types/financeiro/contas-receber.types';

// ============================================================================
// Tipos
// ============================================================================

interface ValidacaoCancelamentoResult {
  valido: boolean;
  erros: string[];
}

// ============================================================================
// Validações
// ============================================================================

/**
 * Valida se a conta pode ser cancelada
 */
const validarCancelamento = async (
  contaId: number
): Promise<ValidacaoCancelamentoResult> => {
  const erros: string[] = [];

  // Buscar conta
  const conta = await buscarContaReceberPorId(contaId);

  if (!conta) {
    return { valido: false, erros: ['Conta a receber não encontrada'] };
  }

  // Validar status
  if (conta.status === 'confirmado') {
    erros.push('Não é possível cancelar conta já recebida. Considere estornar o recebimento.');
  }

  if (conta.status === 'cancelado') {
    erros.push('Conta já está cancelada');
  }

  if (conta.status === 'estornado') {
    erros.push('Conta já foi estornada');
  }

  return { valido: erros.length === 0, erros };
};

// ============================================================================
// Serviço Principal
// ============================================================================

/**
 * Cancela uma conta a receber
 *
 * Fluxo:
 * 1. Busca a conta e valida se pode ser cancelada
 * 2. Atualiza status para 'cancelado'
 * 3. Adiciona motivo às observações
 * 4. Opcionalmente cancela contas recorrentes filhas
 * 5. Retorna conta atualizada
 */
export const cancelarContaReceber = async (
  contaId: number,
  dados: CancelarContaReceberDTO = {}
): Promise<OperacaoContaReceberResult> => {
  try {
    // Validar cancelamento
    const validacao = await validarCancelamento(contaId);
    if (!validacao.valido) {
      return {
        sucesso: false,
        erro: validacao.erros.join('. '),
      };
    }

    // Buscar conta atual
    const contaAtual = await buscarContaReceberPorId(contaId);
    if (!contaAtual) {
      return {
        sucesso: false,
        erro: 'Conta a receber não encontrada',
      };
    }

    // Cancelar conta principal
    const contaCancelada = await cancelarContaReceberPersistence(contaId, dados.motivo);

    // Se solicitado e a conta é template recorrente, cancelar contas filhas pendentes
    if (dados.cancelarRecorrentes && contaAtual.recorrente) {
      await cancelarContasRecorrentesFilhas(contaId);
    }

    return {
      sucesso: true,
      contaReceber: contaCancelada,
      detalhes: {
        motivoCancelamento: dados.motivo,
        cancelouRecorrentes: dados.cancelarRecorrentes || false,
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
 * Cancela múltiplas contas em lote
 */
export const cancelarContasEmLote = async (
  contaIds: number[],
  motivo?: string
): Promise<{
  sucesso: boolean;
  resultados: Array<{ contaId: number; sucesso: boolean; erro?: string }>;
  totalCancelados: number;
  totalErros: number;
}> => {
  const resultados: Array<{ contaId: number; sucesso: boolean; erro?: string }> = [];
  let totalCancelados = 0;
  let totalErros = 0;

  for (const contaId of contaIds) {
    const resultado = await cancelarContaReceber(contaId, { motivo });

    if (resultado.sucesso) {
      resultados.push({ contaId, sucesso: true });
      totalCancelados++;
    } else {
      resultados.push({ contaId, sucesso: false, erro: resultado.erro });
      totalErros++;
    }
  }

  return {
    sucesso: totalErros === 0,
    resultados,
    totalCancelados,
    totalErros,
  };
};

/**
 * Cancela todas as contas pendentes geradas a partir de um template
 */
const cancelarContasRecorrentesFilhas = async (templateId: number): Promise<number> => {
  // Buscar contas pendentes que foram geradas a partir deste template
  const { items: contasFilhas } = await listarContasReceber({
    status: 'pendente',
    limite: 1000, // Limite alto para pegar todas
  });

  // Filtrar apenas as que têm o templateId como origem
  const contasParaCancelar = contasFilhas.filter(
    (c) => c.lancamentoOrigemId === templateId && c.status === 'pendente'
  );

  let canceladas = 0;

  for (const conta of contasParaCancelar) {
    try {
      await cancelarContaReceberPersistence(
        conta.id,
        `Cancelado automaticamente devido ao cancelamento do template recorrente #${templateId}`
      );
      canceladas++;
    } catch (error) {
      console.error(`Erro ao cancelar conta filha ${conta.id}:`, error);
    }
  }

  console.log(`Canceladas ${canceladas} contas recorrentes filhas do template ${templateId}`);
  return canceladas;
};

/**
 * Verifica se uma conta pode ser cancelada
 */
export const podeSerCancelada = async (contaId: number): Promise<{
  pode: boolean;
  motivo?: string;
}> => {
  const conta = await buscarContaReceberPorId(contaId);

  if (!conta) {
    return { pode: false, motivo: 'Conta não encontrada' };
  }

  if (conta.status === 'confirmado') {
    return { pode: false, motivo: 'Conta já foi recebida' };
  }

  if (conta.status === 'cancelado') {
    return { pode: false, motivo: 'Conta já está cancelada' };
  }

  if (conta.status === 'estornado') {
    return { pode: false, motivo: 'Conta foi estornada' };
  }

  return { pode: true };
};
