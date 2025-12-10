/**
 * Repository de Obrigações Jurídicas
 * Camada de acesso a dados (Supabase)
 */

import { createServiceClient } from '@/app/_lib/supabase/service';
import type {
    ObrigacaoJuridica,
    ParcelaObrigacao,
    StatusRepasse
} from '../types/obrigacoes';
import type { ListarLancamentosParams, Lancamento, StatusLancamento } from '../types/lancamentos';

// ============================================================================
// Types Internos (Mapeamento do Banco)
// ============================================================================

interface ParcelaRecord {
    id: number;
    acordo_condenacao_id: number;
    numero_parcela: number;
    valor_bruto_credito_principal: number;
    honorarios_contratuais: number | null;
    honorarios_sucumbenciais: number | null;
    valor_repasse_cliente: number | null;
    data_vencimento: string;
    data_efetivacao: string | null;
    status: 'pendente' | 'recebida' | 'paga' | 'atrasada' | 'cancelada';
    forma_pagamento: string | null;
    status_repasse: string | null;
    declaracao_prestacao_contas_url?: string | null;
    comprovante_repasse_url?: string | null;
    data_repasse?: string | null;
    created_at: string;
    updated_at: string;

    acordos_condenacoes?: {
        id: number;
        tipo: 'acordo' | 'condenacao';
        direcao: 'recebimento' | 'pagamento';
        valor_total: number;
        numero_parcelas: number;
        status: string;
        processo_id: number | null;
    };

    lancamentos_financeiros?: Array<{
        id: number;
        tipo: 'receita' | 'despesa';
        descricao: string;
        valor: number;
        data_lancamento: string;
        data_vencimento: string | null;
        data_efetivacao: string | null;
        status: string;
        conta_contabil_id: number | null;
        forma_pagamento: string | null;
    }>;
}

// ============================================================================
// Repository Implementation
// ============================================================================

export const ObrigacoesRepository = {
    /**
     * Busca parcelas de um acordo com os lançamentos vinculados
     */
    async buscarParcelasPorAcordo(acordoId: number): Promise<ParcelaObrigacao[]> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('parcelas')
            .select(`
                *,
                lancamentos_financeiros (*)
            `)
            .eq('acordo_condenacao_id', acordoId)
            .order('numero_parcela');

        if (error) throw new Error(`Erro ao buscar parcelas: ${error.message}`);

        return (data || []).map(mapRecordToParcela);
    },

    /**
     * Busca uma obrigação jurídica completa (Acordo/Condenação) e suas parcelas
     */
    async buscarObrigacaoJuridica(acordoId: number): Promise<ObrigacaoJuridica | null> {
        const supabase = createServiceClient();

        const { data: acordo, error } = await supabase
            .from('acordos_condenacoes')
            .select('*')
            .eq('id', acordoId)
            .single();

        if (error || !acordo) return null;

        const parcelas = await this.buscarParcelasPorAcordo(acordoId);

        return {
            id: acordo.id,
            tipo: acordo.tipo,
            direcao: acordo.direcao,
            processoId: acordo.processo_id,
            clienteId: null, // TODO: Buscar via processo_partes se necessário
            parteContrariaId: null,
            valorTotal: acordo.valor_total,
            saldoDevedor: 0, // TODO: Calcular
            percentualHonorarios: 30, // Default, deveria vir do contrato
            parcelas
        };
    },

    /**
     * Busca parcelas que possuem (ou deveriam possuir) lançamentos financeiros
     */
    async listarParcelasComLancamentos(params: ListarLancamentosParams): Promise<ParcelaObrigacao[]> {
        const supabase = createServiceClient();

        let query = supabase
            .from('parcelas')
            .select(`
                *,
                acordos_condenacoes!inner (
                    id, tipo, direcao, processo_id
                ),
                lancamentos_financeiros (*)
            `)
            .order('data_vencimento');

        if (params.dataVencimentoInicio) {
            query = query.gte('data_vencimento', params.dataVencimentoInicio);
        }
        if (params.dataVencimentoFim) {
            query = query.lte('data_vencimento', params.dataVencimentoFim);
        }

        const { data, error } = await query;
        if (error) throw new Error(`Erro ao listar parcelas: ${error.message}`);

        return (data || []).map(mapRecordToParcela);
    },

    /**
     * Detecta parcelas sem lançamento financeiro correspondente
     */
    async detectarInconsistencias(acordoId?: number): Promise<ParcelaObrigacao[]> {
        const supabase = createServiceClient();

        let query = supabase
            .from('parcelas')
            .select(`
                *,
                lancamentos_financeiros(id)
            `);

        // Regra: Parcela confirmada DEVE ter lançamento
        query = query.in('status', ['recebida', 'paga']);

        if (acordoId) {
            query = query.eq('acordo_condenacao_id', acordoId);
        }

        const { data, error } = await query;
        if (error) throw new Error(`Erro ao detectar inconsistências: ${error.message}`);

        // Filtrar em memória as que não tem lançamentos
        return (data || [])
            .filter(p => !p.lancamentos_financeiros || p.lancamentos_financeiros.length === 0)
            .map(p => mapRecordToParcela(p as any));
    },

    /**
     * Busca parcela por ID
     */
    async buscarParcelaPorId(parcelaId: number): Promise<ParcelaObrigacao | null> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('parcelas')
            .select(`
                *,
                lancamentos_financeiros (*)
            `)
            .eq('id', parcelaId)
            .single();

        if (error || !data) return null;
        return mapRecordToParcela(data);
    },

    /**
     * Atualiza uma parcela
     */
    async atualizarParcela(
        parcelaId: number,
        dados: Partial<{
            status: 'pendente' | 'recebida' | 'paga' | 'atrasada' | 'cancelada';
            statusRepasse: StatusRepasse;
            declaracaoPrestacaoContasUrl: string | null;
            comprovanteRepasseUrl: string | null;
            dataRepasse: string | null;
            formaPagamento: string | null;
        }>
    ): Promise<void> {
        const supabase = createServiceClient();

        const record: Record<string, any> = {
            updated_at: new Date().toISOString()
        };

        if (dados.status !== undefined) record.status = dados.status;
        if (dados.statusRepasse !== undefined) record.status_repasse = dados.statusRepasse;
        if (dados.declaracaoPrestacaoContasUrl !== undefined) record.declaracao_prestacao_contas_url = dados.declaracaoPrestacaoContasUrl;
        if (dados.comprovanteRepasseUrl !== undefined) record.comprovante_repasse_url = dados.comprovanteRepasseUrl;
        if (dados.dataRepasse !== undefined) record.data_repasse = dados.dataRepasse;
        if (dados.formaPagamento !== undefined) record.forma_pagamento = dados.formaPagamento;

        const { error } = await supabase
            .from('parcelas')
            .update(record)
            .eq('id', parcelaId);

        if (error) throw new Error(`Erro ao atualizar parcela: ${error.message}`);
    },

    /**
     * Lista repasses pendentes de transferência
     */
    async listarRepassesPendentes(): Promise<ParcelaObrigacao[]> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('parcelas')
            .select('*')
            .eq('status_repasse', 'pendente_transferencia')
            .gt('valor_repasse_cliente', 0)
            .order('data_vencimento');

        if (error) throw new Error(`Erro ao listar repasses: ${error.message}`);

        return (data || []).map(mapRecordToParcela);
    },

    /**
     * Calcula totais repassados por cliente
     */
    async calcularTotalRepassadoPorCliente(clienteId: number): Promise<number> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('parcelas')
            .select('valor_repasse_cliente, acordos_condenacoes!inner(cliente_id)')
            .eq('acordos_condenacoes.cliente_id', clienteId)
            .eq('status_repasse', 'repassado');

        if (error) throw new Error(`Erro ao calcular total repassado: ${error.message}`);

        return (data || []).reduce((acc: number, curr: any) => acc + (curr.valor_repasse_cliente || 0), 0);
    },

    /**
     * Lista parcelas por IDs de acordos
     */
    async listarParcelasPorAcordos(acordoIds: number[]): Promise<ParcelaObrigacao[]> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('parcelas')
            .select(`
                *,
                lancamentos_financeiros (*)
            `)
            .in('acordo_condenacao_id', acordoIds)
            .order('data_vencimento');

        if (error) throw new Error(`Erro ao listar parcelas: ${error.message}`);

        return (data || []).map(mapRecordToParcela);
    }
};

