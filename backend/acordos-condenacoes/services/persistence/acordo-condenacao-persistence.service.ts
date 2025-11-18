// Serviço de persistência de acordos e condenações
// Gerencia operações de CRUD na tabela acordos_condenacoes

import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Tipo de registro
 */
export type TipoAcordoCondenacao = 'acordo' | 'condenacao' | 'custas_processuais';

/**
 * Direção do pagamento
 */
export type DirecaoPagamento = 'recebimento' | 'pagamento';

/**
 * Forma de distribuição
 */
export type FormaDistribuicao = 'integral' | 'dividido';

/**
 * Status do acordo/condenação
 */
export type StatusAcordoCondenacao = 'pendente' | 'pago_parcial' | 'pago_total' | 'atrasado';

/**
 * Dados para cadastro de acordo/condenação
 */
export interface AcordoCondenacaoDados {
  processoId: number;
  tipo: TipoAcordoCondenacao;
  direcao: DirecaoPagamento;
  valorTotal: number;
  dataVencimentoPrimeiraParcela: string; // ISO date string (YYYY-MM-DD)
  numeroParcelas: number;
  formaDistribuicao?: FormaDistribuicao | null;
  percentualEscritorio?: number;
  honorariosSucumbenciaisTotal?: number;
  createdBy?: string; // UUID do usuário
}

/**
 * Dados para atualização de acordo/condenação
 */
export interface AcordoCondenacaoAtualizacaoDados {
  valorTotal?: number;
  dataVencimentoPrimeiraParcela?: string;
  percentualEscritorio?: number;
  honorariosSucumbenciaisTotal?: number;
  status?: StatusAcordoCondenacao;
}

/**
 * Dados retornados do banco
 */
