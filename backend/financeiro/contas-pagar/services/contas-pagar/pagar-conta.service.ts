/**
 * Serviço de Pagamento de Contas a Pagar
 * Gerencia a lógica de negócio para efetivação de pagamentos
 */

import {
  buscarContaPagarPorId,
  confirmarPagamentoContaPagar,
} from '../persistence/contas-pagar-persistence.service';
import { invalidateDRECacheOnLancamento } from '@/backend/financeiro/dre/services/persistence/dre-persistence.service';
import type {
  ContaPagar,
  PagarContaPagarDTO,
  OperacaoContaPagarResult,
  AnexoContaPagar,
} from '@/backend/types/financeiro/contas-pagar.types';

// ============================================================================
// Tipos de Validação
// ============================================================================

interface ValidacaoPagamentoResult {
  valido: boolean;
  erros: string[];
}

// ============================================================================
// Validações
// ============================================================================

/**
 * Valida se o pagamento pode ser efetuado
 */
const validarPagamento = async (
  contaId: number,
  dados: PagarContaPagarDTO
): Promise<ValidacaoPagamentoResult> => {
  const erros: string[] = [];

  // Buscar conta
  const conta = await buscarContaPagarPorId(contaId);

  if (!conta) {
    return { valido: false, erros: ['Conta a pagar não encontrada'] };
  }

  // Validar status
  if (conta.status !== 'pendente') {
    const statusLabels: Record<string, string> = {
      confirmado: 'já está paga',
      cancelado: 'está cancelada',
      estornado: 'foi estornada',
    };
    erros.push(`Conta ${statusLabels[conta.status] || 'não está pendente'}`);
  }

  // Validar forma de pagamento
  if (!dados.formaPagamento) {
    erros.push('Forma de pagamento é obrigatória');
  }

  // Validar conta bancária
  if (!dados.contaBancariaId) {
    erros.push('Conta bancária é obrigatória');
  }

  // Validar data de efetivação (se fornecida, deve ser <= hoje)
  if (dados.dataEfetivacao) {
    const dataEfetivacao = new Date(dados.dataEfetivacao);
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    if (dataEfetivacao > hoje) {
      erros.push('Data de efetivação não pode ser futura');
    }
  }

  // Validar comprovante (se fornecido)
  if (dados.comprovante) {
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!tiposPermitidos.some((tipo) => dados.comprovante?.tipo.includes(tipo.split('/')[1]))) {
      erros.push('Tipo de comprovante não permitido. Use PDF, JPG ou PNG');
    }

    const tamanhoMaximo = 5 * 1024 * 1024; // 5MB
    if (dados.comprovante.tamanho > tamanhoMaximo) {
      erros.push('Comprovante excede tamanho máximo de 5MB');
    }
  }

  return { valido: erros.length === 0, erros };
};

// ============================================================================
// Serviço Principal
// ============================================================================

/**
 * Efetua o pagamento de uma conta a pagar
 *
 * Fluxo:
 * 1. Busca a conta e valida se pode ser paga
 * 2. Valida forma de pagamento e conta bancária
 * 3. Atualiza status para 'confirmado' com data de efetivação
 * 4. Adiciona comprovante aos anexos se fornecido
 * 5. Retorna conta atualizada
 */
export const pagarContaPagar = async (
  contaId: number,
  dados: PagarContaPagarDTO,
  usuarioId?: number
): Promise<OperacaoContaPagarResult> => {
  try {
    // Validar pagamento
    const validacao = await validarPagamento(contaId, dados);
    if (!validacao.valido) {
      return {
        sucesso: false,
        erro: validacao.erros.join('. '),
      };
    }

    // Buscar conta para obter dados atuais
    const contaAtual = await buscarContaPagarPorId(contaId);
    if (!contaAtual) {
      return {
        sucesso: false,
        erro: 'Conta a pagar não encontrada',
      };
    }

    // Preparar comprovante com metadados adicionais
    let comprovante: AnexoContaPagar | undefined;
    if (dados.comprovante) {
      comprovante = {
        ...dados.comprovante,
        uploadedAt: new Date().toISOString(),
        uploadedBy: usuarioId,
      };
    }

    // Efetuar pagamento
    const contaPaga = await confirmarPagamentoContaPagar(contaId, {
      formaPagamento: dados.formaPagamento,
      contaBancariaId: dados.contaBancariaId,
      dataEfetivacao: dados.dataEfetivacao,
      observacoes: dados.observacoes,
      comprovante,
    });

    // Invalidar cache do DRE para o período afetado
    if (contaPaga.dataCompetencia) {
      await invalidateDRECacheOnLancamento(contaPaga.dataCompetencia);
    }

    return {
      sucesso: true,
      contaPagar: contaPaga,
      detalhes: {
        valorPago: contaPaga.valor,
        dataEfetivacao: contaPaga.dataEfetivacao,
        formaPagamento: contaPaga.formaPagamento,
        contaBancariaId: contaPaga.contaBancariaId,
      },
    };
  } catch (error) {
    console.error('Erro ao pagar conta:', error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido ao processar pagamento',
    };
  }
};

/**
 * Efetua pagamento em lote de múltiplas contas
 */
export const pagarContasEmLote = async (
  contaIds: number[],
  dados: Omit<PagarContaPagarDTO, 'comprovante'>,
  usuarioId?: number
): Promise<{
  sucesso: boolean;
  resultados: Array<{ contaId: number; sucesso: boolean; erro?: string }>;
  totalPago: number;
  totalErros: number;
}> => {
  const resultados: Array<{ contaId: number; sucesso: boolean; erro?: string }> = [];
  let totalPago = 0;
  let totalErros = 0;

  for (const contaId of contaIds) {
    const resultado = await pagarContaPagar(contaId, dados, usuarioId);

    if (resultado.sucesso && resultado.contaPagar) {
      resultados.push({ contaId, sucesso: true });
      totalPago += resultado.contaPagar.valor;
    } else {
      resultados.push({ contaId, sucesso: false, erro: resultado.erro });
      totalErros++;
    }
  }

  return {
    sucesso: totalErros === 0,
    resultados,
    totalPago,
    totalErros,
  };
};

/**
 * Verifica se uma conta pode ser paga
 */
export const podeSerPaga = async (contaId: number): Promise<{
  pode: boolean;
  motivo?: string;
}> => {
  const conta = await buscarContaPagarPorId(contaId);

  if (!conta) {
    return { pode: false, motivo: 'Conta não encontrada' };
  }

  if (conta.status !== 'pendente') {
    const motivos: Record<string, string> = {
      confirmado: 'Conta já foi paga',
      cancelado: 'Conta foi cancelada',
      estornado: 'Conta foi estornada',
    };
    return { pode: false, motivo: motivos[conta.status] || 'Status inválido' };
  }

  return { pode: true };
};
