/**
 * Repository de Lançamentos Financeiros
 * Camada de acesso a dados (Supabase)
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type { Lancamento, ListarLancamentosParams, ResumoVencimentos } from '../types/lancamentos';

// ============================================================================
// Repository Implementation
// ============================================================================

export const LancamentosRepository = {
    /**
     * Lista lançamentos financeiros com filtros
     */
    async listar(params: ListarLancamentosParams): Promise<Lancamento[]> {
        const supabase = createServiceClient();

        let query = supabase
            .from('lancamentos_financeiros')
            .select('*');

        if (params.tipo) {
            query = query.eq('tipo', params.tipo);
        }

        if (params.status) {
            if (Array.isArray(params.status)) {
                query = query.in('status', params.status);
            } else {
                query = query.eq('status', params.status);
            }
        }

        if (params.busca) {
            query = query.ilike('descricao', `%${params.busca}%`);
        }

        if (params.dataVencimentoInicio) {
            query = query.gte('data_vencimento', params.dataVencimentoInicio);
        }

        if (params.dataVencimentoFim) {
            query = query.lte('data_vencimento', params.dataVencimentoFim);
        }

        if (params.dataCompetenciaInicio) {
            query = query.gte('data_competencia', params.dataCompetenciaInicio);
        }

        if (params.dataCompetenciaFim) {
            query = query.lte('data_competencia', params.dataCompetenciaFim);
        }

        if (params.pessoaId) {
            query = query.eq('cliente_id', params.pessoaId);
        }

        if (params.contaContabilId) {
            query = query.eq('conta_contabil_id', params.contaContabilId);
        }

        if (params.centroCustoId) {
            query = query.eq('centro_custo_id', params.centroCustoId);
        }

        if (params.contaBancariaId) {
            query = query.eq('conta_bancaria_id', params.contaBancariaId);
        }

        if (params.origem) {
            query = query.eq('origem', params.origem);
        }


        if (params.recorrente !== undefined) {
            query = query.eq('recorrente', params.recorrente);
        }

        if (params.lancamentoOrigemId) {
            query = query.eq('lancamento_origem_id', params.lancamentoOrigemId);
        }

        // Paginação

        if (params.limite) {
            const offset = ((params.pagina || 1) - 1) * params.limite;
            query = query.range(offset, offset + params.limite - 1);
        }

        // Ordenação padrão
        query = query.order('data_vencimento', { ascending: true, nullsFirst: false });

        const { data, error } = await query;
        if (error) throw new Error(`Erro ao listar lançamentos: ${error.message}`);

        return (data || []).map(mapRecordToLancamento);
    },

    /**
     * Busca um lançamento por ID
     */
    async buscarPorId(id: number): Promise<Lancamento | null> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('lancamentos_financeiros')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return mapRecordToLancamento(data);
    },

    /**
     * Cria um novo lançamento
     */
    async criar(dados: Partial<Lancamento>): Promise<Lancamento> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('lancamentos_financeiros')
            .insert(mapLancamentoToRecord(dados))
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar lançamento: ${error.message}`);
        return mapRecordToLancamento(data);
    },

    /**
     * Atualiza um lançamento
     */
    async atualizar(id: number, dados: Partial<Lancamento>): Promise<Lancamento> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('lancamentos_financeiros')
            .update({
                ...mapLancamentoToRecord(dados),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Erro ao atualizar lançamento: ${error.message}`);
        return mapRecordToLancamento(data);
    },

    /**
     * Exclui um lançamento (soft delete ou hard delete)
     */
    async excluir(id: number): Promise<void> {
        const supabase = createServiceClient();
        const { error } = await supabase
            .from('lancamentos_financeiros')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao excluir lançamento: ${error.message}`);
    },

    /**
     * Busca lançamentos por parcela de acordo
     */
    async buscarPorParcela(parcelaId: number): Promise<Lancamento[]> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('lancamentos_financeiros')
            .select('*')
            .eq('parcela_id', parcelaId);

        if (error) throw new Error(`Erro ao buscar lançamentos por parcela: ${error.message}`);
        return (data || []).map(mapRecordToLancamento);
    },

    /**
     * Conta total de lançamentos com filtros
     */
    async contar(params: ListarLancamentosParams): Promise<number> {
        const supabase = createServiceClient();

        let query = supabase
            .from('lancamentos_financeiros')
            .select('id', { count: 'exact', head: true });

        if (params.tipo) {
            query = query.eq('tipo', params.tipo);
        }

        if (params.status) {
            if (Array.isArray(params.status)) {
                query = query.in('status', params.status);
            } else {
                query = query.eq('status', params.status);
            }
        }

        const { count, error } = await query;
        if (error) throw new Error(`Erro ao contar lançamentos: ${error.message}`);

        return count || 0;
    },

    /**
     * Busca resumo de vencimentos (tipado corretamente)
     */
    async buscarResumoVencimentos(tipo?: 'receita' | 'despesa'): Promise<ResumoVencimentos> {
        const supabase = createServiceClient();
        const hoje = new Date().toISOString().split('T')[0];
        const em7Dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const em30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        let baseQuery = supabase
            .from('lancamentos_financeiros')
            .select('id, valor, data_vencimento')
            .eq('status', 'pendente');

        if (tipo) {
            baseQuery = baseQuery.eq('tipo', tipo);
        }

        const { data, error } = await baseQuery;
        if (error) throw new Error(`Erro ao buscar resumo: ${error.message}`);

        const lancamentos = data || [];

        return {
            vencidas: {
                quantidade: lancamentos.filter(l => l.data_vencimento && l.data_vencimento < hoje).length,
                valorTotal: lancamentos.filter(l => l.data_vencimento && l.data_vencimento < hoje)
                    .reduce((acc, l) => acc + (l.valor || 0), 0)
            },
            vencendoHoje: {
                quantidade: lancamentos.filter(l => l.data_vencimento === hoje).length,
                valorTotal: lancamentos.filter(l => l.data_vencimento === hoje)
                    .reduce((acc, l) => acc + (l.valor || 0), 0)
            },
            vencendoEm7Dias: {
                quantidade: lancamentos.filter(l => l.data_vencimento && l.data_vencimento > hoje && l.data_vencimento <= em7Dias).length,
                valorTotal: lancamentos.filter(l => l.data_vencimento && l.data_vencimento > hoje && l.data_vencimento <= em7Dias)
                    .reduce((acc, l) => acc + (l.valor || 0), 0)
            },
            vencendoEm30Dias: {
                quantidade: lancamentos.filter(l => l.data_vencimento && l.data_vencimento > em7Dias && l.data_vencimento <= em30Dias).length,
                valorTotal: lancamentos.filter(l => l.data_vencimento && l.data_vencimento > em7Dias && l.data_vencimento <= em30Dias)
                    .reduce((acc, l) => acc + (l.valor || 0), 0)
            }
        };
    }
};

// ============================================================================
// Mappers
// ============================================================================

interface LancamentoRecord {
    id: number;
    tipo: string;
    descricao: string;
    valor: number;
    data_lancamento: string;
    data_vencimento: string | null;
    data_efetivacao: string | null;
    data_competencia: string;
    status: string;
    origem: string;
    forma_pagamento: string | null;
    conta_bancaria_id: number | null;
    conta_contabil_id: number;
    centro_custo_id: number | null;
    documento: string | null;
    observacoes: string | null;
    categoria: string | null;
    cliente_id: number | null;
    fornecedor_id: number | null;
    processo_id: number | null;
    contrato_id: number | null;
    parcela_id: number | null;
    acordo_condenacao_id: number | null;
    recorrente: boolean;
    frequencia_recorrencia: string | null;
    lancamento_origem_id: number | null;
    anexos: unknown[];
    created_at: string;
    updated_at: string;
    created_by: number | null;
}

function mapRecordToLancamento(record: LancamentoRecord): Lancamento {
    return {
        id: record.id,
        tipo: record.tipo as Lancamento['tipo'],
        descricao: record.descricao,
        valor: record.valor,
        dataLancamento: record.data_lancamento,
        dataVencimento: record.data_vencimento,
        dataEfetivacao: record.data_efetivacao,
        dataCompetencia: record.data_competencia,
        status: record.status as Lancamento['status'],
        origem: record.origem as Lancamento['origem'],
        formaPagamento: record.forma_pagamento as Lancamento['formaPagamento'],
        contaBancariaId: record.conta_bancaria_id,
        contaContabilId: record.conta_contabil_id,
        centroCustoId: record.centro_custo_id,
        documento: record.documento,
        observacoes: record.observacoes,
        categoria: record.categoria,
        clienteId: record.cliente_id,
        fornecedorId: record.fornecedor_id,
        processoId: record.processo_id,
        contratoId: record.contrato_id,
        parcelaId: record.parcela_id,
        acordoCondenacaoId: record.acordo_condenacao_id,
        recorrente: record.recorrente || false,
        frequenciaRecorrencia: record.frequencia_recorrencia as Lancamento['frequenciaRecorrencia'],
        lancamentoOrigemId: record.lancamento_origem_id,
        anexos: record.anexos as Lancamento['anexos'],
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        createdBy: record.created_by
    };
}

interface LancamentoRecordPartial {
    tipo?: string;
    descricao?: string;
    valor?: number;
    data_lancamento?: string;
    data_vencimento?: string | null;
    data_efetivacao?: string | null;
    data_competencia?: string;
    status?: string;
    origem?: string;
    forma_pagamento?: string | null;
    categoria?: string | null;
    documento?: string | null;
    observacoes?: string | null;
    recorrente?: boolean;
    frequencia_recorrencia?: string | null;
    lancamento_origem_id?: number | null;
    anexos?: unknown[];
    conta_bancaria_id?: number | null;
    conta_contabil_id?: number;
    centro_custo_id?: number | null;
    cliente_id?: number | null;
    processo_id?: number | null;
    contrato_id?: number | null;
    parcela_id?: number | null;
    acordo_condenacao_id?: number | null;
    created_by?: number | null;
}

function mapLancamentoToRecord(domain: Partial<Lancamento>): LancamentoRecordPartial {
    const record: LancamentoRecordPartial = {};

    if (domain.tipo !== undefined) record.tipo = domain.tipo;
    if (domain.descricao !== undefined) record.descricao = domain.descricao;
    if (domain.valor !== undefined) record.valor = domain.valor;
    if (domain.dataLancamento !== undefined) record.data_lancamento = domain.dataLancamento;
    if (domain.dataVencimento !== undefined) record.data_vencimento = domain.dataVencimento ?? null;
    if (domain.dataCompetencia !== undefined) record.data_competencia = domain.dataCompetencia;
    if (domain.dataEfetivacao !== undefined) record.data_efetivacao = domain.dataEfetivacao ?? null;
    if (domain.status !== undefined) record.status = domain.status;
    if (domain.origem !== undefined) record.origem = domain.origem;
    if (domain.formaPagamento !== undefined) record.forma_pagamento = domain.formaPagamento ?? null;
    if (domain.categoria !== undefined) record.categoria = domain.categoria ?? null;
    if (domain.documento !== undefined) record.documento = domain.documento ?? null;
    if (domain.observacoes !== undefined) record.observacoes = domain.observacoes ?? null;
    if (domain.recorrente !== undefined) record.recorrente = domain.recorrente;
    if (domain.frequenciaRecorrencia !== undefined) record.frequencia_recorrencia = domain.frequenciaRecorrencia ?? null;
    if (domain.lancamentoOrigemId !== undefined) record.lancamento_origem_id = domain.lancamentoOrigemId ?? null;
    if (domain.anexos !== undefined) record.anexos = domain.anexos;

    // Foreign Keys
    if (domain.contaBancariaId !== undefined) record.conta_bancaria_id = domain.contaBancariaId ?? null;
    if (domain.contaContabilId !== undefined && domain.contaContabilId !== null) {
        record.conta_contabil_id = domain.contaContabilId;
    }
    if (domain.centroCustoId !== undefined) record.centro_custo_id = domain.centroCustoId ?? null;
    if (domain.clienteId !== undefined) record.cliente_id = domain.clienteId ?? null;
    if (domain.processoId !== undefined) record.processo_id = domain.processoId ?? null;
    if (domain.contratoId !== undefined) record.contrato_id = domain.contratoId ?? null;
    if (domain.parcelaId !== undefined) record.parcela_id = domain.parcelaId ?? null;
    if (domain.acordoCondenacaoId !== undefined) record.acordo_condenacao_id = domain.acordoCondenacaoId ?? null;
    if (domain.createdBy !== undefined) record.created_by = domain.createdBy;

    return record;
}
