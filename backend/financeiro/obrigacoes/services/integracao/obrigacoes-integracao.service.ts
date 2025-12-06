/**
 * Serviço de Integração para Obrigações Financeiras
 * Gerencia a sincronização entre acordos/parcelas e o sistema financeiro
 *
 * Este serviço atua como adapter/ponte entre:
 * - Módulo de Acordos e Condenações (parcelas)
 * - Sistema de Gestão Financeira (lançamentos)
 *
 * A sincronização automática é feita via trigger `criar_lancamento_de_parcela()`
 * Este serviço fornece sincronização manual e verificação de consistência
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  buscarParcelaPorId,
  buscarParcelasPorAcordo,
  buscarLancamentoPorParcela,
  buscarTodosLancamentosPorParcela,
  detectarInconsistenciasAcordo,
  invalidateObrigacoesCache,
} from '../persistence/obrigacoes-persistence.service';
import type {
  SincronizarObrigacoesParams,
  SincronizarObrigacoesResult,
  ItemSincronizacaoResult,
  VerificarConsistenciaResult,
  InconsistenciaObrigacao,
} from '@/backend/types/financeiro/obrigacoes.types';

// ============================================================================
// Tipos Internos
// ============================================================================

interface AcordoRecord {
  id: number;
  tipo: 'acordo' | 'condenacao';
  direcao: 'recebimento' | 'pagamento';
  valor_total: number;
  numero_parcelas: number;
  status: string;
  created_by: string | null;
}

interface ParcelaRecord {
  id: number;
  acordo_condenacao_id: number;
  numero_parcela: number;
  valor_bruto_credito_principal: number;
  honorarios_contratuais: number | null;
  honorarios_sucumbenciais: number | null;
  data_vencimento: string;
  data_efetivacao: string | null;
  status: string;
  forma_pagamento: string | null;
}

// ============================================================================
// Funções Auxiliares
// ============================================================================

/**
 * Busca dados do acordo pelo ID
 */
