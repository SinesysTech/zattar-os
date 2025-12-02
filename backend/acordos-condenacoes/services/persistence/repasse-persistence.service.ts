// Serviço de persistência de repasses
// Gerencia operações relacionadas a repasses ao cliente

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { StatusRepasse } from './parcela-persistence.service';

/**
 * Dados de repasse pendente (da view)
 */
export interface RepassePendente {
  parcelaId: number;
  acordoCondenacaoId: number;
  numeroParcela: number;
  valorBrutoCreditoPrincipal: number;
  valorRepasseCliente: number;
  statusRepasse: StatusRepasse;
  dataEfetivacao: string;
  arquivoDeclaracaoPrestacaoContas: string | null;
  dataDeclaracaoAnexada: string | null;
  processoId: number;
  tipo: string;
  acordoValorTotal: number;
  percentualCliente: number;
  acordoNumeroParcelas: number;
}

/**
 * Dados para anexar declaração
 */
export interface AnexarDeclaracaoDados {
  parcelaId: number;
  arquivoPath: string;
}

/**
 * Dados para realizar repasse
 */
export interface RealizarRepasseDados {
  parcelaId: number;
  arquivoComprovantePath: string;
  usuarioRepasseId: number;
}

/**
 * Parâmetros para filtrar repasses
 */
export interface FiltrosRepassesPendentes {
  statusRepasse?: StatusRepasse;
  processoId?: number;
  dataInicio?: string; // ISO date
  dataFim?: string; // ISO date
  valorMinimo?: number;
  valorMaximo?: number;
}

/**
 * Lista repasses pendentes (usa view repasses_pendentes)
 */
