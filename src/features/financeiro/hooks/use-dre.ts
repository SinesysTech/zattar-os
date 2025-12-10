'use client';

/**
 * Hook para DRE (Demonstração de Resultado do Exercício)
 * Usa Server Actions de features/financeiro/actions/dre
 */

import { useState, useCallback } from 'react';
import {
    actionGerarDRE,
    actionObterEvolucaoDRE,
    actionExportarDRECSV,
    actionExportarDREPDF,
    type GerarDREParams,
    type DREResult,
} from '../actions/dre';

interface UseDREOptions {
    autoFetch?: boolean;
}

interface UseDREReturn {
    dre: DREResult | null;
    evolucao: any[];
    isLoading: boolean;
    error: string | null;
    gerarDRE: (params: GerarDREParams) => Promise<void>;
    buscarEvolucao: (ano: number) => Promise<void>;
    exportarCSV: (params: GerarDREParams) => Promise<void>;
    exportarPDF: (params: GerarDREParams) => Promise<void>;
}

export function useDRE(options?: UseDREOptions): UseDREReturn {
    const [dre, setDRE] = useState<DREResult | null>(null);
    const [evolucao, setEvolucao] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const gerarDRE = useCallback(async (params: GerarDREParams) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionGerarDRE(params);
            if (result.success && result.data) {
                setDRE(result.data);
            } else {
                setError(result.error || 'Erro ao gerar DRE');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const buscarEvolucao = useCallback(async (ano: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionObterEvolucaoDRE(ano);
            if (result.success && result.data) {
                setEvolucao(result.data.evolucao || []);
            } else {
                setError(result.error || 'Erro ao buscar evolução');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const exportarCSV = useCallback(async (params: GerarDREParams) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionExportarDRECSV(params);
            if (result.success && result.data) {
                // Download do arquivo
                const blob = new Blob([result.data.content], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = result.data.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                setError(result.error || 'Erro ao exportar CSV');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const exportarPDF = useCallback(async (params: GerarDREParams) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionExportarDREPDF(params);
            if (result.success && result.data) {
                // Converter base64 para blob e fazer download
                const byteCharacters = atob(result.data.content);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = result.data.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                setError(result.error || 'Erro ao exportar PDF');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        dre,
        evolucao,
        isLoading,
        error,
        gerarDRE,
        buscarEvolucao,
        exportarCSV,
        exportarPDF,
    };
}
