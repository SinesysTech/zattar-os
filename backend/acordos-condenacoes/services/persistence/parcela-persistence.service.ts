// Serviço de persistência de parcelas
// Gerencia operações de CRUD na tabela parcelas

import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Status da parcela
 */
export type StatusParcela = 'pendente' | 'recebida' | 'paga' | 'atrasado';

/**
 * Forma de pagamento
 */
export type FormaPagamento = 'transferencia_direta' | 'deposito_judicial' | 'deposito_recursal';

/**
 * Status do repasse
 */
export type StatusRepasse = 'nao_aplicavel' | 'pendente_declaracao' | 'pendente_transferencia' | 'repassado';

/**
 * Dados para cadastro de parcela
 */
export interface ParcelaDados {
  acordoCondenacaoId: number;
  numeroParcela: number;
  valorBrutoCreditoPrincipal: number;
  honorariosSucumbenciais: number;
  dataVencimento: string; // ISO date string (YYYY-MM-DD)
  formaPagamento: FormaPagamento;
  dadosPagamento?: Record<string, unknown>; // JSONB
  editadoManualmente?: boolean;
}

/**
 * Dados para atualização de parcela
 */
export interface ParcelaAtualizacaoDados {
  valorBrutoCreditoPrincipal?: number;
  honorariosSucumbenciais?: number;
  dataVencimento?: string;
  formaPagamento?: FormaPagamento;
  dadosPagamento?: Record<string, unknown>;
  status?: StatusParcela;
  dataEfetivacao?: string | null;
  editadoManualmente?: boolean;
}

/**
 * Dados retornados do banco
 */
