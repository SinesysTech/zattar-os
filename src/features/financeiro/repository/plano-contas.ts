/**
 * Repository do Plano de Contas
 * Camada de acesso a dados (Supabase)
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type {
    PlanoContas,
    PlanoContaComPai,
    CriarPlanoContaDTO,
    AtualizarPlanoContaDTO,
    PlanoContasFilters,
    TipoContaContabil,
    NaturezaConta,
    NivelConta
} from '../domain/plano-contas';

// ============================================================================
// Types
// ============================================================================

interface PlanoContaRecordComPai extends Record<string, unknown> {
    conta_pai?: {
        nome: string;
    } | null;
}

// ============================================================================
// Repository Implementation
// ============================================================================

export const PlanoContasRepository = {
    /**
     * Lista todas as contas do plano de contas
     */
    async listar(filters?: PlanoContasFilters): Promise<PlanoContas[]> {
        const supabase = createServiceClient();

        let query = supabase
            .from('plano_contas')
            .select('*')
            .order('codigo');

        if (filters?.tipoConta) {
            if (Array.isArray(filters.tipoConta)) {
                query = query.in('tipo_conta', filters.tipoConta);
            } else {
                query = query.eq('tipo_conta', filters.tipoConta);
            }
        }

        if (filters?.nivel) {
            if (Array.isArray(filters.nivel)) {
                query = query.in('nivel', filters.nivel);
            } else {
                query = query.eq('nivel', filters.nivel);
            }
        }

        if (filters?.ativo !== undefined) {
            query = query.eq('ativo', filters.ativo);
        }

        if (filters?.busca) {
            query = query.or(`nome.ilike.%${filters.busca}%,codigo.ilike.%${filters.busca}%`);
        }

        const { data, error } = await query;

        if (error) throw new Error(`Erro ao listar plano de contas: ${error.message}`);

        return (data || []).map(mapRecordToConta);
    },

    /**
     * Lista contas com nome da conta pai
     */
    async listarComPai(filters?: PlanoContasFilters): Promise<PlanoContaComPai[]> {
        const supabase = createServiceClient();

        let query = supabase
            .from('plano_contas')
            .select(`
                *,
                conta_pai:plano_contas!conta_pai_id (nome)
            `)
            .order('codigo');

        if (filters?.tipoConta) {
            if (Array.isArray(filters.tipoConta)) {
                query = query.in('tipo_conta', filters.tipoConta);
            } else {
                query = query.eq('tipo_conta', filters.tipoConta);
            }
        }

        if (filters?.nivel) {
            if (Array.isArray(filters.nivel)) {
                query = query.in('nivel', filters.nivel);
            } else {
                query = query.eq('nivel', filters.nivel);
            }
        }

        if (filters?.ativo !== undefined) {
            query = query.eq('ativo', filters.ativo);
        }

        if (filters?.busca) {
            query = query.or(`nome.ilike.%${filters.busca}%,codigo.ilike.%${filters.busca}%`);
        }

        const { data, error } = await query;

        if (error) throw new Error(`Erro ao listar plano de contas: ${error.message}`);

        return (data || []).map((record: PlanoContaRecordComPai) => ({
            ...mapRecordToConta(record),
            nomePai: record.conta_pai?.nome
        }));
    },

    /**
     * Busca uma conta por ID
     */
    async buscarPorId(id: number): Promise<PlanoContas | null> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('plano_contas')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;

        return mapRecordToConta(data);
    },

    /**
     * Busca uma conta por código
     */
    async buscarPorCodigo(codigo: string): Promise<PlanoContas | null> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('plano_contas')
            .select('*')
            .eq('codigo', codigo)
            .single();

        if (error) return null;

        return mapRecordToConta(data);
    },

    /**
     * Cria uma nova conta
     */
    async criar(dados: CriarPlanoContaDTO): Promise<PlanoContas> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('plano_contas')
            .insert({
                codigo: dados.codigo,
                nome: dados.nome,
                descricao: dados.descricao,
                tipo_conta: dados.tipoConta,
                natureza: dados.natureza,
                nivel: dados.nivel,
                conta_pai_id: dados.contaPaiId,
                ordem_exibicao: dados.ordemExibicao,
                ativo: dados.ativo ?? true
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar conta: ${error.message}`);

        return mapRecordToConta(data);
    },

    /**
     * Atualiza uma conta
     */
    async atualizar(id: number, dados: Partial<AtualizarPlanoContaDTO>): Promise<PlanoContas> {
        const supabase = createServiceClient();

        const record: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (dados.codigo !== undefined) record.codigo = dados.codigo;
        if (dados.nome !== undefined) record.nome = dados.nome;
        if (dados.descricao !== undefined) record.descricao = dados.descricao;
        if (dados.tipoConta !== undefined) record.tipo_conta = dados.tipoConta;
        if (dados.natureza !== undefined) record.natureza = dados.natureza;
        if (dados.nivel !== undefined) record.nivel = dados.nivel;
        if (dados.contaPaiId !== undefined) record.conta_pai_id = dados.contaPaiId;
        if (dados.ordemExibicao !== undefined) record.ordem_exibicao = dados.ordemExibicao;
        if (dados.ativo !== undefined) record.ativo = dados.ativo;

        const { data, error } = await supabase
            .from('plano_contas')
            .update(record)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Erro ao atualizar conta: ${error.message}`);

        return mapRecordToConta(data);
    },

    /**
     * Exclui uma conta
     */
    async excluir(id: number): Promise<void> {
        const supabase = createServiceClient();
        const { error } = await supabase
            .from('plano_contas')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao excluir conta: ${error.message}`);
    },

    /**
     * Verifica se uma conta tem filhas
     */
    async temFilhas(id: number): Promise<boolean> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('plano_contas')
            .select('id')
            .eq('conta_pai_id', id)
            .limit(1);

        if (error) throw new Error(`Erro ao verificar filhas: ${error.message}`);

        return (data?.length || 0) > 0;
    },

    /**
     * Verifica se uma conta tem lançamentos vinculados
     */
    async temLancamentos(id: number): Promise<boolean> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('lancamentos_financeiros')
            .select('id')
            .eq('conta_contabil_id', id)
            .limit(1);

        if (error) throw new Error(`Erro ao verificar lançamentos: ${error.message}`);

        return (data?.length || 0) > 0;
    },

    /**
     * Verifica se um código já existe
     */
    async codigoExiste(codigo: string, excludeId?: number): Promise<boolean> {
        const supabase = createServiceClient();

        let query = supabase
            .from('plano_contas')
            .select('id')
            .eq('codigo', codigo);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query;

        if (error) throw new Error(`Erro ao verificar código: ${error.message}`);

        return (data?.length || 0) > 0;
    },

    /**
     * Busca todas as contas filhas de uma conta
     */
    async buscarFilhas(contaPaiId: number): Promise<PlanoContas[]> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('plano_contas')
            .select('*')
            .eq('conta_pai_id', contaPaiId)
            .order('codigo');

        if (error) throw new Error(`Erro ao buscar filhas: ${error.message}`);

        return (data || []).map(mapRecordToConta);
    },

    /**
     * Lista apenas contas analíticas ativas de um tipo
     */
    async listarAnaliticasPorTipo(tipo: 'receita' | 'despesa'): Promise<PlanoContas[]> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('plano_contas')
            .select('*')
            .eq('tipo_conta', tipo)
            .eq('nivel', 'analitica')
            .eq('ativo', true)
            .order('codigo');

        if (error) throw new Error(`Erro ao listar contas analíticas: ${error.message}`);

        return (data || []).map(mapRecordToConta);
    },

    /**
     * Busca todos os códigos existentes
     */
    async listarCodigos(): Promise<string[]> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('plano_contas')
            .select('codigo')
            .order('codigo');

        if (error) throw new Error(`Erro ao listar códigos: ${error.message}`);

        return (data || []).map((c: { codigo: string }) => c.codigo);
    }
};

// ============================================================================
// Mappers
// ============================================================================

function mapRecordToConta(record: Record<string, unknown>): PlanoContas {
    return {
        id: record.id as number,
        codigo: record.codigo as string,
        nome: record.nome as string,
        descricao: record.descricao as string | null | undefined,
        tipo: record.tipo_conta as TipoContaContabil, // Alias para compatibilidade
        tipoConta: record.tipo_conta as TipoContaContabil,
        natureza: record.natureza as NaturezaConta,
        nivel: record.nivel as NivelConta,
        contaPaiId: record.conta_pai_id as number | null | undefined,
        ordemExibicao: record.ordem_exibicao as number | null | undefined,
        ativo: record.ativo as boolean
    };
}
