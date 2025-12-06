/**
 * Serviço de Geração de Contas a Receber a partir de Contratos
 * Automatiza a criação de lançamentos financeiros baseados em contratos
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { criarContaReceber } from '@/backend/financeiro/contas-receber/services/persistence/contas-receber-persistence.service';
import type {
  CriarContaReceberDTO,
  ContaReceber,
  FrequenciaRecorrencia,
} from '@/backend/types/financeiro/contas-receber.types';

// ============================================================================
// Tipos
// ============================================================================

interface Contrato {
  id: number;
  numero: string;
  descricao?: string;
  tipo_cobranca: 'pro_exito' | 'pro_labore';
  cliente_id: number;
  percentual_escritorio?: number;
  status: 'em_contratacao' | 'contratado' | 'distribuido' | 'desistencia';
}

interface GerarContaReceberParams {
  contratoId: number;
  valor: number;
  descricao?: string;
  categoria?: string;
  dataVencimento: string;
  contaContabilId: number;
  numeroParcelas?: number;
  frequencia?: FrequenciaRecorrencia;
  usuarioId: number;
}

interface GerarContasParcelasParams {
  contratoId: number;
  valorTotal: number;
  descricaoBase: string;
  categoria: string;
  dataPrimeiroVencimento: string;
  contaContabilId: number;
  numeroParcelas: number;
  frequencia: FrequenciaRecorrencia;
  usuarioId: number;
}

interface ResultadoGeracaoContas {
  sucesso: boolean;
  contasCriadas: ContaReceber[];
  erro?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calcula a próxima data de vencimento baseada na frequência
 */
const calcularProximaData = (dataBase: Date, frequencia: FrequenciaRecorrencia): Date => {
  const novaData = new Date(dataBase);

  switch (frequencia) {
    case 'semanal':
      novaData.setDate(novaData.getDate() + 7);
      break;
    case 'quinzenal':
      novaData.setDate(novaData.getDate() + 15);
      break;
    case 'mensal':
      novaData.setMonth(novaData.getMonth() + 1);
      break;
    case 'bimestral':
      novaData.setMonth(novaData.getMonth() + 2);
      break;
    case 'trimestral':
      novaData.setMonth(novaData.getMonth() + 3);
      break;
    case 'semestral':
      novaData.setMonth(novaData.getMonth() + 6);
      break;
    case 'anual':
      novaData.setFullYear(novaData.getFullYear() + 1);
      break;
    default:
      novaData.setMonth(novaData.getMonth() + 1);
  }

  return novaData;
};

/**
 * Formata data para string YYYY-MM-DD
 */
const formatarData = (data: Date): string => {
  return data.toISOString().split('T')[0];
};

// ============================================================================
// Serviços Principais
// ============================================================================

/**
 * Busca um contrato por ID
 */
