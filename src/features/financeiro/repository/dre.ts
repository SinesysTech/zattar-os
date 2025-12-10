/**
 * Repository de DRE (Demonstração de Resultado do Exercício)
 * Camada de acesso a dados (Supabase)
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { GerarDREDTO, EvolucaoDRE, CategoriaDRE } from '../types/dre';

// ============================================================================
// Repository Implementation
// ============================================================================

export const DRERepository = {
    /**
     * Busca lançamentos de receitas agrupados por categoria
     */
    async buscarReceitasPorCategoria(dataInicio: string, dataFim: string): Promise<CategoriaDRE[]> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('lancamentos_financeiros')
            .select('categoria, valor')
            .eq('tipo', 'receita')
            .eq('status', 'confirmado')
            .gte('data_competencia', dataInicio)
            .lte('data_competencia', dataFim);

        if (error) throw new Error(`Erro ao buscar receitas: ${error.message}`);

        // Agrupar por categoria
        const agrupado = (data || []).reduce((acc, item) => {
            const cat = item.categoria || 'Outras Receitas';
            if (!acc[cat]) acc[cat] = 0;
            acc[cat] += item.valor || 0;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(agrupado).map(([categoria, valor]) => ({
            categoria,
            valor,
            percentualReceita: 0 // Calculado depois
        }));
    },

    /**
     * Busca lançamentos de despesas agrupados por categoria
     */
    async buscarDespesasPorCategoria(dataInicio: string, dataFim: string): Promise<CategoriaDRE[]> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('lancamentos_financeiros')
            .select('categoria, valor')
            .eq('tipo', 'despesa')
            .eq('status', 'confirmado')
            .gte('data_competencia', dataInicio)
            .lte('data_competencia', dataFim);

        if (error) throw new Error(`Erro ao buscar despesas: ${error.message}`);

        // Agrupar por categoria
        const agrupado = (data || []).reduce((acc, item) => {
            const cat = item.categoria || 'Outras Despesas';
            if (!acc[cat]) acc[cat] = 0;
            acc[cat] += item.valor || 0;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(agrupado).map(([categoria, valor]) => ({
            categoria,
            valor,
            percentualReceita: 0 // Calculado depois
        }));
    },

    /**
     * Busca totais mensais para evolução anual
     */
    async buscarEvolucaoMensal(ano: number): Promise<EvolucaoDRE[]> {
        const supabase = createServiceClient();
        const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        const dataInicio = `${ano}-01-01`;
        const dataFim = `${ano}-12-31`;

        // Buscar todos os lançamentos do ano
        const { data: lancamentos, error } = await supabase
            .from('lancamentos_financeiros')
            .select('tipo, valor, data_competencia')
            .eq('status', 'confirmado')
            .gte('data_competencia', dataInicio)
            .lte('data_competencia', dataFim);

        if (error) throw new Error(`Erro ao buscar evolução: ${error.message}`);

        // Agrupar por mês
        const porMes: Record<number, { receitas: number; despesas: number }> = {};
        for (let i = 1; i <= 12; i++) {
            porMes[i] = { receitas: 0, despesas: 0 };
        }

        (lancamentos || []).forEach(l => {
            const mes = new Date(l.data_competencia).getMonth() + 1;
            if (l.tipo === 'receita') {
                porMes[mes].receitas += l.valor || 0;
            } else {
                porMes[mes].despesas += l.valor || 0;
            }
        });

        return Object.entries(porMes).map(([mes, dados]) => {
            const mesNum = parseInt(mes);
            const lucro = dados.receitas - dados.despesas;
            return {
                mes: mesNum,
                mesNome: mesesNomes[mesNum - 1],
                ano,
                receitaLiquida: dados.receitas,
                lucroOperacional: lucro,
                lucroLiquido: lucro,
                margemLiquida: dados.receitas > 0 ? (lucro / dados.receitas) * 100 : 0
            };
        });
    },

    /**
     * Busca totais por tipo para um período
     */
    async buscarTotaisPorTipo(dataInicio: string, dataFim: string): Promise<{
        receitaBruta: number;
        despesasOperacionais: number;
        custosDiretos: number;
    }> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('lancamentos_financeiros')
            .select('tipo, categoria, valor')
            .eq('status', 'confirmado')
            .gte('data_competencia', dataInicio)
            .lte('data_competencia', dataFim);

        if (error) throw new Error(`Erro ao buscar totais: ${error.message}`);

        let receitaBruta = 0;
        let despesasOperacionais = 0;
        let custosDiretos = 0;

        (data || []).forEach(l => {
            if (l.tipo === 'receita') {
                receitaBruta += l.valor || 0;
            } else {
                // Classificar despesas como custos diretos ou operacionais
                const categoriasCD = ['custo', 'cmv', 'custo direto', 'matéria-prima'];
                if (categoriasCD.some(c => (l.categoria || '').toLowerCase().includes(c))) {
                    custosDiretos += l.valor || 0;
                } else {
                    despesasOperacionais += l.valor || 0;
                }
            }
        });

        return { receitaBruta, despesasOperacionais, custosDiretos };
    }
};
