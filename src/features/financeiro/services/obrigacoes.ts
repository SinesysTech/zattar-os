import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { ObrigacaoJuridica, ParcelaObrigacao } from '../types/obrigacoes';
import { ListarLancamentosParams } from '../types/lancamentos';

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

    acordos_condenacoes: {
        id: number;
        tipo: 'acordo' | 'condenacao';
        direcao: 'recebimento' | 'pagamento';
        valor_total: number;
        numero_parcelas: number;
        status: string;
        processo_id: number | null;
    };

    lancamentos_financeiros: Array<{
        id: number;
        tipo: 'receita' | 'despesa';
        descricao: string;
        valor: number;
        data_lancamento: string;
        data_vencimento: string | null;
        data_efetivacao: string | null;
        status: string;
        conta_contabil_id: number | null;
    }>;
}

// ============================================================================
// Service Implementation
// ============================================================================

export const ObrigacoesService = {
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

        const parcelas = await ObrigacoesService.buscarParcelasPorAcordo(acordoId);

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
     * Usado para listagem unificada e verificação de consistência
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
        statusRepasse: (record.status_repasse as any) || 'nao_aplicavel',
        lancamentoId: lancamento?.id || null,
        // Mapeamento simplificado do lançamento vinculado
        lancamento: lancamento ? {
            id: lancamento.id,
            tipo: lancamento.tipo,
            descricao: lancamento.descricao,
            valor: lancamento.valor,
            dataLancamento: lancamento.data_lancamento,
            dataVencimento: lancamento.data_vencimento,
            dataEfetivacao: lancamento.data_efetivacao,
            status: mapStatusLancamento(lancamento.status),
            origem: 'acordo_judicial',
            formaPagamento: null,
            contaBancariaId: null,
            contaContabilId: lancamento.conta_contabil_id || 0,
            centroCustoId: null,
            documento: null,
            observacoes: null,
            categoria: null,
            clienteId: null,
            processoId: null,
            contratoId: null,
            parcelaId: record.id,
            recorrente: false,
            frequenciaRecorrencia: null,
            lancamentoOrigemId: null,
            anexos: [],
            createdAt: '',
            updatedAt: '',
            createdBy: null,
            contaBancariaId: null,
            centroCustoId: null,
            clienteId: null,
            processoId: null,
            documento: null,
            observacoes: null,
            categoria: null,
            contratoId: null,
            recorrente: false,
            frequenciaRecorrencia: null,
            lancamentoOrigemId: null,
            anexos: [],
            createdAt: '',
            updatedAt: '',
            createdBy: null,
            dataCompetencia: ''
        } as any : undefined, // Cast as any because incomplete mock
        declaracaoPrestacaoContasUrl: record.declaracao_prestacao_contas_url || null,
        comprovanteRepasseUrl: record.comprovante_repasse_url || null,
        dataRepasse: record.data_repasse || null
    };
}

function mapStatusLancamento(status: string): any {
    // Mapeamento simples
    if (status === 'confirmado' || status === 'pago' || status === 'recebido') return 'confirmado';
    if (status === 'cancelado') return 'cancelado';
    if (status === 'estornado') return 'estornado';
    return 'pendente';
}
