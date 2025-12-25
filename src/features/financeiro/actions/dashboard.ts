'use server';

/**
 * Server Actions para Dashboard Financeiro
 * Consolida as rotas REST de /api/financeiro/dashboard/*
 */

import { getDashboardFinanceiro, getFluxoCaixaProjetadoDashboard } from '../services/dashboard';

// ============================================================================
// Types
// ============================================================================

// Re-export types from services to avoid duplication
export type { DashboardFinanceiroData, FluxoCaixaProjetadoItem } from '../services/dashboard';

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Obtém dados do dashboard financeiro
 */
export async function actionObterDashboardFinanceiro(usuarioId?: string) {
    try {
        const data = await getDashboardFinanceiro(usuarioId || 'system');
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao obter dashboard:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Obtém fluxo de caixa projetado para dashboard
 */
export async function actionObterFluxoCaixaProjetado(meses: number = 6) {
    try {
        const mesLimit = Math.min(Math.max(meses, 1), 24); // 1 a 24 meses
        const data = await getFluxoCaixaProjetadoDashboard(mesLimit);
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao obter fluxo de caixa projetado:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Obtém resumo de contas a pagar/receber para o dashboard
 */
export async function actionObterResumoContas() {
    try {
        // Busca dados do dashboard que já contém resumo de contas
        const data = await getDashboardFinanceiro('system');

        return {
            success: true,
            data: {
                contasPagar: {
                    total: data.despesasPendentes || 0,
                    vencidas: data.valorVencido || 0,
                    quantidadeVencidas: data.contasVencidas || 0,
                },
                contasReceber: {
                    total: data.receitasPendentes || 0,
                    vencidas: 0, // TODO: Implementar
                    quantidadeVencidas: 0,
                },
            },
        };
    } catch (error) {
        console.error('Erro ao obter resumo de contas:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Obtém indicadores financeiros para o dashboard
 */
export async function actionObterIndicadoresFinanceiros() {
    try {
        const data = await getDashboardFinanceiro('system');

        // Calcular indicadores básicos
        const receitaTotal = data.receitasMes || 0;
        const despesaTotal = data.despesasMes || 0;
        const saldo = receitaTotal - despesaTotal;
        const margemOperacional = receitaTotal > 0 ? ((saldo / receitaTotal) * 100) : 0;

        return {
            success: true,
            data: {
                receitaMensal: receitaTotal,
                despesaMensal: despesaTotal,
                saldoMensal: saldo,
                margemOperacional: Math.round(margemOperacional * 100) / 100,
                inadimplencia: data.contasVencidas || 0,
                valorInadimplente: data.valorVencido || 0,
            },
        };
    } catch (error) {
        console.error('Erro ao obter indicadores:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Obtém evolução mensal para gráficos do dashboard
 */
export async function actionObterEvolucaoMensal(meses: number = 12) {
    try {
        const data = await getDashboardFinanceiro('system');

        return {
            success: true,
            data: {
                evolucao: data.evolucaoMensal || [],
                periodo: `Últimos ${meses} meses`,
            },
        };
    } catch (error) {
        console.error('Erro ao obter evolução mensal:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Obtém top categorias de despesas/receitas
 */
export async function actionObterTopCategorias(tipo: 'receita' | 'despesa' = 'despesa', limite: number = 5) {
    try {
        const data = await getDashboardFinanceiro('system');

        // Filtrar e limitar categorias
        const categorias = (data.topCategorias || [])
            .slice(0, limite);

        return {
            success: true,
            data: {
                categorias,
                tipo,
            },
        };
    } catch (error) {
        console.error('Erro ao obter top categorias:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}
