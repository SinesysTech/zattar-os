/**
 * Serviço de pagamento de folha de pagamento
 * Marca a folha como paga e confirma os lançamentos financeiros
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  buscarFolhaPorId,
  atualizarStatusFolha,
  invalidateFolhasCache,
} from '../persistence/folhas-pagamento-persistence.service';
import { invalidateContasPagarCache } from '@/backend/financeiro/contas-pagar/services/persistence/contas-pagar-persistence.service';
import type {
  PagarFolhaDTO,
  FolhaPagamentoComDetalhes,
} from '@/backend/types/financeiro/salarios.types';

/**
 * Paga uma folha de pagamento (marca lançamentos como confirmados)
 * @param folhaId ID da folha a ser paga
 * @param dados Dados de pagamento (forma de pagamento, conta bancária, data de efetivação)
 * @param usuarioId ID do usuário que está pagando
 * @returns Folha de pagamento atualizada
 */
export const pagarFolhaPagamento = async (
  folhaId: number,
  dados: PagarFolhaDTO,
  usuarioId: number
): Promise<FolhaPagamentoComDetalhes> => {
  const supabase = createServiceClient();

  // 1. Buscar folha com itens
  const folha = await buscarFolhaPorId(folhaId);

  if (!folha) {
    throw new Error('Folha de pagamento não encontrada');
  }

  // 2. Verificar status
  if (folha.status !== 'aprovada') {
    throw new Error(`Apenas folhas aprovadas podem ser pagas. Status atual: ${folha.status}`);
  }

  // 3. Verificar se todos os itens têm lançamento vinculado
  const itensSemLancamento = folha.itens.filter(item => !item.lancamentoFinanceiroId);
  if (itensSemLancamento.length > 0) {
    throw new Error(
      `Existem ${itensSemLancamento.length} itens sem lançamento financeiro vinculado. ` +
      'Isso indica um problema na aprovação. Por favor, cancele e reaprove a folha.'
    );
  }

  // 4. Validar conta bancária
  const { data: contaBancaria, error: erroContaBancaria } = await supabase
    .from('contas_bancarias')
    .select('id, nome, ativo')
    .eq('id', dados.contaBancariaId)
    .single();

  if (erroContaBancaria || !contaBancaria) {
    throw new Error('Conta bancária não encontrada');
  }

  if (!contaBancaria.ativo) {
    throw new Error('Conta bancária está inativa');
  }

  // 5. Definir data de efetivação
  const dataEfetivacao = dados.dataEfetivacao || new Date().toISOString();

  // 6. Atualizar lançamentos financeiros para 'confirmado'
  const erros: Array<{ itemId: number; usuario: string; erro: string }> = [];

  for (const item of folha.itens) {
    try {
      // Mesclar observações
      let observacoesLancamento = item.lancamento?.descricao || '';
      if (dados.observacoes) {
        observacoesLancamento = observacoesLancamento
          ? `${observacoesLancamento}\n\n[Pagamento] ${dados.observacoes}`
          : `[Pagamento] ${dados.observacoes}`;
      }

      // Atualizar lançamento
      const { error: erroUpdate } = await supabase
        .from('lancamentos_financeiros')
        .update({
          status: 'confirmado',
          forma_pagamento: dados.formaPagamento,
          conta_bancaria_id: dados.contaBancariaId,
          data_efetivacao: dataEfetivacao,
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

  // 7. Se houve erros em todos os itens, não pagar
  if (erros.length === folha.itens.length) {
    throw new Error(
      `Não foi possível confirmar os lançamentos financeiros. Erros: ${erros.map(e => `${e.usuario}: ${e.erro}`).join('; ')}`
    );
  }

  // 8. Atualizar status da folha para 'paga'
  const observacoesPagamento = dados.observacoes
    ? `[Pagamento em ${new Date().toLocaleDateString('pt-BR')}] ${dados.observacoes}`
    : `[Pagamento em ${new Date().toLocaleDateString('pt-BR')}]`;

  await atualizarStatusFolha(folhaId, 'paga', {
    dataPagamento: dataEfetivacao.split('T')[0],
    observacoes: observacoesPagamento,
  });

  // 9. Invalidar caches
  await invalidateFolhasCache();
  await invalidateContasPagarCache();

  // 10. Log de avisos se houve erros parciais
  if (erros.length > 0) {
    console.warn(
      `Folha ${folhaId} paga com ${erros.length} erros parciais:`,
      erros
    );
  }

  // 11. Buscar folha atualizada
  const folhaAtualizada = await buscarFolhaPorId(folhaId);

  if (!folhaAtualizada) {
    throw new Error('Folha paga mas não encontrada');
  }

  return folhaAtualizada;
};

/**
 * Calcula o valor total a pagar da folha
 * Útil para exibir resumo antes de confirmar pagamento
 */
export const calcularTotalAPagar = async (folhaId: number): Promise<{
  totalBruto: number;
  totalItens: number;
  itensPendentes: number;
  itensConfirmados: number;
}> => {
  const folha = await buscarFolhaPorId(folhaId);

  if (!folha) {
    throw new Error('Folha de pagamento não encontrada');
  }

  let totalBruto = 0;
  let itensPendentes = 0;
  let itensConfirmados = 0;

  for (const item of folha.itens) {
    totalBruto += item.valorBruto;

    if (item.lancamento?.status === 'confirmado') {
      itensConfirmados++;
    } else {
      itensPendentes++;
    }
  }

  return {
    totalBruto,
    totalItens: folha.itens.length,
    itensPendentes,
    itensConfirmados,
  };
};