export interface AcordoCondenacao {
  id: number;
  processoId: number;
  tipo: TipoAcordoCondenacao;
  direcao: DirecaoPagamento;
  valorTotal: number;
  dataVencimentoPrimeiraParcela: string;
  status: StatusAcordoCondenacao;
  numeroParcelas: number;
  formaDistribuicao: FormaDistribuicao | null;
  percentualEscritorio: number | null;
  percentualCliente: number | null;
  honorariosSucumbenciaisTotal: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

/**
 * Acordo com informações de parcelas
 */
export interface AcordoCondenacaoComParcelas extends AcordoCondenacao {
  parcelas?: any[]; // Será tipado com Parcela do outro service
  totalParcelas: number;
  parcelasPagas: number;
  parcelasPendentes: number;
}

/**
 * Resultado de operação
 */
export interface OperacaoAcordoResult {
  sucesso: boolean;
  acordo?: AcordoCondenacao;
  erro?: string;
}

/**
 * Parâmetros para listar acordos/condenações
 */
export interface ListarAcordosParams {
  pagina?: number;
  limite?: number;
  processoId?: number;
  tipo?: TipoAcordoCondenacao;
  direcao?: DirecaoPagamento;
  status?: StatusAcordoCondenacao;
  dataInicio?: string; // ISO date
  dataFim?: string; // ISO date
}

/**
 * Resultado paginado
 */
export interface AcordosCondenacoesPaginado {
  acordos: AcordoCondenacaoComParcelas[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Cria um novo acordo/condenação
 */
export async function criarAcordoCondenacao(
  dados: AcordoCondenacaoDados
): Promise<OperacaoAcordoResult> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('acordos_condenacoes')
      .insert({
        processo_id: dados.processoId,
        tipo: dados.tipo,
        direcao: dados.direcao,
        valor_total: dados.valorTotal,
        data_vencimento_primeira_parcela: dados.dataVencimentoPrimeiraParcela,
        numero_parcelas: dados.numeroParcelas,
        forma_distribuicao: dados.formaDistribuicao || null,
        percentual_escritorio: dados.percentualEscritorio || 30.00,
        honorarios_sucumbenciais_total: dados.honorariosSucumbenciaisTotal || 0,
        created_by: dados.createdBy || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar acordo/condenação:', error);
      return {
        sucesso: false,
        erro: `Erro ao criar acordo/condenação: ${error.message}`,
      };
    }

    return {
      sucesso: true,
      acordo: mapearAcordoCondenacao(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao criar acordo/condenação:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Lista acordos/condenações com paginação e filtros
 */
export async function listarAcordosCondenacoes(
  params: ListarAcordosParams = {}
): Promise<AcordosCondenacoesPaginado> {
  const supabase = createServiceClient();
  const pagina = params.pagina || 1;
  const limite = params.limite || 50;
  const offset = (pagina - 1) * limite;

  try {
    let query = supabase
      .from('acordos_condenacoes')
      .select('*, parcelas(id, status)', { count: 'exact' });

    // Aplicar filtros
    if (params.processoId) {
      query = query.eq('processo_id', params.processoId);
    }
    if (params.tipo) {
      query = query.eq('tipo', params.tipo);
    }
    if (params.direcao) {
      query = query.eq('direcao', params.direcao);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.dataInicio) {
      query = query.gte('data_vencimento_primeira_parcela', params.dataInicio);
    }
    if (params.dataFim) {
      query = query.lte('data_vencimento_primeira_parcela', params.dataFim);
    }

    // Ordenar por data de criação (mais recentes primeiro)
    query = query.order('created_at', { ascending: false });

    // Aplicar paginação
    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao listar acordos/condenações:', error);
      throw new Error(`Erro ao listar acordos/condenações: ${error.message}`);
    }

    const acordos = (data || []).map((item: any) => {
      const acordo = mapearAcordoCondenacao(item);
      const parcelas = item.parcelas || [];
      const parcelasPagas = parcelas.filter((p: any) =>
        ['recebida', 'paga'].includes(p.status)
      ).length;

      return {
        ...acordo,
        parcelas: item.parcelas,
        totalParcelas: parcelas.length,
        parcelasPagas,
        parcelasPendentes: parcelas.length - parcelasPagas,
      };
    });

    return {
      acordos,
      total: count || 0,
      pagina,
      limite,
      totalPaginas: Math.ceil((count || 0) / limite),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao listar acordos/condenações:', error);
    throw new Error(`Erro inesperado: ${erroMsg}`);
  }
}

/**
 * Busca acordo/condenação por ID
 */
export async function buscarAcordoCondenacaoPorId(
  id: number
): Promise<OperacaoAcordoResult> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('acordos_condenacoes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          sucesso: false,
          erro: 'Acordo/condenação não encontrado',
        };
      }
      console.error('Erro ao buscar acordo/condenação:', error);
      return {
        sucesso: false,
        erro: `Erro ao buscar acordo/condenação: ${error.message}`,
      };
    }

    return {
      sucesso: true,
      acordo: mapearAcordoCondenacao(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao buscar acordo/condenação:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Atualiza acordo/condenação
 */
export async function atualizarAcordoCondenacao(
  id: number,
  dados: AcordoCondenacaoAtualizacaoDados
): Promise<OperacaoAcordoResult> {
  const supabase = createServiceClient();

  try {
    const updateData: any = {};

    if (dados.valorTotal !== undefined) updateData.valor_total = dados.valorTotal;
    if (dados.dataVencimentoPrimeiraParcela !== undefined) {
      updateData.data_vencimento_primeira_parcela = dados.dataVencimentoPrimeiraParcela;
    }
    if (dados.percentualEscritorio !== undefined) {
      updateData.percentual_escritorio = dados.percentualEscritorio;
    }
    if (dados.honorariosSucumbenciaisTotal !== undefined) {
      updateData.honorarios_sucumbenciais_total = dados.honorariosSucumbenciaisTotal;
    }
    if (dados.status !== undefined) updateData.status = dados.status;

    const { data, error } = await supabase
      .from('acordos_condenacoes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar acordo/condenação:', error);
      return {
        sucesso: false,
        erro: `Erro ao atualizar acordo/condenação: ${error.message}`,
      };
    }

    return {
      sucesso: true,
      acordo: mapearAcordoCondenacao(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao atualizar acordo/condenação:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Deleta acordo/condenação
 */
export async function deletarAcordoCondenacao(
  id: number
): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createServiceClient();

  try {
    // Verificar se há parcelas pagas
    const { data: parcelas } = await supabase
      .from('parcelas')
      .select('status')
      .eq('acordo_condenacao_id', id);

    if (parcelas && parcelas.some((p: any) => ['recebida', 'paga'].includes(p.status))) {
      return {
        sucesso: false,
        erro: 'Não é possível deletar acordo com parcelas já pagas/recebidas',
      };
    }

    const { error } = await supabase
      .from('acordos_condenacoes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar acordo/condenação:', error);
      return {
        sucesso: false,
        erro: `Erro ao deletar acordo/condenação: ${error.message}`,
      };
    }

    return { sucesso: true };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao deletar acordo/condenação:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Mapeia dados do banco para o tipo AcordoCondenacao
 */
function mapearAcordoCondenacao(data: any): AcordoCondenacao {
  return {
    id: data.id,
    processoId: data.processo_id,
    tipo: data.tipo,
    direcao: data.direcao,
    valorTotal: parseFloat(data.valor_total),
    dataVencimentoPrimeiraParcela: data.data_vencimento_primeira_parcela,
    status: data.status,
    numeroParcelas: data.numero_parcelas,
    formaDistribuicao: data.forma_distribuicao,
    percentualEscritorio: data.percentual_escritorio ? parseFloat(data.percentual_escritorio) : null,
    percentualCliente: data.percentual_cliente ? parseFloat(data.percentual_cliente) : null,
    honorariosSucumbenciaisTotal: parseFloat(data.honorarios_sucumbenciais_total || 0),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
  };
}
