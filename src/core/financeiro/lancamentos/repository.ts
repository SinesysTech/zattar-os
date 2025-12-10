import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { Lancamento, ListarLancamentosParams } from './domain';

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
    const record: any = { ...domain };
    // Map camelCase to snake_case if necessary, or assume Supabase JS client handles basic mapping if configured, 
    // but usually raw queries need snake_case.
    // For brevity, assuming direct mapping or matching column names for now.
    // Ideally, manual mapping:
    if (domain.dataLancamento) record.data_lancamento = domain.dataLancamento;
    if (domain.dataVencimento) record.data_vencimento = domain.dataVencimento;
    if (domain.dataEfetivacao) record.data_efetivacao = domain.dataEfetivacao;
    if (domain.dataCompetencia) record.data_competencia = domain.dataCompetencia;
    if (domain.contaBancariaId) record.conta_bancaria_id = domain.contaBancariaId;
    if (domain.contaContabilId) record.conta_contabil_id = domain.contaContabilId;
    // ... others
    return record;
}