export interface Parcela {
  id: number;
  acordoCondenacaoId: number;
  numeroParcela: number;
  valorBrutoCreditoPrincipal: number;
  honorariosSucumbenciais: number;
  honorariosContratuais: number; // Calculado automaticamente
  dataVencimento: string;
  status: StatusParcela;
  dataEfetivacao: string | null;
  formaPagamento: FormaPagamento;
  dadosPagamento: Record<string, unknown> | null;
  editadoManualmente: boolean;
  valorRepasseCliente: number | null;
  statusRepasse: StatusRepasse;
  arquivoDeclaracaoPrestacaoContas: string | null;
  dataDeclaracaoAnexada: string | null;
  arquivoComprovanteRepasse: string | null;
  dataRepasse: string | null;
  usuarioRepasseId: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Resultado de operação
 */
export interface OperacaoParcelaResult {
  sucesso: boolean;
  parcela?: Parcela;
  erro?: string;
}

/**
 * Resultado de operação múltipla
 */
export interface OperacaoParcelasResult {
  sucesso: boolean;
  parcelas?: Parcela[];
  erro?: string;
}

/**
 * Cria uma nova parcela
 */
export async function criarParcela(
  dados: ParcelaDados
): Promise<OperacaoParcelaResult> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('parcelas')
      .insert({
        acordo_condenacao_id: dados.acordoCondenacaoId,
        numero_parcela: dados.numeroParcela,
        valor_bruto_credito_principal: dados.valorBrutoCreditoPrincipal,
        honorarios_sucumbenciais: dados.honorariosSucumbenciais || 0,
        data_vencimento: dados.dataVencimento,
        forma_pagamento: dados.formaPagamento,
        dados_pagamento: dados.dadosPagamento || null,
        editado_manualmente: dados.editadoManualmente || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar parcela:', error);
      return {
        sucesso: false,
        erro: `Erro ao criar parcela: ${error.message}`,
      };
    }

    return {
      sucesso: true,
      parcela: mapearParcela(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao criar parcela:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Cria múltiplas parcelas de uma vez (bulk insert)
 */
export async function criarParcelas(
  parcelas: ParcelaDados[]
): Promise<OperacaoParcelasResult> {
  const supabase = createServiceClient();

  try {
    const parcelasInsert = parcelas.map((p) => ({
      acordo_condenacao_id: p.acordoCondenacaoId,
      numero_parcela: p.numeroParcela,
      valor_bruto_credito_principal: p.valorBrutoCreditoPrincipal,
      honorarios_sucumbenciais: p.honorariosSucumbenciais || 0,
      data_vencimento: p.dataVencimento,
      forma_pagamento: p.formaPagamento,
      dados_pagamento: p.dadosPagamento || null,
      editado_manualmente: p.editadoManualmente || false,
    }));

    const { data, error } = await supabase
      .from('parcelas')
      .insert(parcelasInsert)
      .select();

    if (error) {
      console.error('Erro ao criar parcelas:', error);
      return {
        sucesso: false,
        erro: `Erro ao criar parcelas: ${error.message}`,
      };
    }

    return {
      sucesso: true,
      parcelas: (data || []).map(mapearParcela),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao criar parcelas:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Lista parcelas de um acordo/condenação
 */
export async function listarParcelasDoAcordo(
  acordoCondenacaoId: number
): Promise<Parcela[]> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('parcelas')
      .select('*')
      .eq('acordo_condenacao_id', acordoCondenacaoId)
      .order('numero_parcela', { ascending: true });

    if (error) {
      console.error('Erro ao listar parcelas:', error);
      throw new Error(`Erro ao listar parcelas: ${error.message}`);
    }

    return (data || []).map(mapearParcela);
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao listar parcelas:', error);
    throw new Error(`Erro inesperado: ${erroMsg}`);
  }
}

/**
 * Busca parcela por ID
 */
export async function buscarParcelaPorId(
  id: number
): Promise<OperacaoParcelaResult> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('parcelas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          sucesso: false,
          erro: 'Parcela não encontrada',
        };
      }
      console.error('Erro ao buscar parcela:', error);
      return {
        sucesso: false,
        erro: `Erro ao buscar parcela: ${error.message}`,
      };
    }

    return {
      sucesso: true,
      parcela: mapearParcela(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao buscar parcela:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Atualiza parcela
 */
export async function atualizarParcela(
  id: number,
  dados: ParcelaAtualizacaoDados
): Promise<OperacaoParcelaResult> {
  const supabase = createServiceClient();

  try {
    const updateData: Record<string, unknown> = {};

    if (dados.valorBrutoCreditoPrincipal !== undefined) {
      updateData.valor_bruto_credito_principal = dados.valorBrutoCreditoPrincipal;
    }
    if (dados.honorariosSucumbenciais !== undefined) {
      updateData.honorarios_sucumbenciais = dados.honorariosSucumbenciais;
    }
    if (dados.dataVencimento !== undefined) {
      updateData.data_vencimento = dados.dataVencimento;
    }
    if (dados.formaPagamento !== undefined) {
      updateData.forma_pagamento = dados.formaPagamento;
    }
    if (dados.dadosPagamento !== undefined) {
      updateData.dados_pagamento = dados.dadosPagamento;
    }
    if (dados.status !== undefined) {
      updateData.status = dados.status;
    }
    if (dados.dataEfetivacao !== undefined) {
      updateData.data_efetivacao = dados.dataEfetivacao;
    }
    if (dados.editadoManualmente !== undefined) {
      updateData.editado_manualmente = dados.editadoManualmente;
    }

    const { data, error } = await supabase
      .from('parcelas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar parcela:', error);
      return {
        sucesso: false,
        erro: `Erro ao atualizar parcela: ${error.message}`,
      };
    }

    return {
      sucesso: true,
      parcela: mapearParcela(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao atualizar parcela:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Deleta parcela
 */
export async function deletarParcela(
  id: number
): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createServiceClient();

  try {
    const { error } = await supabase
      .from('parcelas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar parcela:', error);
      return {
        sucesso: false,
        erro: `Erro ao deletar parcela: ${error.message}`,
      };
    }

    return { sucesso: true };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao deletar parcela:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Deleta todas as parcelas de um acordo (bulk delete)
 */
export async function deletarParcelasDoAcordo(
  acordoCondenacaoId: number
): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createServiceClient();

  try {
    const { error } = await supabase
      .from('parcelas')
      .delete()
      .eq('acordo_condenacao_id', acordoCondenacaoId);

    if (error) {
      console.error('Erro ao deletar parcelas:', error);
      return {
        sucesso: false,
        erro: `Erro ao deletar parcelas: ${error.message}`,
      };
    }

    return { sucesso: true };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao deletar parcelas:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Busca parcelas não editadas manualmente de um acordo
 */
export async function buscarParcelasNaoEditadas(
  acordoCondenacaoId: number
): Promise<Parcela[]> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('parcelas')
      .select('*')
      .eq('acordo_condenacao_id', acordoCondenacaoId)
      .eq('editado_manualmente', false)
      .order('numero_parcela', { ascending: true });

    if (error) {
      console.error('Erro ao buscar parcelas não editadas:', error);
      throw new Error(`Erro ao buscar parcelas não editadas: ${error.message}`);
    }

    return (data || []).map(mapearParcela);
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao buscar parcelas não editadas:', error);
    throw new Error(`Erro inesperado: ${erroMsg}`);
  }
}

// Raw data from Supabase
interface ParcelaDb {
    id: number;
    acordo_condenacao_id: number;
    numero_parcela: number;
    valor_bruto_credito_principal: number;
    honorarios_sucumbenciais: number;
    honorarios_contratuais: number;
    data_vencimento: string;
    status: StatusParcela;
    data_efetivacao: string | null;
    forma_pagamento: FormaPagamento;
    dados_pagamento: Record<string, unknown> | null;
    editado_manualmente: boolean;
    valor_repasse_cliente: number | null;
    status_repasse: StatusRepasse;
    arquivo_declaracao_prestacao_contas: string | null;
    data_declaracao_anexada: string | null;
    arquivo_comprovante_repasse: string | null;
    data_repasse: string | null;
    usuario_repasse_id: number | null;
    created_at: string;
    updated_at: string;
}

/**
 * Mapeia dados do banco para o tipo Parcela
 */
function mapearParcela(data: ParcelaDb): Parcela {
  return {
    id: data.id,
    acordoCondenacaoId: data.acordo_condenacao_id,
    numeroParcela: data.numero_parcela,
    valorBrutoCreditoPrincipal: data.valor_bruto_credito_principal,
    honorariosSucumbenciais: data.honorarios_sucumbenciais || 0,
    honorariosContratuais: data.honorarios_contratuais || 0,
    dataVencimento: data.data_vencimento,
    status: data.status,
    dataEfetivacao: data.data_efetivacao,
    formaPagamento: data.forma_pagamento,
    dadosPagamento: data.dados_pagamento,
    editadoManualmente: data.editado_manualmente || false,
    valorRepasseCliente: data.valor_repasse_cliente ?? null,
    statusRepasse: data.status_repasse,
    arquivoDeclaracaoPrestacaoContas: data.arquivo_declaracao_prestacao_contas,
    dataDeclaracaoAnexada: data.data_declaracao_anexada,
    arquivoComprovanteRepasse: data.arquivo_comprovante_repasse,
    dataRepasse: data.data_repasse,
    usuarioRepasseId: data.usuario_repasse_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
