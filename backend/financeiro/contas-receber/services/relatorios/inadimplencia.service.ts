/**
 * Serviço de Relatório de Inadimplência
 * Gera dados agregados para análise de contas vencidas
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { ContaReceberComDetalhes } from '@/backend/types/financeiro/contas-receber.types';

// ============================================================================
// Tipos
// ============================================================================

interface ClienteInadimplente {
  clienteId: number;
  clienteNome: string;
  quantidadeContas: number;
  valorTotal: number;
  diasMediaAtraso: number;
  maiorAtraso: number;
}

interface FaixaAtraso {
  faixa: string;
  quantidadeContas: number;
  valorTotal: number;
  percentualTotal: number;
}

interface RelatorioInadimplencia {
  resumo: {
    totalContas: number;
    valorTotal: number;
    diasMediaAtraso: number;
    clientesInadimplentes: number;
  };
  clientesRanking: ClienteInadimplente[];
  faixasAtraso: FaixaAtraso[];
  contasVencidas: ContaReceberComDetalhes[];
}

interface BuscarRelatorioParams {
  dataInicio?: string;
  dataFim?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calcula dias de atraso baseado na data de vencimento
 */
const calcularDiasAtraso = (dataVencimento: string): number => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(dataVencimento);
  vencimento.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)));
};

/**
 * Determina a faixa de atraso baseado nos dias
 */
const determinarFaixaAtraso = (diasAtraso: number): string => {
  if (diasAtraso <= 7) return '1-7 dias';
  if (diasAtraso <= 15) return '8-15 dias';
  if (diasAtraso <= 30) return '16-30 dias';
  if (diasAtraso <= 60) return '31-60 dias';
  if (diasAtraso <= 90) return '61-90 dias';
  return 'Mais de 90 dias';
};

// ============================================================================
// Serviço Principal
// ============================================================================

/**
 * Busca dados para o relatório de inadimplência
 */
