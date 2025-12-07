/**
 * Serviço de Execução de Orçamentos
 * Gerencia a lógica de negócio para iniciar e encerrar a execução de orçamentos
 */

import {
  iniciarExecucao as iniciarExecucaoPersistence,
  encerrarOrcamento as encerrarOrcamentoPersistence,
  buscarOrcamentoPorId,
  buscarOrcamentoComDetalhes,
} from '../persistence/orcamento-persistence.service';
import {
  buscarResumoOrcamentario,
} from '../persistence/analise-orcamentaria-persistence.service';
import type {
  IniciarExecucaoDTO,
  EncerrarOrcamentoDTO,
  OperacaoOrcamentoResult,
} from '@/backend/types/financeiro/orcamento.types';

/**
 * Inicia a execução de um orçamento
 * - Valida se o orçamento está aprovado
 * - Valida se a data de início não passou muito
 * - Registra o início da execução
 */
export async function iniciarExecucao(
  orcamentoId: number,
  usuarioId: number,
  dados?: IniciarExecucaoDTO
): Promise<OperacaoOrcamentoResult> {
  console.log('▶️ Iniciando execução de orçamento...', {
    orcamentoId,
    usuarioId,
    dataInicio: dados?.dataInicio,
  });

  try {
    // Verificar se orçamento existe
    const orcamento = await buscarOrcamentoPorId(orcamentoId);
    if (!orcamento) {
      return {
        sucesso: false,
        erro: 'Orçamento não encontrado',
      };
    }

    // Verificar status atual
    if (orcamento.status !== 'aprovado') {
      return {
        sucesso: false,
        erro: `Apenas orçamentos aprovados podem iniciar execução. Status atual: ${orcamento.status}`,
      };
    }

    // Iniciar execução
    const orcamentoEmExecucao = await iniciarExecucaoPersistence(
      orcamentoId,
      usuarioId
    );

    console.log('✅ Execução iniciada com sucesso:', {
      id: orcamentoEmExecucao.id,
      nome: orcamentoEmExecucao.nome,
      dataInicio: orcamentoEmExecucao.dataInicio,
    });

    return {
      sucesso: true,
      orcamento: orcamentoEmExecucao,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao iniciar execução:', error);
    return {
      sucesso: false,
      erro: erroMsg,
    };
  }
}

/**
 * Encerra a execução de um orçamento
 * - Valida se o orçamento está em execução
 * - Registra o encerramento com resumo
 */
export async function encerrarExecucao(
  orcamentoId: number,
  usuarioId: number,
  dados?: EncerrarOrcamentoDTO
): Promise<OperacaoOrcamentoResult> {
  console.log('⏹️ Encerrando execução de orçamento...', {
    orcamentoId,
    usuarioId,
    observacoes: dados?.observacoes,
  });

  try {
    // Verificar se orçamento existe
    const orcamento = await buscarOrcamentoPorId(orcamentoId);
    if (!orcamento) {
      return {
        sucesso: false,
        erro: 'Orçamento não encontrado',
      };
    }

    // Verificar status atual
    if (orcamento.status !== 'em_execucao') {
      return {
        sucesso: false,
        erro: `Apenas orçamentos em execução podem ser encerrados. Status atual: ${orcamento.status}`,
      };
    }

    // Buscar resumo antes de encerrar
    const resumo = await buscarResumoOrcamentario(orcamentoId);

    // Encerrar orçamento
    const orcamentoEncerrado = await encerrarOrcamentoPersistence(
      orcamentoId,
      usuarioId,
      dados?.observacoes
    );

    console.log('✅ Orçamento encerrado com sucesso:', {
      id: orcamentoEncerrado.id,
      nome: orcamentoEncerrado.nome,
      resumo: resumo ? {
        totalOrcado: resumo.totalOrcado,
        totalRealizado: resumo.totalRealizado,
        percentualRealizacao: resumo.percentualRealizacao,
      } : null,
    });

    return {
      sucesso: true,
      orcamento: orcamentoEncerrado,
      detalhes: resumo ? {
        totalOrcado: resumo.totalOrcado,
        totalRealizado: resumo.totalRealizado,
        variacao: resumo.variacao,
        percentualRealizacao: resumo.percentualRealizacao,
      } : undefined,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao encerrar orçamento:', error);
    return {
      sucesso: false,
      erro: erroMsg,
    };
  }
}

/**
 * Verifica se um orçamento pode iniciar execução
 */
export async function verificarPodeIniciarExecucao(
  orcamentoId: number
): Promise<{ podeIniciar: boolean; motivos: string[] }> {
  const motivos: string[] = [];

  try {
    const orcamento = await buscarOrcamentoComDetalhes(orcamentoId);

    if (!orcamento) {
      return { podeIniciar: false, motivos: ['Orçamento não encontrado'] };
    }

    // Verificar status
    if (orcamento.status !== 'aprovado') {
      motivos.push(`Status atual (${orcamento.status}) não permite início de execução`);
    }

    // Verificar se possui itens
    if (!orcamento.itens || orcamento.itens.length === 0) {
      motivos.push('Orçamento não possui itens');
    }

    return {
      podeIniciar: motivos.length === 0,
      motivos,
    };
  } catch (error) {
    return {
      podeIniciar: false,
      motivos: ['Erro ao verificar orçamento'],
    };
  }
}

/**
 * Verifica se um orçamento pode ser encerrado
 */
export async function verificarPodeEncerrar(
  orcamentoId: number
): Promise<{ podeEncerrar: boolean; motivos: string[]; alertas: string[] }> {
  const motivos: string[] = [];
  const alertas: string[] = [];

  try {
    const orcamento = await buscarOrcamentoComDetalhes(orcamentoId);

    if (!orcamento) {
      return { podeEncerrar: false, motivos: ['Orçamento não encontrado'], alertas: [] };
    }

    // Verificar status
    if (orcamento.status !== 'em_execucao') {
      motivos.push(`Status atual (${orcamento.status}) não permite encerramento`);
    }

    // Buscar resumo para alertas
    const resumo = await buscarResumoOrcamentario(orcamentoId);
    if (resumo) {
      if (resumo.percentualRealizacao < 50) {
        alertas.push(`Baixa realização: apenas ${resumo.percentualRealizacao.toFixed(1)}% do orçamento foi executado`);
      }
      if (resumo.variacaoPercentual > 20) {
        alertas.push(`Desvio significativo: ${resumo.variacaoPercentual.toFixed(1)}% acima do orçado`);
      }
    }

    return {
      podeEncerrar: motivos.length === 0,
      motivos,
      alertas,
    };
  } catch (error) {
    return {
      podeEncerrar: false,
      motivos: ['Erro ao verificar orçamento'],
      alertas: [],
    };
  }
}

/**
 * Obtém o status de execução de um orçamento
 */
export async function obterStatusExecucao(orcamentoId: number): Promise<{
  status: string;
  diasEmExecucao: number;
  diasRestantes: number;
  percentualPeriodo: number;
  percentualRealizacao: number;
} | null> {
  try {
    const orcamento = await buscarOrcamentoPorId(orcamentoId);
    if (!orcamento || orcamento.status !== 'em_execucao') {
      return null;
    }

    const hoje = new Date();
    const dataInicio = new Date(orcamento.dataInicio);
    const dataFim = new Date(orcamento.dataFim);

    const diasTotais = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
    const diasDecorridos = Math.ceil((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
    const diasRestantes = Math.max(0, diasTotais - diasDecorridos);
    const percentualPeriodo = Math.min(100, (diasDecorridos / diasTotais) * 100);

    const resumo = await buscarResumoOrcamentario(orcamentoId);
    const percentualRealizacao = resumo?.percentualRealizacao || 0;

    return {
      status: orcamento.status,
      diasEmExecucao: diasDecorridos,
      diasRestantes,
      percentualPeriodo,
      percentualRealizacao,
    };
  } catch (error) {
    console.error('Erro ao obter status de execução:', error);
    return null;
  }
}
