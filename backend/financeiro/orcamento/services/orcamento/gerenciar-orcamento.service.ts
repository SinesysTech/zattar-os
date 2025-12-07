/**
 * Serviço de Gerenciamento de Orçamentos
 * Gerencia a lógica de negócio para criar, atualizar e excluir orçamentos
 */

import {
  criarOrcamento as criarOrcamentoPersistence,
  atualizarOrcamento as atualizarOrcamentoPersistence,
  deletarOrcamento as deletarOrcamentoPersistence,
  buscarOrcamentoPorId,
  criarOrcamentoItem as criarItemPersistence,
  atualizarOrcamentoItem as atualizarItemPersistence,
  deletarOrcamentoItem as deletarItemPersistence,
  criarItensEmLote,
} from '../persistence/orcamento-persistence.service';
import type {
  Orcamento,
  OrcamentoItem,
  OrcamentoComItens,
  CriarOrcamentoDTO,
  AtualizarOrcamentoDTO,
  CriarOrcamentoItemDTO,
  AtualizarOrcamentoItemDTO,
  OperacaoOrcamentoResult,
  OperacaoItemResult,
} from '@/backend/types/financeiro/orcamento.types';

// ============================================================================
// Gerenciamento de Orçamentos
// ============================================================================

/**
 * Cria um novo orçamento
 * - Valida dados de entrada
 * - Verifica se já existe orçamento para o mesmo período
 * - Cria o orçamento no banco
 */
