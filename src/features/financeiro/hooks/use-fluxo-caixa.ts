'use client';

/**
 * Hook para Fluxo de Caixa
 * Usa Server Actions de features/financeiro/actions/fluxo-caixa
 */

import { useState, useCallback, useEffect } from 'react';
import {
    actionObterFluxoCaixaUnificado,
    actionObterFluxoCaixaDiario,
    actionObterFluxoCaixaPorPeriodo,
    actionObterIndicadoresSaude,
    actionObterAlertasCaixa,
    actionObterResumoDashboard,
    actionListarContasBancarias,
    actionListarCentrosCusto,
    type FluxoCaixaFiltros,
    type IndicadoresSaude,
    type FluxoCaixaAlerta,
    type FluxoCaixaResumoDashboard,
    type ContaBancariaResumo,
    type CentroCustoResumo,
} from '../actions/fluxo-caixa';
import type { FluxoCaixaConsolidado, FluxoCaixaDiario, FluxoCaixaPeriodo } from '../domain/fluxo-caixa';

interface UseFluxoCaixaOptions {
    autoFetch?: boolean;
    filtros?: FluxoCaixaFiltros;
}

interface UseFluxoCaixaReturn {
    fluxoUnificado: FluxoCaixaConsolidado | null;
    fluxoDiario: FluxoCaixaDiario[];
    fluxoPorPeriodo: FluxoCaixaPeriodo[];
    indicadores: IndicadoresSaude | null;
    alertas: FluxoCaixaAlerta[];
    resumo: FluxoCaixaResumoDashboard | null;
    contasBancarias: ContaBancariaResumo[];
    centrosCusto: CentroCustoResumo[];
    isLoading: boolean;
    error: string | null;
    obterFluxoUnificado: (filtros: FluxoCaixaFiltros) => Promise<void>;
    obterFluxoDiario: (contaBancariaId: number, dataInicio: string, dataFim: string) => Promise<void>;
    obterFluxoPorPeriodo: (filtros: FluxoCaixaFiltros, agrupamento?: 'dia' | 'semana' | 'mes') => Promise<void>;
    obterIndicadores: (filtros: FluxoCaixaFiltros) => Promise<void>;
    obterAlertas: (filtros: FluxoCaixaFiltros) => Promise<void>;
    obterResumo: (filtros: FluxoCaixaFiltros) => Promise<void>;
    carregarContasBancarias: () => Promise<void>;
    carregarCentrosCusto: () => Promise<void>;
}

export function useFluxoCaixa(options?: UseFluxoCaixaOptions): UseFluxoCaixaReturn {
    const [fluxoUnificado, setFluxoUnificado] = useState<FluxoCaixaConsolidado | null>(null);
    const [fluxoDiario, setFluxoDiario] = useState<FluxoCaixaDiario[]>([]);
    const [fluxoPorPeriodo, setFluxoPorPeriodo] = useState<FluxoCaixaPeriodo[]>([]);
    const [indicadores, setIndicadores] = useState<IndicadoresSaude | null>(null);
    const [alertas, setAlertas] = useState<FluxoCaixaAlerta[]>([]);
    const [resumo, setResumo] = useState<FluxoCaixaResumoDashboard | null>(null);
    const [contasBancarias, setContasBancarias] = useState<ContaBancariaResumo[]>([]);
    const [centrosCusto, setCentrosCusto] = useState<CentroCustoResumo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const obterFluxoUnificado = useCallback(async (filtros: FluxoCaixaFiltros) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionObterFluxoCaixaUnificado(filtros);
            if (result.success && result.data) {
                setFluxoUnificado(result.data);
            } else {
                setError(result.error || 'Erro ao obter fluxo de caixa');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const obterFluxoDiario = useCallback(async (
        contaBancariaId: number,
        dataInicio: string,
        dataFim: string
    ) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionObterFluxoCaixaDiario(contaBancariaId, dataInicio, dataFim);
            if (result.success && result.data) {
                setFluxoDiario(result.data);
            } else {
                setError(result.error || 'Erro ao obter fluxo diário');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const obterFluxoPorPeriodo = useCallback(async (
        filtros: FluxoCaixaFiltros,
        agrupamento: 'dia' | 'semana' | 'mes' = 'mes'
    ) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionObterFluxoCaixaPorPeriodo(filtros, agrupamento);
            if (result.success && result.data) {
                setFluxoPorPeriodo(result.data);
            } else {
                setError(result.error || 'Erro ao obter fluxo por período');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const obterIndicadores = useCallback(async (filtros: FluxoCaixaFiltros) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionObterIndicadoresSaude(filtros);
            if (result.success && result.data) {
                setIndicadores(result.data);
            } else {
                setError(result.error || 'Erro ao obter indicadores');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const obterAlertas = useCallback(async (filtros: FluxoCaixaFiltros) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionObterAlertasCaixa(filtros);
            if (result.success && result.data) {
                setAlertas(result.data);
            } else {
                setError(result.error || 'Erro ao obter alertas');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const obterResumo = useCallback(async (filtros: FluxoCaixaFiltros) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionObterResumoDashboard(filtros);
            if (result.success && result.data) {
                setResumo(result.data);
            } else {
                setError(result.error || 'Erro ao obter resumo');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const carregarContasBancarias = useCallback(async () => {
        try {
            const result = await actionListarContasBancarias();
            if (result.success && result.data) {
                setContasBancarias(result.data);
            }
        } catch (err) {
            console.error('Erro ao carregar contas bancárias:', err);
        }
    }, []);

    const carregarCentrosCusto = useCallback(async () => {
        try {
            const result = await actionListarCentrosCusto();
            if (result.success && result.data) {
                setCentrosCusto(result.data);
            }
        } catch (err) {
            console.error('Erro ao carregar centros de custo:', err);
        }
    }, []);

    // Auto-fetch na montagem se configurado
    useEffect(() => {
        if (options?.autoFetch) {
            carregarContasBancarias();
            carregarCentrosCusto();
            if (options.filtros) {
                obterFluxoUnificado(options.filtros);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options?.autoFetch]);

    return {
        fluxoUnificado,
        fluxoDiario,
        fluxoPorPeriodo,
        indicadores,
        alertas,
        resumo,
        contasBancarias,
        centrosCusto,
        isLoading,
        error,
        obterFluxoUnificado,
        obterFluxoDiario,
        obterFluxoPorPeriodo,
        obterIndicadores,
        obterAlertas,
        obterResumo,
        carregarContasBancarias,
        carregarCentrosCusto,
    };
}
