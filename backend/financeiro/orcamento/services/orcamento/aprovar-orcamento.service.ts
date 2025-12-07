/**
 * Serviço de Aprovação de Orçamentos
 * Gerencia a lógica de negócio para aprovar orçamentos
 */

import {
  aprovarOrcamento as aprovarOrcamentoPersistence,
  buscarOrcamentoPorId,
  buscarOrcamentoComDetalhes,
} from '../persistence/orcamento-persistence.service';
import type {
  AprovarOrcamentoDTO,
  OperacaoOrcamentoResult,
} from '@/backend/types/financeiro/orcamento.types';

/**
 * Aprova um orçamento
 * - Valida se o orçamento está em rascunho
 * - Valida se o orçamento possui itens
 * - Valida se o valor total é maior que zero
 * - Registra a aprovação com o usuário e data
 */
export async function aprovarOrcamento(
  orcamentoId: number,
  usuarioId: number,
  dados?: AprovarOrcamentoDTO
): Promise<OperacaoOrcamentoResult> {
  console.log('✅ Iniciando aprovação de orçamento...', {
    orcamentoId,
    usuarioId,
  });

  try {
    // Verificar se orçamento existe
    const orcamento = await buscarOrcamentoComDetalhes(orcamentoId);
    if (!orcamento) {
      return {
        sucesso: false,
        erro: 'Orçamento não encontrado',
      };
    }

    // Verificar status atual
    if (orcamento.status !== 'rascunho') {
      return {
        sucesso: false,
        erro: `Orçamento não pode ser aprovado. Status atual: ${orcamento.status}`,
      };
    }

    // Verificar se possui itens
    if (!orcamento.itens || orcamento.itens.length === 0) {
      return {
        sucesso: false,
        erro: 'Orçamento deve possuir pelo menos um item para ser aprovado',
      };
    }

    // Verificar se valor total é maior que zero
    const valorTotal = orcamento.itens.reduce((sum, item) => sum + item.valorOrcado, 0);
    if (valorTotal <= 0) {
      return {
        sucesso: false,
        erro: 'Valor total do orçamento deve ser maior que zero',
      };
    }

    // Aprovar orçamento
    const orcamentoAprovado = await aprovarOrcamentoPersistence(
      orcamentoId,
      usuarioId,
      dados?.observacoes
    );

    console.log('✅ Orçamento aprovado com sucesso:', {
      id: orcamentoAprovado.id,
      nome: orcamentoAprovado.nome,
      valorTotal,
      quantidadeItens: orcamento.itens.length,
    });

    return {
      sucesso: true,
      orcamento: orcamentoAprovado,
      detalhes: {
        valorTotal,
        quantidadeItens: orcamento.itens.length,
      },
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao aprovar orçamento:', error);
    return {
      sucesso: false,
      erro: erroMsg,
    };
  }
}

/**
 * Verifica se um orçamento pode ser aprovado
 * Retorna os motivos caso não possa
 */
export async function verificarPodeAprovar(
  orcamentoId: number
): Promise<{ podeAprovar: boolean; motivos: string[] }> {
  const motivos: string[] = [];

  try {
    const orcamento = await buscarOrcamentoComDetalhes(orcamentoId);

    if (!orcamento) {
      return { podeAprovar: false, motivos: ['Orçamento não encontrado'] };
    }

    // Verificar status
    if (orcamento.status !== 'rascunho') {
      motivos.push(`Status atual (${orcamento.status}) não permite aprovação`);
    }

    // Verificar itens
    if (!orcamento.itens || orcamento.itens.length === 0) {
      motivos.push('Orçamento deve possuir pelo menos um item');
    }

    // Verificar valor total
    const valorTotal = orcamento.itens?.reduce((sum, item) => sum + item.valorOrcado, 0) || 0;
    if (valorTotal <= 0) {
      motivos.push('Valor total deve ser maior que zero');
    }

    // Verificar datas
    const hoje = new Date();
    const dataInicio = new Date(orcamento.dataInicio);
    if (dataInicio < hoje) {
      motivos.push('Data de início já passou');
    }

    return {
      podeAprovar: motivos.length === 0,
      motivos,
    };
  } catch (error) {
    return {
      podeAprovar: false,
      motivos: ['Erro ao verificar orçamento'],
    };
  }
}

/**
 * Rejeita um orçamento (volta para rascunho)
 * Permite rejeitar orçamentos aprovados que ainda não iniciaram execução
 */
export async function rejeitarOrcamento(
  orcamentoId: number,
  usuarioId: number,
  motivo: string
): Promise<OperacaoOrcamentoResult> {
  console.log('↩️ Rejeitando orçamento...', {
    orcamentoId,
    usuarioId,
    motivo,
  });

  try {
    const orcamento = await buscarOrcamentoPorId(orcamentoId);

    if (!orcamento) {
      return {
        sucesso: false,
        erro: 'Orçamento não encontrado',
      };
    }

    if (orcamento.status !== 'aprovado') {
      return {
        sucesso: false,
        erro: 'Apenas orçamentos aprovados podem ser rejeitados',
      };
    }

    // Voltar para rascunho adicionando observação
    const observacaoRejeicao = `[REJEITADO] ${new Date().toISOString()} - ${motivo}`;
    const novaObservacao = orcamento.observacoes
      ? `${orcamento.observacoes}\n${observacaoRejeicao}`
      : observacaoRejeicao;

    // Usar a persistence para voltar ao status rascunho
    // Como não temos função específica, vamos importar e usar update direto
    const { createServiceClient } = await import('@/backend/utils/supabase/service-client');
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('orcamentos')
      .update({
        status: 'rascunho',
        aprovado_por: null,
        aprovado_em: null,
        observacoes: novaObservacao,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orcamentoId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ Orçamento rejeitado com sucesso:', {
      id: orcamentoId,
      motivo,
    });

    return {
      sucesso: true,
      orcamento: data,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao rejeitar orçamento:', error);
    return {
      sucesso: false,
      erro: erroMsg,
    };
  }
}