export const buscarContrato = async (contratoId: number): Promise<Contrato | null> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('contratos')
    .select('id, numero, descricao, tipo_cobranca, cliente_id, percentual_escritorio, status')
    .eq('id', contratoId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao buscar contrato: ${error.message}`);
  }

  return data as Contrato;
};

/**
 * Gera uma única conta a receber vinculada ao contrato
 */
export const gerarContaReceberContrato = async (
  params: GerarContaReceberParams
): Promise<ResultadoGeracaoContas> => {
  try {
    // Buscar contrato
    const contrato = await buscarContrato(params.contratoId);
    if (!contrato) {
      return {
        sucesso: false,
        contasCriadas: [],
        erro: 'Contrato não encontrado',
      };
    }

    // Validar status do contrato
    if (contrato.status === 'desistencia') {
      return {
        sucesso: false,
        contasCriadas: [],
        erro: 'Não é possível gerar contas para contratos com desistência',
      };
    }

    // Preparar dados da conta
    const descricao = params.descricao || `Honorários - Contrato ${contrato.numero}`;
    const categoria = params.categoria || 'honorarios_contratuais';

    const contaDTO: CriarContaReceberDTO = {
      descricao,
      valor: params.valor,
      dataVencimento: params.dataVencimento,
      contaContabilId: params.contaContabilId,
      origem: 'contrato',
      categoria,
      clienteId: contrato.cliente_id,
      contratoId: params.contratoId,
      recorrente: false,
    };

    const conta = await criarContaReceber(contaDTO, params.usuarioId);

    return {
      sucesso: true,
      contasCriadas: [conta],
    };
  } catch (error) {
    return {
      sucesso: false,
      contasCriadas: [],
      erro: error instanceof Error ? error.message : 'Erro ao gerar conta a receber',
    };
  }
};

/**
 * Gera múltiplas parcelas de contas a receber vinculadas ao contrato
 */
export const gerarContasParcelasContrato = async (
  params: GerarContasParcelasParams
): Promise<ResultadoGeracaoContas> => {
  try {
    // Buscar contrato
    const contrato = await buscarContrato(params.contratoId);
    if (!contrato) {
      return {
        sucesso: false,
        contasCriadas: [],
        erro: 'Contrato não encontrado',
      };
    }

    // Validar status do contrato
    if (contrato.status === 'desistencia') {
      return {
        sucesso: false,
        contasCriadas: [],
        erro: 'Não é possível gerar contas para contratos com desistência',
      };
    }

    // Validar número de parcelas
    if (params.numeroParcelas < 1) {
      return {
        sucesso: false,
        contasCriadas: [],
        erro: 'Número de parcelas deve ser maior que zero',
      };
    }

    // Calcular valor de cada parcela
    const valorParcela = params.valorTotal / params.numeroParcelas;

    // Gerar parcelas
    const contasCriadas: ContaReceber[] = [];
    let dataVencimento = new Date(params.dataPrimeiroVencimento);

    for (let i = 1; i <= params.numeroParcelas; i++) {
      const descricao = `${params.descricaoBase} (${i}/${params.numeroParcelas})`;

      const contaDTO: CriarContaReceberDTO = {
        descricao,
        valor: valorParcela,
        dataVencimento: formatarData(dataVencimento),
        contaContabilId: params.contaContabilId,
        origem: 'contrato',
        categoria: params.categoria,
        clienteId: contrato.cliente_id,
        contratoId: params.contratoId,
        recorrente: false,
        dadosAdicionais: {
          numeroParcela: i,
          totalParcelas: params.numeroParcelas,
          valorTotal: params.valorTotal,
        },
      };

      const conta = await criarContaReceber(contaDTO, params.usuarioId);
      contasCriadas.push(conta);

      // Calcular próxima data de vencimento
      if (i < params.numeroParcelas) {
        dataVencimento = calcularProximaData(dataVencimento, params.frequencia);
      }
    }

    return {
      sucesso: true,
      contasCriadas,
    };
  } catch (error) {
    return {
      sucesso: false,
      contasCriadas: [],
      erro: error instanceof Error ? error.message : 'Erro ao gerar parcelas',
    };
  }
};

/**
 * Gera contas a receber automaticamente quando contrato é assinado
 * Pode ser chamado por um hook ou trigger quando o status do contrato muda
 */
export const gerarContasAoAssinarContrato = async (
  contratoId: number,
  valorContrato: number,
  contaContabilId: number,
  numeroParcelas: number,
  frequencia: FrequenciaRecorrencia,
  dataPrimeiroVencimento: string,
  usuarioId: number
): Promise<ResultadoGeracaoContas> => {
  // Buscar contrato para validações
  const contrato = await buscarContrato(contratoId);
  if (!contrato) {
    return {
      sucesso: false,
      contasCriadas: [],
      erro: 'Contrato não encontrado',
    };
  }

  // Validar que contrato está no status correto
  if (contrato.status !== 'contratado') {
    return {
      sucesso: false,
      contasCriadas: [],
      erro: 'Contrato precisa estar no status "contratado" para gerar contas',
    };
  }

  // Determinar descrição e categoria baseado no tipo de cobrança
  const descricaoBase =
    contrato.tipo_cobranca === 'pro_exito'
      ? `Honorários de Êxito - Contrato ${contrato.numero}`
      : `Honorários Contratuais - Contrato ${contrato.numero}`;

  const categoria =
    contrato.tipo_cobranca === 'pro_exito' ? 'honorarios_exito' : 'honorarios_contratuais';

  // Gerar parcelas
  if (numeroParcelas === 1) {
    return gerarContaReceberContrato({
      contratoId,
      valor: valorContrato,
      descricao: descricaoBase,
      categoria,
      dataVencimento: dataPrimeiroVencimento,
      contaContabilId,
      usuarioId,
    });
  }

  return gerarContasParcelasContrato({
    contratoId,
    valorTotal: valorContrato,
    descricaoBase,
    categoria,
    dataPrimeiroVencimento,
    contaContabilId,
    numeroParcelas,
    frequencia,
    usuarioId,
  });
};

/**
 * Busca contas a receber geradas para um contrato
 */
export const buscarContasReceberDoContrato = async (contratoId: number): Promise<ContaReceber[]> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('lancamentos_financeiros')
    .select('*')
    .eq('tipo', 'receita')
    .eq('contrato_id', contratoId)
    .order('data_vencimento', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar contas do contrato: ${error.message}`);
  }

  // Mapear para interface ContaReceber
  return (data || []).map((registro) => ({
    id: registro.id,
    descricao: registro.descricao,
    valor: Number(registro.valor),
    dataLancamento: registro.data_lancamento,
    dataCompetencia: registro.data_competencia,
    dataVencimento: registro.data_vencimento,
    dataEfetivacao: registro.data_efetivacao,
    status: registro.status,
    origem: registro.origem,
    formaRecebimento: registro.forma_pagamento,
    contaBancariaId: registro.conta_bancaria_id,
    contaContabilId: registro.conta_contabil_id,
    centroCustoId: registro.centro_custo_id,
    categoria: registro.categoria,
    documento: registro.documento,
    observacoes: registro.observacoes,
    anexos: registro.anexos || [],
    dadosAdicionais: registro.dados_adicionais || {},
    clienteId: registro.cliente_id,
    contratoId: registro.contrato_id,
    acordoCondenacaoId: registro.acordo_condenacao_id,
    parcelaId: registro.parcela_id,
    usuarioId: registro.usuario_id,
    recorrente: registro.recorrente,
    frequenciaRecorrencia: registro.frequencia_recorrencia,
    lancamentoOrigemId: registro.lancamento_origem_id,
    createdBy: registro.created_by,
    createdAt: registro.created_at,
    updatedAt: registro.updated_at,
  }));
};
