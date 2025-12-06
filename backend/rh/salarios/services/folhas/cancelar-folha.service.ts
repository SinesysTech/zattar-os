/**
 * Serviço de cancelamento de folha de pagamento
 * Cancela a folha e os lançamentos financeiros associados
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  buscarFolhaPorId,
  atualizarStatusFolha,
  invalidateFolhasCache,
} from '../persistence/folhas-pagamento-persistence.service';
import { invalidateContasPagarCache } from '@/backend/financeiro/contas-pagar/services/persistence/contas-pagar-persistence.service';
import type { FolhaPagamentoComDetalhes } from '@/backend/types/financeiro/salarios.types';

/**
 * Cancela uma folha de pagamento
 * - Folhas em rascunho: apenas muda o status
 * - Folhas aprovadas: cancela os lançamentos financeiros também
 * - Folhas pagas: NÃO podem ser canceladas
 *
 * @param folhaId ID da folha a ser cancelada
 * @param motivo Motivo do cancelamento (opcional)
 * @param usuarioId ID do usuário que está cancelando
 * @returns Folha de pagamento atualizada
 */
export const cancelarFolhaPagamento = async (
  folhaId: number,
  motivo?: string,
  usuarioId?: number
): Promise<FolhaPagamentoComDetalhes> => {
  const supabase = createServiceClient();

  // 1. Buscar folha com itens
  const folha = await buscarFolhaPorId(folhaId);

  if (!folha) {
    throw new Error('Folha de pagamento não encontrada');
  }

  // 2. Verificar status - folhas pagas não podem ser canceladas
  if (folha.status === 'paga') {
    throw new Error(
      'Não é possível cancelar uma folha já paga. ' +
      'Para desfazer pagamentos, utilize o estorno individual dos lançamentos financeiros.'
    );
  }

  if (folha.status === 'cancelada') {
    throw new Error('Esta folha já está cancelada');
  }

  // 3. Se a folha está aprovada, cancelar os lançamentos financeiros
  if (folha.status === 'aprovada') {
    const erros: Array<{ itemId: number; usuario: string; erro: string }> = [];

    for (const item of folha.itens) {
      if (!item.lancamentoFinanceiroId) {
        continue; // Item sem lançamento, pular
      }

      try {
        // Buscar lançamento atual
        const { data: lancamento, error: erroConsulta } = await supabase
          .from('lancamentos_financeiros')
          .select('status, observacoes')
          .eq('id', item.lancamentoFinanceiroId)
          .single();

        if (erroConsulta || !lancamento) {
          throw new Error('Lançamento não encontrado');
        }

        // Verificar se já está confirmado
        if (lancamento.status === 'confirmado') {
          throw new Error('Lançamento já foi pago e não pode ser cancelado por aqui');
        }

        // Mesclar observações com motivo de cancelamento
        let observacoes = lancamento.observacoes || '';
        const textoMotivo = motivo
          ? `[Cancelamento - Folha ${folhaId}] ${motivo}`
          : `[Cancelamento - Folha ${folhaId}]`;

        observacoes = observacoes ? `${observacoes}\n\n${textoMotivo}` : textoMotivo;

        // Atualizar lançamento para cancelado
        const { error: erroUpdate } = await supabase
          .from('lancamentos_financeiros')
          .update({
            status: 'cancelado',
            observacoes,
          })
          .eq('id', item.lancamentoFinanceiroId);

        if (erroUpdate) {
          throw new Error(erroUpdate.message);
        }

      } catch (error) {
        erros.push({
          itemId: item.id,
          usuario: item.usuario?.nomeExibicao || `Funcionário ${item.usuarioId}`,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    // Log de avisos se houve erros (mas continua com o cancelamento)
    if (erros.length > 0) {
      console.warn(
        `Cancelamento da folha ${folhaId} com ${erros.length} erros ao cancelar lançamentos:`,
        erros
      );
    }
  }

  // 4. Atualizar status da folha para 'cancelada'
  const observacoesCancelamento = motivo
    ? `[Cancelamento em ${new Date().toLocaleDateString('pt-BR')}] ${motivo}`
    : `[Cancelamento em ${new Date().toLocaleDateString('pt-BR')}]`;

  await atualizarStatusFolha(folhaId, 'cancelada', {
    observacoes: observacoesCancelamento,
  });

  // 5. Invalidar caches
  await invalidateFolhasCache();
  await invalidateContasPagarCache();

  // 6. Buscar folha atualizada
  const folhaAtualizada = await buscarFolhaPorId(folhaId);

  if (!folhaAtualizada) {
    throw new Error('Folha cancelada mas não encontrada');
  }

  return folhaAtualizada;
};

/**
 * Verifica se uma folha pode ser cancelada
 * @param folhaId ID da folha
 * @returns Objeto indicando se pode cancelar e motivo
 */
export const podeCancelarFolha = async (
  folhaId: number
): Promise<{
  podeCancelar: boolean;
  motivo?: string;
  status: string;
  temLancamentosPagos: boolean;
}> => {
  const supabase = createServiceClient();

  const folha = await buscarFolhaPorId(folhaId);

  if (!folha) {
    return {
      podeCancelar: false,
      motivo: 'Folha não encontrada',
      status: 'desconhecido',
      temLancamentosPagos: false,
    };
  }

  // Verificar se tem lançamentos já confirmados
  let temLancamentosPagos = false;
  if (folha.status === 'aprovada') {
    for (const item of folha.itens) {
      if (item.lancamentoFinanceiroId) {
        const { data: lancamento } = await supabase
          .from('lancamentos_financeiros')
          .select('status')
          .eq('id', item.lancamentoFinanceiroId)
          .single();

        if (lancamento?.status === 'confirmado') {
          temLancamentosPagos = true;
          break;
        }
      }
    }
  }

  if (folha.status === 'paga') {
    return {
      podeCancelar: false,
      motivo: 'Folhas pagas não podem ser canceladas. Utilize estorno individual dos lançamentos.',
      status: folha.status,
      temLancamentosPagos: true,
    };
  }

  if (folha.status === 'cancelada') {
    return {
      podeCancelar: false,
      motivo: 'Esta folha já está cancelada',
      status: folha.status,
      temLancamentosPagos: false,
    };
  }

  if (temLancamentosPagos) {
    return {
      podeCancelar: false,
      motivo: 'Existem lançamentos já pagos vinculados a esta folha. Estorne os lançamentos primeiro.',
      status: folha.status,
      temLancamentosPagos: true,
    };
  }

  return {
    podeCancelar: true,
    status: folha.status,
    temLancamentosPagos: false,
  };
};
