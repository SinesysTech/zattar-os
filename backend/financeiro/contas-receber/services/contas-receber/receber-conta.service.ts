/**
 * Serviço de Recebimento de Contas a Receber
 * Gerencia a lógica de negócio para efetivação de recebimentos
 * Suporta pagamentos totais e parciais com histórico completo
 */

import {
  buscarContaReceberPorId,
  confirmarRecebimentoContaReceber,
  registrarRecebimentoParcialContaReceber,
} from '../persistence/contas-receber-persistence.service';
import type {
  ContaReceber,
  ReceberContaReceberDTO,
  OperacaoContaReceberResult,
  AnexoContaReceber,
  RecebimentoRegistro,
  HistoricoRecebimentos,
} from '@/backend/types/financeiro/contas-receber.types';
import {
  getHistoricoRecebimentos,
  gerarIdRecebimento,
} from '@/backend/types/financeiro/contas-receber.types';
import {
  isValidComprovanteMimeType,
  isValidComprovanteSize,
  COMPROVANTE_INVALID_TYPE_MESSAGE,
  COMPROVANTE_SIZE_EXCEEDED_MESSAGE,
} from '@/lib/constants/comprovante-validation';
import { invalidateDRECacheOnLancamento } from '@/backend/financeiro/dre/services/persistence/dre-persistence.service';

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
 * Calcula o valor pendente de uma conta considerando o histórico de recebimentos
 */
const calcularValorPendenteConta = (conta: ContaReceber): number => {
  const historico = getHistoricoRecebimentos(conta);
  if (historico) {
    return historico.valorPendente;
  }
  return conta.valor;
};

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

  // Validar valor recebido (se for pagamento parcial)
  if (dados.valorRecebido !== undefined) {
    if (dados.valorRecebido <= 0) {
      erros.push('Valor recebido deve ser maior que zero');
    } else {
      const valorPendente = calcularValorPendenteConta(conta);
      if (dados.valorRecebido > valorPendente) {
        erros.push(`Valor recebido (R$ ${dados.valorRecebido.toFixed(2)}) excede o valor pendente (R$ ${valorPendente.toFixed(2)})`);
      }
    }
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
    if (!isValidComprovanteMimeType(dados.comprovante.tipo)) {
      erros.push(COMPROVANTE_INVALID_TYPE_MESSAGE);
    }

    if (!isValidComprovanteSize(dados.comprovante.tamanho)) {
      erros.push(COMPROVANTE_SIZE_EXCEEDED_MESSAGE);
    }
  }

  return { valido: erros.length === 0, erros };
};

// ============================================================================
// Serviço Principal
// ============================================================================

/**
 * Efetua o recebimento de uma conta a receber
 * Suporta pagamento total ou parcial com histórico completo
 *
 * Fluxo:
 * 1. Busca a conta e valida se pode ser recebida
 * 2. Valida forma de recebimento e conta bancária
 * 3. Se pagamento parcial, registra no histórico e mantém status 'pendente'
 * 4. Se pagamento total, confirma e atualiza status para 'confirmado'
 * 5. Adiciona comprovante aos anexos se fornecido
 * 6. Retorna conta atualizada
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

    // Calcular valor pendente atual
    const valorPendente = calcularValorPendenteConta(contaAtual);

    // Determinar valor a receber (total ou parcial)
    const valorRecebido = dados.valorRecebido !== undefined ? dados.valorRecebido : valorPendente;
    const isPagamentoParcial = valorRecebido < valorPendente;

    // Preparar comprovante com metadados adicionais
    let comprovante: AnexoContaReceber | undefined;
    if (dados.comprovante) {
      comprovante = {
        ...dados.comprovante,
        uploadedAt: new Date().toISOString(),
        uploadedBy: usuarioId,
      };
    }

    // Criar registro de recebimento para o histórico
    const registroRecebimento: RecebimentoRegistro = {
      id: gerarIdRecebimento(),
      valor: valorRecebido,
      dataRecebimento: dados.dataEfetivacao || new Date().toISOString().split('T')[0],
      formaRecebimento: dados.formaRecebimento,
      contaBancariaId: dados.contaBancariaId,
      observacoes: dados.observacoes,
      comprovante,
      registradoPor: usuarioId,
      registradoEm: new Date().toISOString(),
    };

    let contaRecebida: ContaReceber;

    if (isPagamentoParcial) {
      // Pagamento parcial - registra no histórico mas mantém conta pendente
      contaRecebida = await registrarRecebimentoParcialContaReceber(contaId, registroRecebimento);
    } else {
      // Pagamento total - confirma a conta
      contaRecebida = await confirmarRecebimentoContaReceber(contaId, {
        formaRecebimento: dados.formaRecebimento,
        contaBancariaId: dados.contaBancariaId,
        dataEfetivacao: dados.dataEfetivacao,
        observacoes: dados.observacoes,
        comprovante,
        registroRecebimento,
      });
    }

    // Invalidar cache do DRE para o período afetado
    if (contaRecebida.dataCompetencia) {
      await invalidateDRECacheOnLancamento(contaRecebida.dataCompetencia);
    }

    // Obter histórico atualizado para retornar nos detalhes
    const historicoAtualizado = getHistoricoRecebimentos(contaRecebida);

    return {
      sucesso: true,
      contaReceber: contaRecebida,
      detalhes: {
        valorRecebido,
        valorPendenteAnterior: valorPendente,
        valorPendenteAtual: historicoAtualizado?.valorPendente ?? 0,
        isPagamentoParcial,
        dataEfetivacao: contaRecebida.dataEfetivacao || registroRecebimento.dataRecebimento,
        formaRecebimento: dados.formaRecebimento,
        contaBancariaId: dados.contaBancariaId,
        totalRecebimentos: historicoAtualizado?.recebimentos.length ?? 1,
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