// ============================================================================
// Mappers
// ============================================================================

function mapRecordToParcela(record: ParcelaRecord): ParcelaObrigacao {
    const lancamento = record.lancamentos_financeiros?.[0];

    return {
        id: record.id,
        acordoId: record.acordo_condenacao_id,
        numeroParcela: record.numero_parcela,
        valor: record.valor_bruto_credito_principal + (record.honorarios_sucumbenciais || 0),
        valorBrutoCreditoPrincipal: record.valor_bruto_credito_principal,
        honorariosContratuais: record.honorarios_contratuais || 0,
        honorariosSucumbenciais: record.honorarios_sucumbenciais || 0,
        valorRepasseCliente: record.valor_repasse_cliente || 0,
        dataVencimento: record.data_vencimento,
        dataPagamento: record.data_efetivacao,
        status: record.status,
        statusRepasse: (record.status_repasse as StatusRepasse) || 'nao_aplicavel',
        lancamentoId: lancamento?.id || null,
        formaPagamento: record.forma_pagamento,
        lancamento: lancamento ? mapRecordToLancamento(lancamento) : undefined,
        declaracaoPrestacaoContasUrl: record.declaracao_prestacao_contas_url || null,
        comprovanteRepasseUrl: record.comprovante_repasse_url || null,
        dataRepasse: record.data_repasse || null
    };
}

function mapRecordToLancamento(record: any): Lancamento {
    return {
        id: record.id,
        tipo: record.tipo,
        descricao: record.descricao,
        valor: record.valor,
        dataLancamento: record.data_lancamento,
        dataVencimento: record.data_vencimento,
        dataEfetivacao: record.data_efetivacao,
        dataCompetencia: record.data_competencia || '',
        status: mapStatusLancamento(record.status),
        origem: 'acordo_judicial',
        formaPagamento: record.forma_pagamento,
        contaBancariaId: record.conta_bancaria_id || null,
        contaContabilId: record.conta_contabil_id || 0,
        centroCustoId: record.centro_custo_id || null,
        documento: record.documento || null,
        observacoes: record.observacoes || null,
        categoria: record.categoria || null,
        clienteId: record.cliente_id || null,
        processoId: record.processo_id || null,
        contratoId: record.contrato_id || null,
        parcelaId: record.parcela_id || null,
        acordoCondenacaoId: record.acordo_condenacao_id || null,
        recorrente: record.recorrente || false,
        frequenciaRecorrencia: record.frequencia_recorrencia || null,
        lancamentoOrigemId: record.lancamento_origem_id || null,
        anexos: record.anexos || [],
        createdAt: record.created_at || '',
        updatedAt: record.updated_at || '',
        createdBy: record.created_by || null
    };
}

function mapStatusLancamento(status: string): StatusLancamento {
    if (status === 'confirmado' || status === 'pago' || status === 'recebido') return 'confirmado';
    if (status === 'cancelado') return 'cancelado';
    if (status === 'estornado') return 'estornado';
    return 'pendente';
}
