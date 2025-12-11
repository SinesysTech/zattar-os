/**
 * Repository de Orçamentos
 * Camada de acesso a dados (Supabase)
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
    Orcamento,
    OrcamentoItem,
    OrcamentoComItens,
    OrcamentoComDetalhes,
    ListarOrcamentosParams,
    ListarOrcamentosResponse,
    CriarOrcamentoDTO,
    AtualizarOrcamentoDTO,
    CriarOrcamentoItemDTO,
    AnaliseOrcamentaria,
    AnaliseOrcamentariaItem,
    AlertaDesvio,
    ResumoOrcamentario
} from '../types/orcamentos';

type ContaContabilResumo = { id: number; codigo: string; nome: string; tipo?: string | null };
type CentroCustoResumo = { id: number; codigo: string; nome: string };

type OrcamentoItemRow = {
    id: number;
    orcamento_id: number;
    conta_contabil_id: number | null;
    centro_custo_id: number | null;
    descricao: string | null;
    valor_previsto: number | null;
    valor_realizado: number | null;
    observacoes: string | null;
    created_at: string;
    updated_at: string;
    contas_contabeis?: ContaContabilResumo;
    centros_custo?: CentroCustoResumo;
};

type OrcamentoRow = {
    id: number;
    nome: string;
    descricao: string | null;
    ano: number;
    periodo: Orcamento['periodo'];
    data_inicio: string;
    data_fim: string;
    status: Orcamento['status'];
    valor_total: number | null;
    observacoes: string | null;
    aprovado_por: string | null;
    aprovado_em: string | null;
    encerrado_por: string | null;
    encerrado_em: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    orcamento_itens?: OrcamentoItemRow[];
};

type OrcamentoRecordInput = {
    nome?: string;
    descricao?: string | null;
    ano?: number;
    periodo?: Orcamento['periodo'];
    data_inicio?: string;
    data_fim?: string;
    observacoes?: string | null;
};

type OrcamentoStatusUpdate = {
    status?: string;
    updated_at?: string;
    aprovado_por?: string;
    aprovado_em?: string;
    encerrado_por?: string;
    encerrado_em?: string;
    observacoes?: string;
};

// ============================================================================
// Mappers
// ============================================================================

function mapRecordToOrcamento(record: OrcamentoRow): Orcamento {
    return {
        id: record.id,
        nome: record.nome,
        descricao: record.descricao,
        ano: record.ano,
        periodo: record.periodo,
        dataInicio: record.data_inicio,
        dataFim: record.data_fim,
        status: record.status,
        valorTotal: record.valor_total || 0,
        observacoes: record.observacoes,
        aprovadoPor: record.aprovado_por,
        aprovadoEm: record.aprovado_em,
        encerradoPor: record.encerrado_por,
        encerradoEm: record.encerrado_em,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        createdBy: record.created_by
    };
}

function mapRecordToItem(record: any): OrcamentoItem {
    return {
        id: record.id,
        orcamentoId: record.orcamento_id,
        contaContabilId: record.conta_contabil_id,
        centroCustoId: record.centro_custo_id,
        descricao: record.descricao,
        valorPrevisto: record.valor_previsto || 0,
        valorRealizado: record.valor_realizado || 0,
        observacoes: record.observacoes,
        createdAt: record.created_at,
        updatedAt: record.updated_at
    };
}

function mapOrcamentoToRecord(dto: Partial<CriarOrcamentoDTO | AtualizarOrcamentoDTO>): Record<string, any> {
    const record: Record<string, any> = {};
    if ('nome' in dto && dto.nome !== undefined) record.nome = dto.nome;
    if ('descricao' in dto && dto.descricao !== undefined) record.descricao = dto.descricao;
    if ('ano' in dto && dto.ano !== undefined) record.ano = dto.ano;
    if ('periodo' in dto && dto.periodo !== undefined) record.periodo = dto.periodo;
    if ('dataInicio' in dto && dto.dataInicio !== undefined) record.data_inicio = dto.dataInicio;
    if ('dataFim' in dto && dto.dataFim !== undefined) record.data_fim = dto.dataFim;
    if ('observacoes' in dto && dto.observacoes !== undefined) record.observacoes = dto.observacoes;
    return record;
}

// ============================================================================
// Repository Implementation
// ============================================================================

export const OrcamentosRepository = {
    /**
     * Lista orçamentos com filtros e paginação
     */
    async listar(params: ListarOrcamentosParams): Promise<ListarOrcamentosResponse> {
        const supabase = createServiceClient();
        const limite = Math.min(params.limite || 50, 100);
        const pagina = params.pagina || 1;
        const offset = (pagina - 1) * limite;

        let query = supabase
            .from('orcamentos')
            .select('*, orcamento_itens(*)', { count: 'exact' });

        if (params.ano) {
            query = query.eq('ano', params.ano);
        }

        if (params.periodo) {
            query = query.eq('periodo', params.periodo);
        }

        if (params.status) {
            if (Array.isArray(params.status)) {
                query = query.in('status', params.status);
            } else {
                query = query.eq('status', params.status);
            }
        }

        if (params.busca) {
            query = query.ilike('nome', `%${params.busca}%`);
        }

        // Ordenação
        const ordenarPor = params.ordenarPor || 'created_at';
        const ordem = params.ordem === 'asc' ? true : false;
        query = query.order(ordenarPor === 'data_inicio' ? 'data_inicio' : ordenarPor, { ascending: ordem });

        // Paginação
        query = query.range(offset, offset + limite - 1);

        const { data, error, count } = await query;

        if (error) throw new Error(`Erro ao listar orçamentos: ${error.message}`);

        const items: OrcamentoComItens[] = (data || []).map(record => ({
            ...mapRecordToOrcamento(record),
            itens: (record.orcamento_itens || []).map(mapRecordToItem)
        }));

        return {
            items,
            total: count || 0,
            pagina,
            limite,
            totalPaginas: Math.ceil((count || 0) / limite)
        };
    },

    /**
     * Busca orçamento por ID com detalhes
     */
    async buscarPorId(id: number): Promise<OrcamentoComDetalhes | null> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('orcamentos')
            .select(`
                *,
                orcamento_itens(
                    *,
                    contas_contabeis:conta_contabil_id(id, codigo, nome, tipo),
                    centros_custo:centro_custo_id(id, codigo, nome)
                )
            `)
            .eq('id', id)
            .single();

        if (error || !data) return null;

        const itens = (data.orcamento_itens || []).map((item: any) => {
            const baseItem = mapRecordToItem(item);
            const desvio = baseItem.valorRealizado - baseItem.valorPrevisto;
            const desvioPercentual = baseItem.valorPrevisto > 0
                ? (desvio / baseItem.valorPrevisto) * 100
                : 0;

            return {
                ...baseItem,
                contaContabil: item.contas_contabeis,
                centroCusto: item.centros_custo,
                percentualExecutado: baseItem.valorPrevisto > 0
                    ? (baseItem.valorRealizado / baseItem.valorPrevisto) * 100
                    : 0,
                desvio,
                desvioPercentual
            };
        });

        return {
            ...mapRecordToOrcamento(data),
            itens
        };
    },

    /**
     * Cria novo orçamento
     */
    async criar(dto: CriarOrcamentoDTO, usuarioId: string): Promise<Orcamento> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('orcamentos')
            .insert({
                ...mapOrcamentoToRecord(dto),
                status: 'rascunho',
                valor_total: 0,
                created_by: usuarioId
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar orçamento: ${error.message}`);
        return mapRecordToOrcamento(data);
    },

    /**
     * Atualiza orçamento
     */
    async atualizar(id: number, dto: AtualizarOrcamentoDTO): Promise<Orcamento> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('orcamentos')
            .update({
                ...mapOrcamentoToRecord(dto),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Erro ao atualizar orçamento: ${error.message}`);
        return mapRecordToOrcamento(data);
    },

    /**
     * Exclui orçamento
     */
    async excluir(id: number): Promise<void> {
        const supabase = createServiceClient();

        // Excluir itens primeiro
        await supabase
            .from('orcamento_itens')
            .delete()
            .eq('orcamento_id', id);

        const { error } = await supabase
            .from('orcamentos')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao excluir orçamento: ${error.message}`);
    },

    /**
     * Atualiza status do orçamento
     */
    async atualizarStatus(
        id: number,
        status: string,
        usuarioId: string,
        observacoes?: string
    ): Promise<Orcamento> {
        const supabase = createServiceClient();

        const updates: Record<string, any> = {
            status,
            updated_at: new Date().toISOString()
        };

        if (status === 'aprovado') {
            updates.aprovado_por = usuarioId;
            updates.aprovado_em = new Date().toISOString();
        } else if (status === 'encerrado') {
            updates.encerrado_por = usuarioId;
            updates.encerrado_em = new Date().toISOString();
        }

        if (observacoes) {
            updates.observacoes = observacoes;
        }

        const { data, error } = await supabase
            .from('orcamentos')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Erro ao atualizar status: ${error.message}`);
        return mapRecordToOrcamento(data);
    },

    /**
     * Busca análise orçamentária
     */
    async buscarAnalise(orcamentoId: number): Promise<AnaliseOrcamentaria | null> {
        const orcamento = await this.buscarPorId(orcamentoId);
        if (!orcamento) return null;

        const itens: AnaliseOrcamentariaItem[] = orcamento.itens.map(item => {
            let status: 'dentro_meta' | 'acima_meta' | 'abaixo_meta' = 'dentro_meta';
            if (item.desvioPercentual > 10) status = 'acima_meta';
            else if (item.desvioPercentual < -10) status = 'abaixo_meta';

            return {
                id: item.id,
                descricao: item.descricao,
                contaContabil: item.contaContabil?.nome || '',
                centroCusto: item.centroCusto?.nome,
                valorPrevisto: item.valorPrevisto,
                valorRealizado: item.valorRealizado,
                desvio: item.desvio,
                desvioPercentual: item.desvioPercentual,
                status
            };
        });

        const totalPrevisto = itens.reduce((acc, i) => acc + i.valorPrevisto, 0);
        const totalRealizado = itens.reduce((acc, i) => acc + i.valorRealizado, 0);

        const resumo: ResumoOrcamentario = {
            totalPrevisto,
            totalRealizado,
            saldo: totalPrevisto - totalRealizado,
            percentualExecutado: totalPrevisto > 0 ? (totalRealizado / totalPrevisto) * 100 : 0,
            itensAcimaMeta: itens.filter(i => i.status === 'acima_meta').length,
            itensAbaixoMeta: itens.filter(i => i.status === 'abaixo_meta').length,
            itensDentroMeta: itens.filter(i => i.status === 'dentro_meta').length
        };

        const alertas: AlertaDesvio[] = itens
            .filter(i => Math.abs(i.desvioPercentual) > 10)
            .map(i => ({
                itemId: i.id,
                descricao: i.descricao,
                tipo: Math.abs(i.desvioPercentual) > 30 ? 'critico' as const :
                    Math.abs(i.desvioPercentual) > 20 ? 'alerta' as const : 'informativo' as const,
                mensagem: i.desvioPercentual > 0
                    ? `Item acima do orçado em ${i.desvioPercentual.toFixed(1)}%`
                    : `Item abaixo do orçado em ${Math.abs(i.desvioPercentual).toFixed(1)}%`,
                desvioPercentual: i.desvioPercentual
            }));

        return { itens, resumo, alertas };
    }
};
