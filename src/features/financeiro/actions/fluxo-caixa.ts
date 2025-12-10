'use server';

/**
 * Server Actions para Fluxo de Caixa
 * Consolida funcionalidades de fluxo de caixa
 */

import { revalidatePath } from 'next/cache';
import { FluxoCaixaService } from '../services/fluxo-caixa';
import type { FiltroFluxoCaixa, FluxoCaixaConsolidado, FluxoCaixaDiario, FluxoCaixaPeriodo } from '../domain/fluxo-caixa';

// ============================================================================
// Types
// ============================================================================

export interface FluxoCaixaFiltros {
    dataInicio?: string;
    dataFim?: string;
    contaBancariaId?: number;
    centroCustoId?: number;
    incluirProjetado?: boolean;
}

export interface FluxoCaixaDashboard {
    saldoAtual: number;
    entradasMes: number;
    saidasMes: number;
    saldoProjetado: number;
    alertas: { tipo: 'perigo' | 'atencao' | 'ok'; mensagem: string }[];
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Obtém fluxo de caixa unificado (realizado + projetado)
 */
export async function actionObterFluxoCaixaUnificado(filtros: FluxoCaixaFiltros) {
    try {
        const filtro: FiltroFluxoCaixa = {
            dataInicio: filtros.dataInicio,
            dataFim: filtros.dataFim,
            contaBancariaId: filtros.contaBancariaId,
            centroCustoId: filtros.centroCustoId,
            incluirProjetado: filtros.incluirProjetado !== false,
        };

        const fluxo = await FluxoCaixaService.getFluxoCaixaUnificado(filtro);

        return { success: true, data: fluxo };
    } catch (error) {
        console.error('Erro ao obter fluxo de caixa:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Obtém fluxo de caixa diário
 */
export async function actionObterFluxoCaixaDiario(
    contaBancariaId: number,
    dataInicio: string,
    dataFim: string
) {
    try {
        if (!contaBancariaId) {
            return { success: false, error: 'Conta bancária é obrigatória' };
        }

        if (!dataInicio || !dataFim) {
            return { success: false, error: 'Período é obrigatório' };
        }

        const fluxoDiario = await FluxoCaixaService.getFluxoCaixaDiario(
            contaBancariaId,
            dataInicio,
            dataFim
        );

        return { success: true, data: fluxoDiario };
    } catch (error) {
        console.error('Erro ao obter fluxo diário:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Obtém fluxo de caixa agrupado por período
 */
export async function actionObterFluxoCaixaPorPeriodo(
    filtros: FluxoCaixaFiltros,
    agrupamento: 'dia' | 'semana' | 'mes' = 'mes'
) {
    try {
        const filtro: FiltroFluxoCaixa = {
            dataInicio: filtros.dataInicio,
            dataFim: filtros.dataFim,
            contaBancariaId: filtros.contaBancariaId,
            centroCustoId: filtros.centroCustoId,
            incluirProjetado: filtros.incluirProjetado !== false,
        };

        const fluxoPeriodo = await FluxoCaixaService.getFluxoCaixaPorPeriodo(filtro, agrupamento);

        return { success: true, data: fluxoPeriodo };
    } catch (error) {
        console.error('Erro ao obter fluxo por período:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Obtém indicadores de saúde financeira
 */
export async function actionObterIndicadoresSaude(filtros: FluxoCaixaFiltros) {
    try {
        const filtro: FiltroFluxoCaixa = {
            dataInicio: filtros.dataInicio,
            dataFim: filtros.dataFim,
            contaBancariaId: filtros.contaBancariaId,
            centroCustoId: filtros.centroCustoId,
        };

        const indicadores = await FluxoCaixaService.getIndicadoresSaude(filtro);

        return { success: true, data: indicadores };
    } catch (error) {
        console.error('Erro ao obter indicadores:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Obtém alertas de fluxo de caixa
 */
export async function actionObterAlertasCaixa(filtros: FluxoCaixaFiltros) {
    try {
        const filtro: FiltroFluxoCaixa = {
            dataInicio: filtros.dataInicio,
            dataFim: filtros.dataFim,
            contaBancariaId: filtros.contaBancariaId,
            centroCustoId: filtros.centroCustoId,
        };

        const alertas = await FluxoCaixaService.getAlertasCaixa(filtro);

        return { success: true, data: alertas };
    } catch (error) {
        console.error('Erro ao obter alertas:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Obtém resumo para dashboard de fluxo de caixa
 */
export async function actionObterResumoDashboard(filtros: FluxoCaixaFiltros) {
    try {
        const filtro: FiltroFluxoCaixa = {
            dataInicio: filtros.dataInicio,
            dataFim: filtros.dataFim,
            contaBancariaId: filtros.contaBancariaId,
            centroCustoId: filtros.centroCustoId,
        };

        const resumo = await FluxoCaixaService.getResumoDashboard(filtro);

        return { success: true, data: resumo };
    } catch (error) {
        console.error('Erro ao obter resumo:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Obtém saldo inicial de uma conta
 */
export async function actionObterSaldoInicial(contaBancariaId: number, data: string) {
    try {
        if (!contaBancariaId) {
            return { success: false, error: 'Conta bancária é obrigatória' };
        }

        if (!data) {
            return { success: false, error: 'Data é obrigatória' };
        }

        const saldo = await FluxoCaixaService.getSaldoInicial(contaBancariaId, data);

        return { success: true, data: { saldo } };
    } catch (error) {
        console.error('Erro ao obter saldo inicial:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Lista contas bancárias disponíveis
 */
export async function actionListarContasBancarias() {
    try {
        const contas = await FluxoCaixaService.listarContasBancarias();

        return { success: true, data: contas };
    } catch (error) {
        console.error('Erro ao listar contas:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Lista centros de custo disponíveis
 */
export async function actionListarCentrosCusto() {
    try {
        const centros = await FluxoCaixaService.listarCentrosCusto();

        return { success: true, data: centros };
    } catch (error) {
        console.error('Erro ao listar centros de custo:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}