export const buscarRelatorioInadimplencia = async (
  params: BuscarRelatorioParams
): Promise<RelatorioInadimplencia> => {
  const supabase = createServiceClient();
  const hoje = new Date().toISOString().split('T')[0];

  // Buscar todas as contas vencidas (pendentes com data_vencimento < hoje)
  let query = supabase
    .from('lancamentos_financeiros')
    .select(`
      id,
      descricao,
      valor,
      data_lancamento,
      data_competencia,
      data_vencimento,
      data_efetivacao,
      status,
      origem,
      forma_pagamento,
      conta_bancaria_id,
      conta_contabil_id,
      centro_custo_id,
      categoria,
      documento,
      observacoes,
      cliente_id,
      contrato_id,
      created_at,
      updated_at,
      cliente:clientes(id, nome, razao_social, nome_fantasia, cpf, cnpj, tipo_pessoa),
      contrato:contratos(id, numero, descricao),
      plano_contas(id, codigo, nome),
      centros_custo(id, codigo, nome)
    `)
    .eq('tipo', 'receita')
    .eq('status', 'pendente')
    .lt('data_vencimento', hoje);

  // Aplicar filtros de data se fornecidos
  if (params.dataInicio) {
    query = query.gte('data_vencimento', params.dataInicio);
  }
  if (params.dataFim) {
    query = query.lte('data_vencimento', params.dataFim);
  }

  query = query.order('data_vencimento', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar contas vencidas: ${error.message}`);
  }

  const contasVencidas = data || [];

  // Mapear para o formato esperado
  const contasMapeadas: ContaReceberComDetalhes[] = contasVencidas.map((conta: Record<string, unknown>) => ({
    id: conta.id as number,
    descricao: conta.descricao as string,
    valor: Number(conta.valor),
    dataLancamento: conta.data_lancamento as string,
    dataCompetencia: conta.data_competencia as string,
    dataVencimento: conta.data_vencimento as string | null,
    dataEfetivacao: conta.data_efetivacao as string | null,
    status: conta.status as 'pendente' | 'confirmado' | 'cancelado' | 'estornado',
    origem: conta.origem as string,
    formaRecebimento: conta.forma_pagamento as string | null,
    contaBancariaId: conta.conta_bancaria_id as number | null,
    contaContabilId: conta.conta_contabil_id as number,
    centroCustoId: conta.centro_custo_id as number | null,
    categoria: conta.categoria as string | null,
    documento: conta.documento as string | null,
    observacoes: conta.observacoes as string | null,
    anexos: [],
    dadosAdicionais: {},
    clienteId: conta.cliente_id as number | null,
    contratoId: conta.contrato_id as number | null,
    acordoCondenacaoId: null,
    parcelaId: null,
    usuarioId: null,
    recorrente: false,
    frequenciaRecorrencia: null,
    lancamentoOrigemId: null,
    createdBy: null,
    createdAt: conta.created_at as string,
    updatedAt: conta.updated_at as string,
    cliente: (conta.cliente as Record<string, unknown> | null)
      ? {
          id: (conta.cliente as Record<string, unknown>).id as number,
          nome: (conta.cliente as Record<string, unknown>).nome as string,
          razaoSocial: (conta.cliente as Record<string, unknown>).razao_social as string | null,
          nomeFantasia: (conta.cliente as Record<string, unknown>).nome_fantasia as string | null,
          cpfCnpj: ((conta.cliente as Record<string, unknown>).tipo_pessoa === 'fisica'
            ? (conta.cliente as Record<string, unknown>).cpf
            : (conta.cliente as Record<string, unknown>).cnpj) as string | null,
          cnpj: (conta.cliente as Record<string, unknown>).cnpj as string | null,
          tipoPessoa: (conta.cliente as Record<string, unknown>).tipo_pessoa as 'fisica' | 'juridica',
        }
      : undefined,
    contrato: (conta.contrato as Record<string, unknown> | null)
      ? {
          id: (conta.contrato as Record<string, unknown>).id as number,
          numero: (conta.contrato as Record<string, unknown>).numero as string,
          descricao: (conta.contrato as Record<string, unknown>).descricao as string | null,
          areaDireito: null,
          tipoContrato: null,
        }
      : undefined,
    contaContabil: (conta.plano_contas as Record<string, unknown> | null)
      ? {
          id: (conta.plano_contas as Record<string, unknown>).id as number,
          codigo: (conta.plano_contas as Record<string, unknown>).codigo as string,
          nome: (conta.plano_contas as Record<string, unknown>).nome as string,
        }
      : undefined,
    centroCusto: (conta.centros_custo as Record<string, unknown> | null)
      ? {
          id: (conta.centros_custo as Record<string, unknown>).id as number,
          codigo: (conta.centros_custo as Record<string, unknown>).codigo as string,
          nome: (conta.centros_custo as Record<string, unknown>).nome as string,
        }
      : undefined,
  }));

  // Calcular estatísticas
  const valorTotal = contasMapeadas.reduce((acc, c) => acc + c.valor, 0);
  const totalContas = contasMapeadas.length;

  // Agrupar por cliente
  const clientesMap = new Map<number | null, ClienteInadimplente>();

  for (const conta of contasMapeadas) {
    const clienteId = conta.clienteId || 0;
    const clienteNome = conta.cliente?.nomeFantasia || conta.cliente?.razaoSocial || conta.cliente?.nome || 'Sem cliente';
    const diasAtraso = conta.dataVencimento ? calcularDiasAtraso(conta.dataVencimento) : 0;

    if (!clientesMap.has(clienteId)) {
      clientesMap.set(clienteId, {
        clienteId,
        clienteNome,
        quantidadeContas: 0,
        valorTotal: 0,
        diasMediaAtraso: 0,
        maiorAtraso: 0,
      });
    }

    const cliente = clientesMap.get(clienteId)!;
    cliente.quantidadeContas++;
    cliente.valorTotal += conta.valor;
    cliente.diasMediaAtraso += diasAtraso;
    cliente.maiorAtraso = Math.max(cliente.maiorAtraso, diasAtraso);
  }

  // Calcular média de dias para cada cliente
  const clientesRanking: ClienteInadimplente[] = Array.from(clientesMap.values())
    .map((c) => ({
      ...c,
      diasMediaAtraso: c.quantidadeContas > 0 ? c.diasMediaAtraso / c.quantidadeContas : 0,
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal);

  // Agrupar por faixa de atraso
  const faixasMap = new Map<string, FaixaAtraso>();
  const ordemFaixas = ['1-7 dias', '8-15 dias', '16-30 dias', '31-60 dias', '61-90 dias', 'Mais de 90 dias'];

  for (const faixa of ordemFaixas) {
    faixasMap.set(faixa, {
      faixa,
      quantidadeContas: 0,
      valorTotal: 0,
      percentualTotal: 0,
    });
  }

  for (const conta of contasMapeadas) {
    if (!conta.dataVencimento) continue;
    const diasAtraso = calcularDiasAtraso(conta.dataVencimento);
    const faixaNome = determinarFaixaAtraso(diasAtraso);

    const faixa = faixasMap.get(faixaNome)!;
    faixa.quantidadeContas++;
    faixa.valorTotal += conta.valor;
  }

  // Calcular percentuais
  const faixasAtraso: FaixaAtraso[] = ordemFaixas
    .map((nome) => {
      const faixa = faixasMap.get(nome)!;
      return {
        ...faixa,
        percentualTotal: valorTotal > 0 ? (faixa.valorTotal / valorTotal) * 100 : 0,
      };
    })
    .filter((f) => f.quantidadeContas > 0);

  // Calcular dias médio total de atraso
  const diasTotalAtraso = contasMapeadas.reduce(
    (acc, c) => acc + (c.dataVencimento ? calcularDiasAtraso(c.dataVencimento) : 0),
    0
  );
  const diasMediaAtraso = totalContas > 0 ? diasTotalAtraso / totalContas : 0;

  return {
    resumo: {
      totalContas,
      valorTotal,
      diasMediaAtraso,
      clientesInadimplentes: clientesMap.size,
    },
    clientesRanking,
    faixasAtraso,
    contasVencidas: contasMapeadas,
  };
};