const buscarAcordoPorId = async (acordoId: number): Promise<AcordoRecord | null> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('acordos_condenacoes')
    .select('id, tipo, direcao, valor_total, numero_parcelas, status, created_by')
    .eq('id', acordoId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar acordo: ${error.message}`);
  }

  return data as AcordoRecord;
};

/**
 * Mapeia forma de pagamento da parcela para forma financeira
 */
const mapearFormaPagamento = (formaPagamentoParcela: string | null): string => {
  const mapeamento: Record<string, string> = {
    transferencia_direta: 'transferencia_bancaria',
    deposito_judicial: 'deposito_judicial',
    deposito_recursal: 'deposito_judicial',
    pix: 'pix',
    boleto: 'boleto',
    cheque: 'cheque',
  };

  return mapeamento[formaPagamentoParcela || ''] || 'transferencia_bancaria';
};

/**
 * Busca conta contábil adequada para o tipo de lançamento
 */
const buscarContaContabilPadrao = async (tipoLancamento: 'receita' | 'despesa'): Promise<number | null> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('plano_contas')
    .select('id')
    .eq('tipo_conta', tipoLancamento)
    .eq('aceita_lancamento', true)
    .eq('ativo', true)
    .order('codigo', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    console.warn(`Conta contábil padrão não encontrada para ${tipoLancamento}`);
    return null;
  }

  return data?.id || null;
};

/**
 * Busca o ID do usuário pelo auth_user_id
 */
const buscarUsuarioIdPorAuth = async (authUserId: string): Promise<number | null> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', authUserId)
    .single();

  if (error) {
    return null;
  }

  return data?.id || null;
};

// ============================================================================
// Sincronização de Parcela Individual
// ============================================================================

/**
 * Sincroniza uma parcela específica com o sistema financeiro
 *
 * Fluxo:
 * 1. Verifica se parcela existe e seu status
 * 2. Busca TODOS os lançamentos vinculados (detecta duplicidades)
 * 3. Se há múltiplos lançamentos e não forçar, retorna erro
 * 4. Se não existe e parcela está efetivada, cria lançamento
 * 5. Se existe mas valores divergem e forcar=true, atualiza
 */
export const sincronizarParcelaParaFinanceiro = async (
  parcelaId: number,
  forcar: boolean = false
): Promise<ItemSincronizacaoResult> => {
  try {
    // Buscar parcela com dados do acordo
    const parcela = await buscarParcelaPorId(parcelaId);

    if (!parcela) {
      return {
        parcelaId,
        sucesso: false,
        acao: 'erro',
        mensagem: 'Parcela não encontrada',
      };
    }

    const acordo = parcela.acordos_condenacoes;
    if (!acordo) {
      return {
        parcelaId,
        sucesso: false,
        acao: 'erro',
        mensagem: 'Acordo não encontrado para a parcela',
      };
    }

    // Verificar se parcela está efetivada
    const parcelaEfetivada = parcela.status === 'recebida' || parcela.status === 'paga';

    if (!parcelaEfetivada && !forcar) {
      return {
        parcelaId,
        sucesso: true,
        acao: 'ignorado',
        mensagem: 'Parcela ainda não efetivada (status: ' + parcela.status + ')',
      };
    }

    // Buscar TODOS os lançamentos vinculados para detectar duplicidades
    const todosLancamentos = await buscarTodosLancamentosPorParcela(parcelaId);

    // Verificar duplicidade: se há mais de um lançamento vinculado
    if (todosLancamentos.length > 1) {
      const lancamentosAtivos = todosLancamentos.filter(
        l => l.status !== 'cancelado' && l.status !== 'estornado'
      );

      if (lancamentosAtivos.length > 1 && !forcar) {
        // Múltiplos lançamentos ativos - não sincronizar automaticamente
        const ids = lancamentosAtivos.map(l => l.id).join(', ');
        return {
          parcelaId,
          sucesso: false,
          acao: 'erro',
          mensagem: `Detectados ${lancamentosAtivos.length} lançamentos ativos duplicados (IDs: ${ids}). Use forçar sincronização para atualizar o mais recente.`,
        };
      }
    }

    // Usar o lançamento mais recente (se existir)
    const lancamentoExistente = todosLancamentos.length > 0
      ? todosLancamentos[0] // Já ordenado por created_at desc
      : null;

    if (lancamentoExistente && !forcar) {
      return {
        parcelaId,
        lancamentoId: lancamentoExistente.id,
        sucesso: true,
        acao: 'ignorado',
        mensagem: 'Lançamento já existe (ID: ' + lancamentoExistente.id + ')',
      };
    }

    // Calcular valores
    const valorTotal = parcela.valor_bruto_credito_principal +
      (parcela.honorarios_sucumbenciais || 0);

    const tipoLancamento = acordo.direcao === 'recebimento' ? 'receita' : 'despesa';

    // Buscar conta contábil padrão
    const contaContabilId = await buscarContaContabilPadrao(tipoLancamento);
    if (!contaContabilId) {
      return {
        parcelaId,
        sucesso: false,
        acao: 'erro',
        mensagem: 'Conta contábil padrão não encontrada para ' + tipoLancamento,
      };
    }

    // Buscar usuário criador (usando parcela.created_by se disponível)
    const createdByUserId = parcela.created_by
      ? await buscarUsuarioIdPorAuth(parcela.created_by)
      : null;

    const supabase = createServiceClient();

    // Montar descrição
    const descricao = `Parcela ${parcela.numero_parcela}/${acordo.numero_parcelas} - ${
      acordo.tipo === 'acordo' ? 'Acordo' : 'Condenação'
    } (${acordo.direcao === 'recebimento' ? 'Recebimento' : 'Pagamento'})`;

    // Montar dados adicionais
    const dadosAdicionais = {
      numero_parcela: parcela.numero_parcela,
      total_parcelas: acordo.numero_parcelas,
      valor_principal: parcela.valor_bruto_credito_principal,
      honorarios_sucumbenciais: parcela.honorarios_sucumbenciais,
      honorarios_contratuais: parcela.honorarios_contratuais,
      tipo_acordo: acordo.tipo,
      direcao: acordo.direcao,
      sincronizado_manualmente: true,
      data_sincronizacao: new Date().toISOString(),
    };

    if (lancamentoExistente && forcar) {
      // Atualizar lançamento existente
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .update({
          valor: valorTotal,
          descricao,
          data_efetivacao: parcela.data_efetivacao,
          forma_pagamento: mapearFormaPagamento(parcela.forma_pagamento),
          dados_adicionais: dadosAdicionais,
          status: parcelaEfetivada ? 'confirmado' : 'pendente',
        })
        .eq('id', lancamentoExistente.id)
        .select('id')
        .single();

      if (error) {
        return {
          parcelaId,
          sucesso: false,
          acao: 'erro',
          mensagem: `Erro ao atualizar lançamento: ${error.message}`,
        };
      }

      await invalidateObrigacoesCache();

      return {
        parcelaId,
        lancamentoId: data.id,
        sucesso: true,
        acao: 'atualizado',
        mensagem: 'Lançamento atualizado com sucesso',
      };
    }

    // Criar novo lançamento
    const { data, error } = await supabase
      .from('lancamentos_financeiros')
      .insert({
        tipo: tipoLancamento,
        descricao,
        valor: valorTotal,
        data_lancamento: new Date().toISOString().split('T')[0],
        data_competencia: parcela.data_vencimento,
        data_vencimento: parcela.data_vencimento,
        data_efetivacao: parcela.data_efetivacao,
        status: parcelaEfetivada ? 'confirmado' : 'pendente',
        origem: 'acordo_judicial',
        forma_pagamento: mapearFormaPagamento(parcela.forma_pagamento),
        conta_contabil_id: contaContabilId,
        acordo_condenacao_id: parcela.acordo_condenacao_id,
        parcela_id: parcelaId,
        created_by: createdByUserId,
        dados_adicionais: dadosAdicionais,
      })
      .select('id')
      .single();

    if (error) {
      return {
        parcelaId,
        sucesso: false,
        acao: 'erro',
        mensagem: `Erro ao criar lançamento: ${error.message}`,
      };
    }

    await invalidateObrigacoesCache();

    return {
      parcelaId,
      lancamentoId: data.id,
      sucesso: true,
      acao: 'criado',
      mensagem: 'Lançamento criado com sucesso',
    };
  } catch (error) {
    return {
      parcelaId,
      sucesso: false,
      acao: 'erro',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
};

// ============================================================================
// Sincronização de Acordo Completo
// ============================================================================

/**
 * Sincroniza todas as parcelas de um acordo com o sistema financeiro
 */
export const sincronizarAcordoCompleto = async (
  acordoId: number,
  forcar: boolean = false
): Promise<SincronizarObrigacoesResult> => {
  const resultado: SincronizarObrigacoesResult = {
    sucesso: true,
    totalProcessados: 0,
    totalSucessos: 0,
    totalErros: 0,
    itens: [],
    erros: [],
    warnings: [],
  };

  try {
    // Verificar se acordo existe
    const acordo = await buscarAcordoPorId(acordoId);
    if (!acordo) {
      return {
        ...resultado,
        sucesso: false,
        erros: [`Acordo ${acordoId} não encontrado`],
      };
    }

    // Verificar status do acordo
    if (acordo.status === 'cancelado') {
      return {
        ...resultado,
        sucesso: false,
        erros: ['Não é possível sincronizar acordo cancelado'],
      };
    }

    // Buscar todas as parcelas do acordo
    const parcelas = await buscarParcelasPorAcordo(acordoId);

    if (parcelas.length === 0) {
      return {
        ...resultado,
        warnings: ['Acordo não possui parcelas cadastradas'],
      };
    }

    // Sincronizar cada parcela
    for (const parcela of parcelas) {
      resultado.totalProcessados++;

      const itemResult = await sincronizarParcelaParaFinanceiro(parcela.id, forcar);
      resultado.itens.push(itemResult);

      if (itemResult.sucesso) {
        if (itemResult.acao === 'criado' || itemResult.acao === 'atualizado') {
          resultado.totalSucessos++;
        }
      } else {
        resultado.totalErros++;
        resultado.erros.push(`Parcela ${parcela.numero_parcela}: ${itemResult.mensagem}`);
      }

      // Adicionar warnings para items ignorados
      if (itemResult.acao === 'ignorado') {
        resultado.warnings.push(`Parcela ${parcela.numero_parcela}: ${itemResult.mensagem}`);
      }
    }

    resultado.sucesso = resultado.totalErros === 0;
  } catch (error) {
    resultado.sucesso = false;
    resultado.erros.push(error instanceof Error ? error.message : 'Erro desconhecido');
  }

  return resultado;
};

// ============================================================================
// Verificação de Consistência
// ============================================================================

/**
 * Verifica a consistência entre parcelas e lançamentos de um acordo
 * Retorna contagens reais de parcelas para exibição na UI
 */
export const verificarConsistencia = async (
  acordoId: number
): Promise<VerificarConsistenciaResult> => {
  // Verificar se acordo existe
  const acordo = await buscarAcordoPorId(acordoId);
  if (!acordo) {
    throw new Error(`Acordo ${acordoId} não encontrado`);
  }

  // Buscar todas as parcelas do acordo
  const parcelas = await buscarParcelasPorAcordo(acordoId);

  // Calcular contagens reais
  let parcelasSincronizadas = 0;
  let parcelasPendentes = 0;
  let parcelasInconsistentes = 0;

  for (const parcela of parcelas) {
    const lancamentos = parcela.lancamentos_financeiros || [];
    const lancamentoVinculado = lancamentos[0];
    const parcelaEfetivada = parcela.status === 'recebida' || parcela.status === 'paga';

    if (!parcelaEfetivada) {
      // Parcela ainda não efetivada - pendente de sincronização
      parcelasPendentes++;
    } else if (!lancamentoVinculado) {
      // Parcela efetivada sem lançamento - inconsistente
      parcelasInconsistentes++;
    } else {
      // Parcela efetivada com lançamento - verificar consistência de valores
      const valorParcela = parcela.valor_bruto_credito_principal +
        (parcela.honorarios_sucumbenciais || 0);
      const valorLancamento = lancamentoVinculado.valor;

      // Verificar status
      const statusEsperado = parcelaEfetivada ? 'confirmado' : 'pendente';
      const statusConsistente = lancamentoVinculado.status === statusEsperado;

      // Verificar valor (tolerância de 1 centavo)
      const valorConsistente = Math.abs(valorParcela - valorLancamento) < 0.01;

      if (statusConsistente && valorConsistente) {
        parcelasSincronizadas++;
      } else {
        parcelasInconsistentes++;
      }
    }
  }

  const inconsistencias = await detectarInconsistenciasAcordo(acordoId);

  return {
    acordoId,
    consistente: inconsistencias.length === 0,
    totalInconsistencias: inconsistencias.length,
    inconsistencias,
    totalParcelas: parcelas.length,
    parcelasSincronizadas,
    parcelasPendentes,
    parcelasInconsistentes,
  };
};

// ============================================================================
// Reversão de Sincronização
// ============================================================================

/**
 * Reverte a sincronização de uma parcela (cancela/estorna lançamento vinculado)
 *
 * Casos de uso:
 * - Parcela foi revertida para pendente
 * - Correção de erro de sincronização
 */
export const reverterSincronizacao = async (
  parcelaId: number,
  motivo?: string
): Promise<{ sucesso: boolean; mensagem: string }> => {
  try {
    // Buscar parcela
    const parcela = await buscarParcelaPorId(parcelaId);
    if (!parcela) {
      return { sucesso: false, mensagem: 'Parcela não encontrada' };
    }

    // Buscar lançamento vinculado
    const lancamento = await buscarLancamentoPorParcela(parcelaId);
    if (!lancamento) {
      return { sucesso: true, mensagem: 'Nenhum lançamento vinculado para reverter' };
    }

    // Verificar se lançamento pode ser revertido
    if (lancamento.status === 'estornado') {
      return { sucesso: true, mensagem: 'Lançamento já está estornado' };
    }
    if (lancamento.status === 'cancelado') {
      return { sucesso: true, mensagem: 'Lançamento já está cancelado' };
    }

    const supabase = createServiceClient();

    // Definir novo status
    const novoStatus = lancamento.status === 'confirmado' ? 'estornado' : 'cancelado';

    // Atualizar lançamento
    const { error } = await supabase
      .from('lancamentos_financeiros')
      .update({
        status: novoStatus,
        observacoes: motivo
          ? `[Reversão] ${motivo}`
          : `[Reversão automática] Sincronização revertida em ${new Date().toISOString()}`,
      })
      .eq('id', lancamento.id);

    if (error) {
      return { sucesso: false, mensagem: `Erro ao reverter: ${error.message}` };
    }

    await invalidateObrigacoesCache();

    return {
      sucesso: true,
      mensagem: `Lançamento ${lancamento.id} ${novoStatus} com sucesso`,
    };
  } catch (error) {
    return {
      sucesso: false,
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
};

// ============================================================================
// Sincronização em Lote
// ============================================================================

/**
 * Sincroniza múltiplos acordos em lote
 */
export const sincronizarAcordosEmLote = async (
  acordoIds: number[],
  forcar: boolean = false
): Promise<{
  sucesso: boolean;
  totalAcordos: number;
  totalSucessos: number;
  totalErros: number;
  resultados: Array<{ acordoId: number; resultado: SincronizarObrigacoesResult }>;
}> => {
  const resultados: Array<{ acordoId: number; resultado: SincronizarObrigacoesResult }> = [];
  let totalSucessos = 0;
  let totalErros = 0;

  for (const acordoId of acordoIds) {
    const resultado = await sincronizarAcordoCompleto(acordoId, forcar);
    resultados.push({ acordoId, resultado });

    if (resultado.sucesso) {
      totalSucessos++;
    } else {
      totalErros++;
    }
  }

  return {
    sucesso: totalErros === 0,
    totalAcordos: acordoIds.length,
    totalSucessos,
    totalErros,
    resultados,
  };
};

// ============================================================================
// Auditoria
// ============================================================================

/**
 * Busca histórico de sincronizações de um acordo
 */
export const buscarHistoricoSincronizacoes = async (
  acordoId: number
): Promise<Array<{
  parcelaId: number;
  numeroParcela: number;
  lancamentoId: number | null;
  statusParcela: string;
  statusLancamento: string | null;
  dataSincronizacao: string | null;
}>> => {
  const parcelas = await buscarParcelasPorAcordo(acordoId);

  return parcelas.map(p => {
    const lancamento = p.lancamentos_financeiros?.[0];
    return {
      parcelaId: p.id,
      numeroParcela: p.numero_parcela,
      lancamentoId: lancamento?.id || null,
      statusParcela: p.status,
      statusLancamento: lancamento?.status || null,
      dataSincronizacao: lancamento?.data_lancamento || null,
    };
  });
};
