import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { Lancamento, ListarLancamentosParams } from '../types/lancamentos';

export const LancamentosService = {
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

        if (params.busca) {
            query = query.ilike('descricao', `%${params.busca}%`);
        }

        if (params.dataVencimentoInicio) {
            query = query.gte('data_vencimento', params.dataVencimentoInicio);
        }

        if (params.dataVencimentoFim) {
            query = query.lte('data_vencimento', params.dataVencimentoFim);
        }

        const { data, error } = await query;
        if (error) throw new Error(`Erro ao listar lançamentos: ${error.message}`);

        return (data || []).map(mapRecordToLancamento);
    },

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

    async atualizar(id: number, dados: Partial<Lancamento>): Promise<Lancamento> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('lancamentos_financeiros')
            .update(mapLancamentoToRecord(dados))
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Erro ao atualizar lançamento: ${error.message}`);
        return mapRecordToLancamento(data);
    }
};

// Helpers (Simplificados)
function mapRecordToLancamento(record: any): Lancamento {
    return {
        ...record,
        dataLancamento: record.data_lancamento,
        dataVencimento: record.data_vencimento,
        dataEfetivacao: record.data_efetivacao,
        dataCompetencia: record.data_competencia,
        contaBancariaId: record.conta_bancaria_id,
        contaContabilId: record.conta_contabil_id,
        centroCustoId: record.centro_custo_id,
        clienteId: record.cliente_id,
        processoId: record.processo_id || null, // Se existir coluna direta ou via join
        parcelaId: record.parcela_id
    };
}

function mapLancamentoToRecord(domain: Partial<Lancamento>): any {
    const record: any = {};

    // Mapeamento explícito de camelCase para snake_case
    if (domain.descricao !== undefined) record.descricao = domain.descricao;
    if (domain.valor !== undefined) record.valor = domain.valor;
    if (domain.dataLancamento !== undefined) record.data_lancamento = domain.dataLancamento;
    if (domain.dataVencimento !== undefined) record.data_vencimento = domain.dataVencimento;
    if (domain.dataCompetencia !== undefined) record.data_competencia = domain.dataCompetencia;
    if (domain.dataEfetivacao !== undefined) record.data_efetivacao = domain.dataEfetivacao;
    if (domain.status !== undefined) record.status = domain.status;
    if (domain.tipo !== undefined) record.tipo = domain.tipo;
    if (domain.categoria !== undefined) record.categoria = domain.categoria;
    if (domain.formaPagamento !== undefined) record.forma_pagamento = domain.formaPagamento;
    if (domain.origem !== undefined) record.origem = domain.origem;
    if (domain.documento !== undefined) record.documento = domain.documento;
    if (domain.observacoes !== undefined) record.observacoes = domain.observacoes;
    if (domain.recorrente !== undefined) record.recorrente = domain.recorrente;
    if (domain.frequenciaRecorrencia !== undefined) record.frequencia_recorrencia = domain.frequenciaRecorrencia;

    // Foreign Keys
    if (domain.contaBancariaId !== undefined) record.conta_bancaria_id = domain.contaBancariaId;
    if (domain.contaContabilId !== undefined) record.conta_contabil_id = domain.contaContabilId;
    if (domain.centroCustoId !== undefined) record.centro_custo_id = domain.centroCustoId;
    if (domain.clienteId !== undefined) record.cliente_id = domain.clienteId;
    if (domain.parcelaId !== undefined) record.parcela_id = domain.parcelaId;
    if (domain.acordoCondenacaoId !== undefined) record.acordo_condenacao_id = domain.acordoCondenacaoId;

    return record;
}