export async function listarRepassesPendentes(
  filtros: FiltrosRepassesPendentes = {}
): Promise<RepassePendente[]> {
  const supabase = createServiceClient();

  try {
    let query = supabase
      .from('repasses_pendentes')
      .select('*');

    // Aplicar filtros
    if (filtros.statusRepasse) {
      query = query.eq('status_repasse', filtros.statusRepasse);
    }
    if (filtros.processoId) {
      query = query.eq('processo_id', filtros.processoId);
    }
    if (filtros.dataInicio) {
      query = query.gte('data_efetivacao', filtros.dataInicio);
    }
    if (filtros.dataFim) {
      query = query.lte('data_efetivacao', filtros.dataFim);
    }
    if (filtros.valorMinimo !== undefined) {
      query = query.gte('valor_repasse_cliente', filtros.valorMinimo);
    }
    if (filtros.valorMaximo !== undefined) {
      query = query.lte('valor_repasse_cliente', filtros.valorMaximo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar repasses pendentes:', error);
      throw new Error(`Erro ao listar repasses pendentes: ${error.message}`);
    }

    return (data || []).map(mapearRepassePendente);
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao listar repasses pendentes:', error);
    throw new Error(`Erro inesperado: ${erroMsg}`);
  }
}

/**
 * Anexa declaração de prestação de contas
 */
export async function anexarDeclaracao(
  dados: AnexarDeclaracaoDados
): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createServiceClient();

  try {
    const { error } = await supabase
      .from('parcelas')
      .update({
        arquivo_declaracao_prestacao_contas: dados.arquivoPath,
        data_declaracao_anexada: new Date().toISOString(),
        status_repasse: 'pendente_transferencia',
      })
      .eq('id', dados.parcelaId);

    if (error) {
      console.error('Erro ao anexar declaração:', error);
      return {
        sucesso: false,
        erro: `Erro ao anexar declaração: ${error.message}`,
      };
    }

    return { sucesso: true };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao anexar declaração:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Realiza repasse ao cliente (marca como repassado)
 */
export async function realizarRepasse(
  dados: RealizarRepasseDados
): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createServiceClient();

  try {
    // Verificar se declaração foi anexada
    const { data: parcela } = await supabase
      .from('parcelas')
      .select('arquivo_declaracao_prestacao_contas, status_repasse')
      .eq('id', dados.parcelaId)
      .single();

    if (!parcela?.arquivo_declaracao_prestacao_contas) {
      return {
        sucesso: false,
        erro: 'Declaração de prestação de contas é obrigatória antes de realizar repasse',
      };
    }

    if (parcela.status_repasse !== 'pendente_transferencia') {
      return {
        sucesso: false,
        erro: 'Parcela não está pronta para repasse',
      };
    }

    // Atualizar parcela com dados do repasse
    const { error } = await supabase
      .from('parcelas')
      .update({
        arquivo_comprovante_repasse: dados.arquivoComprovantePath,
        data_repasse: new Date().toISOString(),
        usuario_repasse_id: dados.usuarioRepasseId,
        status_repasse: 'repassado',
      })
      .eq('id', dados.parcelaId);

    if (error) {
      console.error('Erro ao realizar repasse:', error);
      return {
        sucesso: false,
        erro: `Erro ao realizar repasse: ${error.message}`,
      };
    }

    return { sucesso: true };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao realizar repasse:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Lista repasses realizados (histórico)
 */
export interface RepasseRealizadoDb {
  id: number;
  acordo_condenacao_id: number;
  numero_parcela: number;
  valor_bruto_credito_principal: number;
  honorarios_sucumbenciais: number;
  honorarios_contratuais: number;
  data_vencimento: string;
  status: string; // StatusParcela
  data_efetivacao: string | null;
  forma_pagamento: string; // FormaPagamento
  dados_pagamento: Record<string, unknown> | null;
  editado_manualmente: boolean;
  valor_repasse_cliente: number | null;
  status_repasse: string; // StatusRepasse
  arquivo_declaracao_prestacao_contas: string | null;
  data_declaracao_anexada: string | null;
  arquivo_comprovante_repasse: string | null;
  data_repasse: string | null;
  usuario_repasse_id: number | null;
  created_at: string;
  updated_at: string;
  acordos_condenacoes: {
    processo_id: number;
    tipo: string;
  };
}

export async function listarRepassesRealizados(params: {
  dataInicio?: string;
  dataFim?: string;
  usuarioRepasseId?: number;
  processoId?: number;
  pagina?: number;
  limite?: number;
}): Promise<{
  repasses: RepasseRealizadoDb[];
  total: number;
  totalRepassado: number;
}> {
  const supabase = createServiceClient();
  const pagina = params.pagina || 1;
  const limite = params.limite || 50;
  const offset = (pagina - 1) * limite;

  try {
    let query = supabase
      .from('parcelas')
      .select('*, acordos_condenacoes!inner(processo_id, tipo)', { count: 'exact' })
      .eq('status_repasse', 'repassado');

    // Aplicar filtros
    if (params.dataInicio) {
      query = query.gte('data_repasse', params.dataInicio);
    }
    if (params.dataFim) {
      query = query.lte('data_repasse', params.dataFim);
    }
    if (params.usuarioRepasseId) {
      query = query.eq('usuario_repasse_id', params.usuarioRepasseId);
    }
    if (params.processoId) {
      query = query.eq('acordos_condenacoes.processo_id', params.processoId);
    }

    // Ordenar por data de repasse (mais recentes primeiro)
    query = query.order('data_repasse', { ascending: false });

    // Aplicar paginação
    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao listar repasses realizados:', error);
      throw new Error(`Erro ao listar repasses realizados: ${error.message}`);
    }

    // Calcular total repassado
    const totalRepassado = (data || []).reduce(
      (sum, item) => sum + parseFloat(item.valor_repasse_cliente || 0),
      0
    );

    return {
      repasses: data || [],
      total: count || 0,
      totalRepassado,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao listar repasses realizados:', error);
    throw new Error(`Erro inesperado: ${erroMsg}`);
  }
}

/**
 * Remove declaração anexada (reverter para pendente_declaracao)
 */
export async function removerDeclaracao(
  parcelaId: number
): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createServiceClient();

  try {
    const { error } = await supabase
      .from('parcelas')
      .update({
        arquivo_declaracao_prestacao_contas: null,
        data_declaracao_anexada: null,
        status_repasse: 'pendente_declaracao',
      })
      .eq('id', parcelaId)
      .eq('status_repasse', 'pendente_transferencia'); // Só permite se ainda não foi repassado

    if (error) {
      console.error('Erro ao remover declaração:', error);
      return {
        sucesso: false,
        erro: `Erro ao remover declaração: ${error.message}`,
      };
    }

    return { sucesso: true };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao remover declaração:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

// Raw data for repasse pendente from Supabase view
interface RepassePendenteDb {
  parcela_id: number;
  acordo_condenacao_id: number;
  numero_parcela: number;
  valor_bruto_credito_principal: number;
  valor_repasse_cliente: number;
  status_repasse: StatusRepasse;
  data_efetivacao: string;
  arquivo_declaracao_prestacao_contas: string | null;
  data_declaracao_anexada: string | null;
  processo_id: number;
  tipo: string;
  acordo_valor_total: number;
  percentual_cliente: number;
  acordo_numero_parcelas: number;
}

/**
 * Mapeia dados da view para o tipo RepassePendente
 */
function mapearRepassePendente(data: RepassePendenteDb): RepassePendente {
  return {
    parcelaId: data.parcela_id,
    acordoCondenacaoId: data.acordo_condenacao_id,
    numeroParcela: data.numero_parcela,
    valorBrutoCreditoPrincipal: parseFloat(data.valor_bruto_credito_principal),
    valorRepasseCliente: parseFloat(data.valor_repasse_cliente),
    statusRepasse: data.status_repasse,
    dataEfetivacao: data.data_efetivacao,
    arquivoDeclaracaoPrestacaoContas: data.arquivo_declaracao_prestacao_contas,
    dataDeclaracaoAnexada: data.data_declaracao_anexada,
    processoId: data.processo_id,
    tipo: data.tipo,
    acordoValorTotal: parseFloat(data.acordo_valor_total),
    percentualCliente: parseFloat(data.percentual_cliente),
    acordoNumeroParcelas: data.acordo_numero_parcelas,
  };
}
