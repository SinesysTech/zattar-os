/**
 * Repository de Conciliação Bancária
 * Camada de acesso a dados (Supabase)
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type {
    TransacaoImportada,
    TransacaoComConciliacao,
    ConciliacaoBancaria,
    ListarTransacoesImportadasParams,
    ListarTransacoesResponse,
    Conciliacao,
    BuscarLancamentosCandidatosParams
} from '../domain/conciliacao';
import type { Lancamento } from '../domain/lancamentos';

type ConciliacaoRow = {
    id: number;
    data_conciliacao: string;
    saldo_banco: number;
    saldo_sistema: number;
    diferenca: number;
};

type ConciliacaoBancariaRecord = {
    id: number;
    transacao_importada_id: number;
    lancamento_financeiro_id: number | null;
    data_conciliacao: string;
    status: ConciliacaoBancaria['status'];
    diferenca_valor: number | null;
    usuario_id: string;
    observacoes: string | null;
};

type LancamentoRecord = {
    id: number;
    tipo: Lancamento['tipo'];
    descricao: string;
    valor: number;
    data_lancamento: string;
    data_vencimento: string | null;
    data_efetivacao: string | null;
    data_competencia: string;
    status: Lancamento['status'];
    origem: Lancamento['origem'];
    forma_pagamento: Lancamento['formaPagamento'];
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
    recorrente: boolean | null;
    frequencia_recorrencia: Lancamento['frequenciaRecorrencia'];
    lancamento_origem_id: number | null;
    anexos: Lancamento['anexos'] | null;
    created_at: string;
    updated_at: string;
    created_by: number | null;
};

type TransacaoImportadaRecord = {
    id: number;
    conta_bancaria_id: number;
    data_transacao: string;
    descricao: string;
    valor: number;
    tipo_transacao: TransacaoImportada['tipoTransacao'];
    documento: string | null;
    hash_info: string;
    banco_original: string | null;
    categoria_original: string | null;
    conciliacao_bancaria?: ConciliacaoBancariaRecord[] | null;
    lancamentos_financeiros?: LancamentoRecord | null;
};

// ============================================================================
// Repository Implementation
// ============================================================================

export const ConciliacaoRepository = {
    /**
     * Lista conciliações bancárias
     */
    async listarConciliacoes(): Promise<Conciliacao[]> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('conciliacoes')
            .select('*')
            .order('data_conciliacao', { ascending: false });

        if (error) {
            console.warn('Tabela conciliacoes pode não existir', error);
            return [];
        }

        const registros = (data ?? []) as ConciliacaoRow[];

        return registros.map((c) => ({
            id: c.id,
            data_conciliacao: c.data_conciliacao,
            saldo_banco: c.saldo_banco,
            saldo_sistema: c.saldo_sistema,
            diferenca: c.diferenca
        }));
    },

    /**
     * Lista transações importadas com status de conciliação
     */
    async listarTransacoesImportadas(params: ListarTransacoesImportadasParams): Promise<ListarTransacoesResponse> {
        const supabase = createServiceClient();

        let query = supabase
            .from('transacoes_importadas')
            .select(`
                *,
                conciliacao_bancaria (*),
                lancamentos_financeiros (*)
            `, { count: 'exact' });

        if (params.contaBancariaId) {
            query = query.eq('conta_bancaria_id', params.contaBancariaId);
        }

        if (params.dataInicio) {
            query = query.gte('data_transacao', params.dataInicio);
        }

        if (params.dataFim) {
            query = query.lte('data_transacao', params.dataFim);
        }

        if (params.tipoTransacao) {
            query = query.eq('tipo_transacao', params.tipoTransacao);
        }

        if (params.busca) {
            query = query.ilike('descricao', `%${params.busca}%`);
        }

        // Paginação
        const pagina = params.pagina || 1;
        const limite = params.limite || 20;
        const offset = (pagina - 1) * limite;
        query = query.range(offset, offset + limite - 1);

        // Ordenação
        const ordenarPor = params.ordenarPor || 'data_transacao';
        const ordem = params.ordem || 'desc';
        query = query.order(ordenarPor, { ascending: ordem === 'asc' });

        const { data, count, error } = await query;

        if (error) {
            console.error('Erro ao listar transações:', error);
            throw new Error('Erro ao listar transações');
        }

        const registros = (data ?? []) as TransacaoImportadaRecord[];
        const items: TransacaoComConciliacao[] = registros.map(mapRecordToTransacao);

        // Calcular resumo
        const resumo = await this.calcularResumo(params.contaBancariaId);

        return {
            items,
            paginacao: {
                pagina,
                limite,
                total: count || 0,
                totalPaginas: Math.ceil((count || 0) / limite)
            },
            resumo
        };
    },

    /**
     * Busca uma transação por ID
     */
    async buscarTransacaoPorId(id: number): Promise<TransacaoComConciliacao | null> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('transacoes_importadas')
            .select(`
                *,
                conciliacao_bancaria (*),
                lancamentos_financeiros (*)
            `)
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return mapRecordToTransacao(data as TransacaoImportadaRecord);
    },

    /**
     * Cria uma nova transação importada
     */
    async criarTransacao(dados: Partial<TransacaoImportada>): Promise<TransacaoImportada> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('transacoes_importadas')
            .insert({
                conta_bancaria_id: dados.contaBancariaId,
                data_transacao: dados.dataTransacao,
                descricao: dados.descricao,
                valor: dados.valor,
                tipo_transacao: dados.tipoTransacao,
                documento: dados.documento,
                hash_info: dados.hashInfo,
                banco_original: dados.bancoOriginal,
                categoria_original: dados.categoriaOriginal
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar transação: ${error.message}`);
        return mapRecordToTransacaoSimples(data as TransacaoImportadaRecord);
    },

    /**
     * Cria múltiplas transações importadas
     */
    async criarTransacoesEmLote(transacoes: Partial<TransacaoImportada>[]): Promise<number> {
        const supabase = createServiceClient();

        const records = transacoes.map(t => ({
            conta_bancaria_id: t.contaBancariaId,
            data_transacao: t.dataTransacao,
            descricao: t.descricao,
            valor: t.valor,
            tipo_transacao: t.tipoTransacao,
            documento: t.documento,
            hash_info: t.hashInfo,
            banco_original: t.bancoOriginal,
            categoria_original: t.categoriaOriginal
        }));

        const { data, error } = await supabase
            .from('transacoes_importadas')
            .insert(records)
            .select('id');

        if (error) throw new Error(`Erro ao criar transações em lote: ${error.message}`);
        return data?.length || 0;
    },

    /**
     * Verifica se uma transação já existe (por hash)
     */
    async transacaoExiste(hashInfo: string): Promise<boolean> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('transacoes_importadas')
            .select('id')
            .eq('hash_info', hashInfo)
            .maybeSingle();

        if (error) throw new Error(`Erro ao verificar transação: ${error.message}`);
        return !!data;
    },

    /**
     * Cria registro de conciliação
     */
    async criarConciliacao(dados: {
        transacaoImportadaId: number;
        lancamentoFinanceiroId?: number | null;
        status: string;
        diferencaValor?: number;
        usuarioId: string;
        observacoes?: string;
    }): Promise<ConciliacaoBancaria> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('conciliacao_bancaria')
            .insert({
                transacao_importada_id: dados.transacaoImportadaId,
                lancamento_financeiro_id: dados.lancamentoFinanceiroId,
                status: dados.status,
                diferenca_valor: dados.diferencaValor || 0,
                usuario_id: dados.usuarioId,
                observacoes: dados.observacoes,
                data_conciliacao: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar conciliação: ${error.message}`);
        return mapRecordToConciliacao(data);
    },

    /**
     * Atualiza status de conciliação
     */
    async atualizarConciliacao(
        transacaoId: number,
        dados: Partial<ConciliacaoBancaria>
    ): Promise<void> {
        const supabase = createServiceClient();
        const { error } = await supabase
            .from('conciliacao_bancaria')
            .update({
                status: dados.status,
                lancamento_financeiro_id: dados.lancamentoFinanceiroId,
                diferenca_valor: dados.diferencaValor,
                observacoes: dados.observacoes,
                updated_at: new Date().toISOString()
            })
            .eq('transacao_importada_id', transacaoId);

        if (error) throw new Error(`Erro ao atualizar conciliação: ${error.message}`);
    },

    /**
     * Remove conciliação (desconciliar)
     */
    async removerConciliacao(transacaoId: number): Promise<void> {
        const supabase = createServiceClient();
        const { error } = await supabase
            .from('conciliacao_bancaria')
            .delete()
            .eq('transacao_importada_id', transacaoId);

        if (error) throw new Error(`Erro ao remover conciliação: ${error.message}`);
    },

    /**
     * Busca extratos bancários (para importação OFX/CSV)
     */
    async buscarExtratosBancarios() {
        // Placeholder - implementação depende do formato de importação
        return [];
    },

    /**
     * Calcula resumo de conciliação
     */
    async calcularResumo(contaBancariaId?: number) {
        const supabase = createServiceClient();

        let query = supabase
            .from('transacoes_importadas')
            .select(`
                id,
                conciliacao_bancaria (status)
            `);

        if (contaBancariaId) {
            query = query.eq('conta_bancaria_id', contaBancariaId);
        }

        const { data, error } = await query;

        if (error) {
            return {
                totalPendentes: 0,
                totalConciliadas: 0,
                totalDivergentes: 0,
                totalIgnoradas: 0
            };
        }

        const transacoes = data || [];

        return {
            totalPendentes: transacoes.filter(t => !t.conciliacao_bancaria?.length || t.conciliacao_bancaria[0]?.status === 'pendente').length,
            totalConciliadas: transacoes.filter(t => t.conciliacao_bancaria?.[0]?.status === 'conciliado').length,
            totalDivergentes: transacoes.filter(t => t.conciliacao_bancaria?.[0]?.status === 'divergente').length,
            totalIgnoradas: transacoes.filter(t => t.conciliacao_bancaria?.[0]?.status === 'ignorado').length
        };
    },

    /**
     * Busca lançamentos candidatos para conciliação
     */
    async buscarLancamentosCandidatos(params: BuscarLancamentosCandidatosParams): Promise<Lancamento[]> {
        const supabase = createServiceClient();

        let query = supabase
            .from('lancamentos_financeiros')
            .select('*')
            .eq('tipo', params.tipo)
            .eq('status', 'pendente');

        if (params.contaBancariaId) {
            query = query.eq('conta_bancaria_id', params.contaBancariaId);
        }

        if (params.valorMin !== undefined) {
            query = query.gte('valor', params.valorMin);
        }

        if (params.valorMax !== undefined) {
            query = query.lte('valor', params.valorMax);
        }

        if (params.dataInicio) {
            query = query.gte('data_vencimento', params.dataInicio);
        }

        if (params.dataFim) {
            query = query.lte('data_vencimento', params.dataFim);
        }

        const { data, error } = await query;
        if (error) throw new Error(`Erro ao buscar lançamentos candidatos: ${error.message}`);

        const registros = (data ?? []) as LancamentoRecord[];
        return registros.map(mapRecordToLancamento);
    }
};

