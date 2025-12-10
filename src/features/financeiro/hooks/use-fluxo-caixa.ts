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
} from '../actions/fluxo-caixa';

interface UseFluxoCaixaOptions {
    autoFetch?: boolean;
    filtros?: FluxoCaixaFiltros;
}

interface UseFluxoCaixaReturn {
    fluxoUnificado: any | null;
    fluxoDiario: any[];
    fluxoPorPeriodo: any[];
    indicadores: any | null;
    alertas: any[];
    resumo: any | null;
    contasBancarias: any[];
    centrosCusto: any[];
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
    const [fluxoUnificado, setFluxoUnificado] = useState<any | null>(null);
    const [fluxoDiario, setFluxoDiario] = useState<any[]>([]);
    const [fluxoPorPeriodo, setFluxoPorPeriodo] = useState<any[]>([]);
    const [indicadores, setIndicadores] = useState<any | null>(null);
    const [alertas, setAlertas] = useState<any[]>([]);
    const [resumo, setResumo] = useState<any | null>(null);
    const [contasBancarias, setContasBancarias] = useState<any[]>([]);
    const [centrosCusto, setCentrosCusto] = useState<any[]>([]);
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
    }, []);

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
