/**
 * Serviço de aprovação de folha de pagamento
 * Aprova a folha e cria lançamentos financeiros para cada item
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  buscarFolhaPorId,
  atualizarStatusFolha,
  vincularLancamentoAoItem,
  invalidateFolhasCache,
} from '../persistence/folhas-pagamento-persistence.service';
import { invalidateContasPagarCache } from '@/backend/financeiro/contas-pagar/services/persistence/contas-pagar-persistence.service';
import type {
  AprovarFolhaDTO,
  FolhaPagamentoComDetalhes,
  MESES_LABELS,
} from '@/backend/types/financeiro/salarios.types';

/**
 * Aprova uma folha de pagamento e cria lançamentos financeiros
 * @param folhaId ID da folha a ser aprovada
 * @param dados Dados de aprovação (conta bancária, conta contábil, centro de custo)
 * @param usuarioId ID do usuário que está aprovando
 * @returns Folha de pagamento atualizada
 */
export const aprovarFolhaPagamento = async (
  folhaId: number,
  dados: AprovarFolhaDTO,
  usuarioId: number
): Promise<FolhaPagamentoComDetalhes> => {
  const supabase = createServiceClient();

  // 1. Buscar folha com itens
  const folha = await buscarFolhaPorId(folhaId);

  if (!folha) {
    throw new Error('Folha de pagamento não encontrada');
  }

  // 2. Verificar status
  if (folha.status !== 'rascunho') {
    throw new Error(`Apenas folhas em rascunho podem ser aprovadas. Status atual: ${folha.status}`);
  }

  // 3. Verificar se tem itens
  if (folha.itens.length === 0) {
    throw new Error('Não é possível aprovar uma folha sem itens');
  }

  // 4. Validar conta contábil (deve existir e ser analítica)
  const { data: contaContabil, error: erroContaContabil } = await supabase
    .from('plano_contas')
    .select('id, codigo, nome, nivel, aceita_lancamento, ativo')
    .eq('id', dados.contaContabilId)
    .single();

  if (erroContaContabil || !contaContabil) {
    throw new Error('Conta contábil não encontrada');
  }

  if (!contaContabil.ativo) {
    throw new Error('Conta contábil está inativa');
  }

  if (!contaContabil.aceita_lancamento) {
    throw new Error(
      `Conta contábil "${contaContabil.codigo} - ${contaContabil.nome}" é sintética e não aceita lançamentos. Selecione uma conta analítica.`
    );
  }

  // 5. Validar conta bancária
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

  // 6. Validar centro de custo se fornecido
  if (dados.centroCustoId) {
    const { data: centroCusto, error: erroCentroCusto } = await supabase
      .from('centros_custo')
      .select('id, nome, ativo')
      .eq('id', dados.centroCustoId)
      .single();

    if (erroCentroCusto || !centroCusto) {
      throw new Error('Centro de custo não encontrado');
    }

    if (!centroCusto.ativo) {
      throw new Error('Centro de custo está inativo');
    }
  }

  // 7. Importar labels de meses
  const { MESES_LABELS, ultimoDiaDoMes } = await import('@/backend/types/financeiro/salarios.types');
  const mesNome = MESES_LABELS[folha.mesReferencia] || String(folha.mesReferencia);

  // 8. Calcular data de vencimento (data_pagamento ou último dia do mês)
  const dataVencimento = folha.dataPagamento || ultimoDiaDoMes(folha.mesReferencia, folha.anoReferencia);
  const dataCompetencia = `${folha.anoReferencia}-${String(folha.mesReferencia).padStart(2, '0')}-01`;
  const hoje = new Date().toISOString().split('T')[0];

  // 9. Criar lançamentos financeiros para cada item
  const erros: Array<{ itemId: number; usuario: string; erro: string }> = [];

  for (const item of folha.itens) {
    try {
      // Criar lançamento financeiro
      const descricao = `Salário ${item.usuario?.nomeExibicao || `Funcionário ${item.usuarioId}`} - ${mesNome}/${folha.anoReferencia}`;

      const { data: lancamento, error: erroLancamento } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          tipo: 'despesa',
          descricao,
          valor: item.valorBruto,
          data_lancamento: hoje,
          data_competencia: dataCompetencia,
          data_vencimento: dataVencimento,
          status: 'pendente',
          origem: 'folha_pagamento',
          forma_pagamento: null, // Será preenchido no pagamento
          conta_bancaria_id: dados.contaBancariaId,
          conta_contabil_id: dados.contaContabilId,
          centro_custo_id: dados.centroCustoId || null,
          categoria: 'salarios',
          documento: null,
          observacoes: `Folha de Pagamento ${mesNome}/${folha.anoReferencia}`,
          anexos: [],
          dados_adicionais: {
            folhaId: folha.id,
            itemFolhaId: item.id,
            mesReferencia: folha.mesReferencia,
            anoReferencia: folha.anoReferencia,
          },
          cliente_id: null,
          contrato_id: null,
          acordo_condenacao_id: null,
          parcela_id: null,
          usuario_id: item.usuarioId,
          recorrente: false,
          frequencia_recorrencia: null,
          created_by: usuarioId,
        })
        .select()
        .single();

      if (erroLancamento) {
        throw new Error(erroLancamento.message);
      }

      // Vincular lançamento ao item
      await vincularLancamentoAoItem(item.id, lancamento.id);

    } catch (error) {
      erros.push({
        itemId: item.id,
        usuario: item.usuario?.nomeExibicao || `Funcionário ${item.usuarioId}`,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  // 10. Se houve erros em todos os itens, não aprovar
  if (erros.length === folha.itens.length) {
    throw new Error(
      `Não foi possível criar lançamentos financeiros. Erros: ${erros.map(e => `${e.usuario}: ${e.erro}`).join('; ')}`
    );
  }

  // 11. Atualizar status da folha para 'aprovada'
  const observacoesAprovacao = dados.observacoes
    ? `[Aprovação em ${new Date().toLocaleDateString('pt-BR')}] ${dados.observacoes}`
    : `[Aprovação em ${new Date().toLocaleDateString('pt-BR')}]`;

  await atualizarStatusFolha(folhaId, 'aprovada', {
    observacoes: observacoesAprovacao,
  });

  // 12. Invalidar caches
  await invalidateFolhasCache();
  await invalidateContasPagarCache();

  // 13. Log de avisos se houve erros parciais
  if (erros.length > 0) {
    console.warn(
      `Folha ${folhaId} aprovada com ${erros.length} erros parciais:`,
      erros
    );
  }

  // 14. Buscar folha atualizada
  const folhaAtualizada = await buscarFolhaPorId(folhaId);

  if (!folhaAtualizada) {
    throw new Error('Folha aprovada mas não encontrada');
  }

  return folhaAtualizada;
};