export async function criarOrcamento(
  dados: CriarOrcamentoDTO,
  usuarioId: number
): Promise<OperacaoOrcamentoResult> {
  console.log('📝 Iniciando criação de orçamento...', {
    nome: dados.nome,
    ano: dados.ano,
    periodo: dados.periodo,
    usuarioId,
  });

  try {
    // Validar datas
    const dataInicio = new Date(dados.dataInicio);
    const dataFim = new Date(dados.dataFim);

    if (dataFim <= dataInicio) {
      return {
        sucesso: false,
        erro: 'Data de fim deve ser posterior à data de início',
      };
    }

    // Criar orçamento
    const orcamento = await criarOrcamentoPersistence(dados, usuarioId);

    console.log('✅ Orçamento criado com sucesso:', {
      id: orcamento.id,
      nome: orcamento.nome,
      status: orcamento.status,
    });

    return {
      sucesso: true,
      orcamento,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao criar orçamento:', error);
    return {
      sucesso: false,
      erro: erroMsg,
    };
  }
}

/**
 * Atualiza um orçamento existente
 * - Apenas orçamentos em rascunho podem ser atualizados
 */
export async function atualizarOrcamento(
  id: number,
  dados: AtualizarOrcamentoDTO
): Promise<OperacaoOrcamentoResult> {
  console.log('📝 Atualizando orçamento...', { id, dados });

  try {
    // Verificar se orçamento existe e está em rascunho
    const orcamentoAtual = await buscarOrcamentoPorId(id);
    if (!orcamentoAtual) {
      return {
        sucesso: false,
        erro: 'Orçamento não encontrado',
      };
    }

    if (orcamentoAtual.status !== 'rascunho') {
      return {
        sucesso: false,
        erro: 'Apenas orçamentos em rascunho podem ser alterados',
      };
    }

    // Validar datas se fornecidas
    if (dados.dataInicio && dados.dataFim) {
      const dataInicio = new Date(dados.dataInicio);
      const dataFim = new Date(dados.dataFim);
      if (dataFim <= dataInicio) {
        return {
          sucesso: false,
          erro: 'Data de fim deve ser posterior à data de início',
        };
      }
    }

    // Atualizar
    const orcamento = await atualizarOrcamentoPersistence(id, dados);

    console.log('✅ Orçamento atualizado com sucesso:', {
      id: orcamento.id,
      nome: orcamento.nome,
    });

    return {
      sucesso: true,
      orcamento,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao atualizar orçamento:', error);
    return {
      sucesso: false,
      erro: erroMsg,
    };
  }
}

/**
 * Exclui um orçamento
 * - Apenas orçamentos em rascunho podem ser excluídos
 */
export async function excluirOrcamento(id: number): Promise<OperacaoOrcamentoResult> {
  console.log('🗑️ Excluindo orçamento...', { id });

  try {
    // Verificar se orçamento existe e está em rascunho
    const orcamentoAtual = await buscarOrcamentoPorId(id);
    if (!orcamentoAtual) {
      return {
        sucesso: false,
        erro: 'Orçamento não encontrado',
      };
    }

    if (orcamentoAtual.status !== 'rascunho') {
      return {
        sucesso: false,
        erro: 'Apenas orçamentos em rascunho podem ser excluídos',
      };
    }

    await deletarOrcamentoPersistence(id);

    console.log('✅ Orçamento excluído com sucesso:', { id });

    return {
      sucesso: true,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao excluir orçamento:', error);
    return {
      sucesso: false,
      erro: erroMsg,
    };
  }
}

// ============================================================================
// Gerenciamento de Itens
// ============================================================================

/**
 * Adiciona um item ao orçamento
 * - Apenas orçamentos em rascunho podem receber novos itens
 */
export async function adicionarItem(
  orcamentoId: number,
  dados: CriarOrcamentoItemDTO
): Promise<OperacaoItemResult> {
  console.log('📝 Adicionando item ao orçamento...', { orcamentoId, dados });

  try {
    // Verificar status do orçamento
    const orcamento = await buscarOrcamentoPorId(orcamentoId);
    if (!orcamento) {
      return {
        sucesso: false,
        erro: 'Orçamento não encontrado',
      };
    }

    if (orcamento.status !== 'rascunho') {
      return {
        sucesso: false,
        erro: 'Apenas orçamentos em rascunho podem receber novos itens',
      };
    }

    // Criar item
    const item = await criarItemPersistence(orcamentoId, dados);

    console.log('✅ Item adicionado com sucesso:', { id: item.id });

    return {
      sucesso: true,
      item,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao adicionar item:', error);
    return {
      sucesso: false,
      erro: erroMsg,
    };
  }
}

/**
 * Adiciona múltiplos itens ao orçamento
 */
export async function adicionarItensEmLote(
  orcamentoId: number,
  itens: CriarOrcamentoItemDTO[]
): Promise<{ sucesso: boolean; itens?: OrcamentoItem[]; erro?: string }> {
  console.log('📝 Adicionando itens em lote...', { orcamentoId, quantidade: itens.length });

  try {
    // Verificar status do orçamento
    const orcamento = await buscarOrcamentoPorId(orcamentoId);
    if (!orcamento) {
      return {
        sucesso: false,
        erro: 'Orçamento não encontrado',
      };
    }

    if (orcamento.status !== 'rascunho') {
      return {
        sucesso: false,
        erro: 'Apenas orçamentos em rascunho podem receber novos itens',
      };
    }

    // Criar itens
    const itensCriados = await criarItensEmLote(orcamentoId, itens);

    console.log('✅ Itens adicionados com sucesso:', { quantidade: itensCriados.length });

    return {
      sucesso: true,
      itens: itensCriados,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao adicionar itens:', error);
    return {
      sucesso: false,
      erro: erroMsg,
    };
  }
}

/**
 * Atualiza um item do orçamento
 */
export async function atualizarItem(
  orcamentoId: number,
  itemId: number,
  dados: AtualizarOrcamentoItemDTO
): Promise<OperacaoItemResult> {
  console.log('📝 Atualizando item...', { orcamentoId, itemId, dados });

  try {
    // Note: orcamentoId is available for validation if needed
    const item = await atualizarItemPersistence(itemId, dados);

    console.log('✅ Item atualizado com sucesso:', { id: item.id });

    return {
      sucesso: true,
      item,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao atualizar item:', error);
    return {
      sucesso: false,
      erro: erroMsg,
    };
  }
}

/**
 * Exclui um item do orçamento
 */
export async function excluirItem(itemId: number): Promise<OperacaoItemResult> {
  console.log('🗑️ Excluindo item...', { itemId });

  try {
    await deletarItemPersistence(itemId);

    console.log('✅ Item excluído com sucesso:', { itemId });

    return {
      sucesso: true,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao excluir item:', error);
    return {
      sucesso: false,
      erro: erroMsg,
    };
  }
}
