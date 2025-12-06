/**
 * Serviço de Recebimento de Contas a Receber
 * Gerencia a lógica de negócio para efetivação de recebimentos
 */

import {
  buscarContaReceberPorId,
  confirmarRecebimentoContaReceber,
} from '../persistence/contas-receber-persistence.service';
import type {
  ContaReceber,
  ReceberContaReceberDTO,
  OperacaoContaReceberResult,
  AnexoContaReceber,
} from '@/backend/types/financeiro/contas-receber.types';

// ============================================================================
// Tipos de Validação
// ============================================================================

interface ValidacaoRecebimentoResult {
  valido: boolean;
  erros: string[];
}

// ============================================================================
// Validações
// ============================================================================

/**
 * Valida se o recebimento pode ser efetuado
 */
const validarRecebimento = async (
  contaId: number,
  dados: ReceberContaReceberDTO
): Promise<ValidacaoRecebimentoResult> => {
  const erros: string[] = [];

  // Buscar conta
  const conta = await buscarContaReceberPorId(contaId);

  if (!conta) {
    return { valido: false, erros: ['Conta a receber não encontrada'] };
  }

  // Validar status
  if (conta.status !== 'pendente') {
    const statusLabels: Record<string, string> = {
      confirmado: 'já foi recebida',
      cancelado: 'está cancelada',
      estornado: 'foi estornada',
    };
    erros.push(`Conta ${statusLabels[conta.status] || 'não está pendente'}`);
  }

  // Validar forma de recebimento
  if (!dados.formaRecebimento) {
    erros.push('Forma de recebimento é obrigatória');
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
 * Efetua o recebimento de uma conta a receber
 *
 * Fluxo:
 * 1. Busca a conta e valida se pode ser recebida
 * 2. Valida forma de recebimento e conta bancária
 * 3. Atualiza status para 'confirmado' com data de efetivação
 * 4. Adiciona comprovante aos anexos se fornecido
 * 5. Retorna conta atualizada
 */
export const receberContaReceber = async (
  contaId: number,
  dados: ReceberContaReceberDTO,
  usuarioId?: number
): Promise<OperacaoContaReceberResult> => {
  try {
    // Validar recebimento
    const validacao = await validarRecebimento(contaId, dados);
    if (!validacao.valido) {
      return {
        sucesso: false,
        erro: validacao.erros.join('. '),
      };
    }

    // Buscar conta para obter dados atuais
    const contaAtual = await buscarContaReceberPorId(contaId);
    if (!contaAtual) {
      return {
        sucesso: false,
        erro: 'Conta a receber não encontrada',
      };
    }

    // Preparar comprovante com metadados adicionais
    let comprovante: AnexoContaReceber | undefined;
    if (dados.comprovante) {
      comprovante = {
        ...dados.comprovante,
        uploadedAt: new Date().toISOString(),
        uploadedBy: usuarioId,
      };
    }

    // Efetuar recebimento
    const contaRecebida = await confirmarRecebimentoContaReceber(contaId, {
      formaRecebimento: dados.formaRecebimento,
      contaBancariaId: dados.contaBancariaId,
      dataEfetivacao: dados.dataEfetivacao,
      observacoes: dados.observacoes,
      comprovante,
    });

    return {
      sucesso: true,
      contaReceber: contaRecebida,
      detalhes: {
        valorRecebido: contaRecebida.valor,
        dataEfetivacao: contaRecebida.dataEfetivacao,
        formaRecebimento: contaRecebida.formaRecebimento,
        contaBancariaId: contaRecebida.contaBancariaId,
      },
    };
  } catch (error) {
    console.error('Erro ao receber conta:', error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido ao processar recebimento',
    };
  }
};

/**
 * Efetua recebimento em lote de múltiplas contas
 */
export const receberContasEmLote = async (
  contaIds: number[],
  dados: Omit<ReceberContaReceberDTO, 'comprovante'>,
  usuarioId?: number
): Promise<{
  sucesso: boolean;
  resultados: Array<{ contaId: number; sucesso: boolean; erro?: string }>;
  totalRecebido: number;
  totalErros: number;
}> => {
  const resultados: Array<{ contaId: number; sucesso: boolean; erro?: string }> = [];
  let totalRecebido = 0;
  let totalErros = 0;

  for (const contaId of contaIds) {
    const resultado = await receberContaReceber(contaId, dados, usuarioId);

    if (resultado.sucesso && resultado.contaReceber) {
      resultados.push({ contaId, sucesso: true });
      totalRecebido += resultado.contaReceber.valor;
    } else {
      resultados.push({ contaId, sucesso: false, erro: resultado.erro });
      totalErros++;
    }
  }

  return {
    sucesso: totalErros === 0,
    resultados,
    totalRecebido,
    totalErros,
  };
};

/**
 * Verifica se uma conta pode ser recebida
 */
export const podeSerRecebida = async (contaId: number): Promise<{
  pode: boolean;
  motivo?: string;
}> => {
  const conta = await buscarContaReceberPorId(contaId);

  if (!conta) {
    return { pode: false, motivo: 'Conta não encontrada' };
  }

  if (conta.status !== 'pendente') {
    const motivos: Record<string, string> = {
      confirmado: 'Conta já foi recebida',
      cancelado: 'Conta foi cancelada',
      estornado: 'Conta foi estornada',
    };
    return { pode: false, motivo: motivos[conta.status] || 'Status inválido' };
  }

  return { pode: true };
};