// ============================================================================
// Mappers
// ============================================================================

function mapRecordToTransacao(record: TransacaoImportadaRecord): TransacaoComConciliacao {
    const conciliacao = record.conciliacao_bancaria?.[0];
    const lancamento = record.lancamentos_financeiros;

    return {
        id: record.id,
        contaBancariaId: record.conta_bancaria_id,
        dataTransacao: record.data_transacao,
        descricao: record.descricao,
        valor: record.valor,
        tipoTransacao: record.tipo_transacao,
        documento: record.documento,
        hashInfo: record.hash_info,
        bancoOriginal: record.banco_original ?? undefined,
        categoriaOriginal: record.categoria_original ?? undefined,
        statusConciliacao: conciliacao?.status || 'pendente',
        lancamentoVinculadoId: conciliacao?.lancamento_financeiro_id,
        lancamentoVinculado: lancamento ? mapRecordToLancamento(lancamento) : null,
        conciliacao: conciliacao ? mapRecordToConciliacao(conciliacao) : null
    };
}

function mapRecordToTransacaoSimples(record: TransacaoImportadaRecord): TransacaoImportada {
    return {
        id: record.id,
        contaBancariaId: record.conta_bancaria_id,
        dataTransacao: record.data_transacao,
        descricao: record.descricao,
        valor: record.valor,
        tipoTransacao: record.tipo_transacao,
        documento: record.documento,
        hashInfo: record.hash_info,
        bancoOriginal: record.banco_original ?? undefined,
        categoriaOriginal: record.categoria_original ?? undefined
    };
}

function mapRecordToConciliacao(record: ConciliacaoBancariaRecord): ConciliacaoBancaria {
    return {
        id: record.id,
        transacaoImportadaId: record.transacao_importada_id,
        lancamentoFinanceiroId: record.lancamento_financeiro_id,
        dataConciliacao: record.data_conciliacao,
        status: record.status,
        diferencaValor: record.diferenca_valor ?? 0,
        usuarioId: record.usuario_id,
        observacoes: record.observacoes
    };
}

function mapRecordToLancamento(record: LancamentoRecord): Lancamento {
    return {
        id: record.id,
        tipo: record.tipo,
        descricao: record.descricao,
        valor: record.valor,
        dataLancamento: record.data_lancamento,
        dataVencimento: record.data_vencimento,
        dataEfetivacao: record.data_efetivacao,
        dataCompetencia: record.data_competencia,
        status: record.status,
        origem: record.origem,
        formaPagamento: record.forma_pagamento,
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
        frequenciaRecorrencia: record.frequencia_recorrencia,
        lancamentoOrigemId: record.lancamento_origem_id,
        anexos: record.anexos || [],
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        createdBy: record.created_by
    };
}
