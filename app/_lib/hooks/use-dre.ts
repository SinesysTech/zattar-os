'use client';

/**
 * Hooks para buscar e gerenciar DRE (Demonstração de Resultado do Exercício)
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  DRE,
  ResumoDRE,
  EvolucaoDRE,
  PeriodoDRE,
  VariacoesDRE,
} from '@/backend/types/financeiro/dre.types';

// ============================================================================
// Types
// ============================================================================

interface UseDREParams {
  dataInicio: string;
  dataFim: string;
  tipo?: PeriodoDRE;
  incluirComparativo?: boolean;
  incluirOrcado?: boolean;
}

interface UseDREResult {
  dre: DRE | null;
  comparativo: {
    periodoAnterior: DRE | null;
    orcado: ResumoDRE | null;
    variacoes: VariacoesDRE | null;
    variacoesOrcado: VariacoesDRE | null;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseEvolucaoDREParams {
  ano: number;
}

interface UseEvolucaoDREResult {
  evolucao: EvolucaoDRE[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface DREApiResponse {
  success: boolean;
  data: {
    dre: DRE;
    comparativo?: {
      periodoAnterior: DRE | null;
      orcado: ResumoDRE | null;
      variacoes: VariacoesDRE | null;
      variacoesOrcado: VariacoesDRE | null;
    };
    geradoEm: string;
  };
  error?: string;
}

interface EvolucaoApiResponse {
  success: boolean;
  data: {
    evolucao: EvolucaoDRE[];
    ano: number;
    geradoEm: string;
  };
  error?: string;
}

// ============================================================================
// Hook Principal - DRE
// ============================================================================

/**
 * Hook para buscar DRE com comparativos opcionais
 */
export const useDRE = (params: UseDREParams): UseDREResult => {
  const [dre, setDRE] = useState<DRE | null>(null);
  const [comparativo, setComparativo] = useState<UseDREResult['comparativo']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarDRE = useCallback(async () => {
    // Não buscar se as datas não estão definidas
    if (!params.dataInicio || !params.dataFim) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Construir query string
      const searchParams = new URLSearchParams();
      searchParams.set('dataInicio', params.dataInicio);
      searchParams.set('dataFim', params.dataFim);

      if (params.tipo) {
        searchParams.set('tipo', params.tipo);
      }
      if (params.incluirComparativo) {
        searchParams.set('incluirComparativo', 'true');
      }
      if (params.incluirOrcado) {
        searchParams.set('incluirOrcado', 'true');
      }

      const response = await fetch(`/api/financeiro/dre?${searchParams.toString()}`);
      const data: DREApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao buscar DRE');
      }

      setDRE(data.data.dre);
      setComparativo(data.data.comparativo || null);
    } catch (err) {
      console.error('Erro ao buscar DRE:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar DRE');
      setDRE(null);
      setComparativo(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.dataInicio, params.dataFim, params.tipo, params.incluirComparativo, params.incluirOrcado]);

  useEffect(() => {
    if (params.dataInicio && params.dataFim) {
      buscarDRE();
    }
  }, [buscarDRE, params.dataInicio, params.dataFim]);

  return {
    dre,
    comparativo,
    isLoading,
    error,
    refetch: buscarDRE,
  };
};

// ============================================================================
// Hook - Evolução DRE
// ============================================================================

/**
 * Hook para buscar evolução mensal do DRE
 */
export const useEvolucaoDRE = (params: UseEvolucaoDREParams): UseEvolucaoDREResult => {
  const [evolucao, setEvolucao] = useState<EvolucaoDRE[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarEvolucao = useCallback(async () => {
    if (!params.ano) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/financeiro/dre/evolucao?ano=${params.ano}`);
      const data: EvolucaoApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao buscar evolução DRE');
      }

      setEvolucao(data.data.evolucao || []);
    } catch (err) {
      console.error('Erro ao buscar evolução DRE:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar evolução DRE');
      setEvolucao([]);
    } finally {
      setIsLoading(false);
    }
  }, [params.ano]);

  useEffect(() => {
    if (params.ano) {
      buscarEvolucao();
    }
  }, [buscarEvolucao, params.ano]);

  return {
    evolucao,
    isLoading,
    error,
    refetch: buscarEvolucao,
  };
};

// ============================================================================
// Hook - Exportação DRE
// ============================================================================

interface UseExportarDREResult {
  isExporting: boolean;
  error: string | null;
  exportarPDF: (dataInicio: string, dataFim: string, tipo?: PeriodoDRE) => Promise<void>;
  exportarCSV: (dataInicio: string, dataFim: string, tipo?: PeriodoDRE) => Promise<void>;
  exportarExcel: (dataInicio: string, dataFim: string, tipo?: PeriodoDRE) => Promise<void>;
}

/**
 * Hook para exportar DRE em diferentes formatos
 */
export const useExportarDRE = (): UseExportarDREResult => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportar = useCallback(async (
    dataInicio: string,
    dataFim: string,
    formato: 'pdf' | 'csv' | 'excel',
    tipo?: PeriodoDRE
  ) => {
    setIsExporting(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set('dataInicio', dataInicio);
      searchParams.set('dataFim', dataFim);
      searchParams.set('formato', formato);
      if (tipo) {
        searchParams.set('tipo', tipo);
      }

      const response = await fetch(`/api/financeiro/dre/exportar?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao exportar DRE');
      }

      // Obter blob e fazer download
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `dre_${dataInicio}_${dataFim}.${formato === 'pdf' ? 'pdf' : 'csv'}`;

      // Extrair nome do arquivo do header se disponível
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          fileName = match[1];
        }
      }

      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar DRE:', err);
      setError(err instanceof Error ? err.message : 'Erro ao exportar DRE');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    error,
    exportarPDF: (dataInicio, dataFim, tipo) => exportar(dataInicio, dataFim, 'pdf', tipo),
    exportarCSV: (dataInicio, dataFim, tipo) => exportar(dataInicio, dataFim, 'csv', tipo),
    exportarExcel: (dataInicio, dataFim, tipo) => exportar(dataInicio, dataFim, 'excel', tipo),
  };
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Gera datas para período atual baseado no tipo
 */
export const gerarPeriodoAtual = (tipo: PeriodoDRE): { dataInicio: string; dataFim: string } => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  switch (tipo) {
    case 'mensal': {
      const dataInicio = new Date(ano, mes, 1);
      const dataFim = new Date(ano, mes + 1, 0);
      return {
        dataInicio: dataInicio.toISOString().split('T')[0],
        dataFim: dataFim.toISOString().split('T')[0],
      };
    }
    case 'trimestral': {
      const trimestre = Math.floor(mes / 3);
      const mesInicio = trimestre * 3;
      const dataInicio = new Date(ano, mesInicio, 1);
      const dataFim = new Date(ano, mesInicio + 3, 0);
      return {
        dataInicio: dataInicio.toISOString().split('T')[0],
        dataFim: dataFim.toISOString().split('T')[0],
      };
    }
    case 'anual':
    default: {
      return {
        dataInicio: `${ano}-01-01`,
        dataFim: `${ano}-12-31`,
      };
    }
  }
};

/**
 * Gera datas para período anterior
 */
export const gerarPeriodoAnterior = (
  dataInicio: string,
  dataFim: string,
  _tipo: PeriodoDRE
): { dataInicio: string; dataFim: string } => {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  // Calcular diferença em meses
  const mesesDiff =
    (fim.getFullYear() - inicio.getFullYear()) * 12 +
    (fim.getMonth() - inicio.getMonth()) +
    1;

  // Subtrair mesma quantidade de meses
  const novoInicio = new Date(inicio);
  novoInicio.setMonth(novoInicio.getMonth() - mesesDiff);

  const novoFim = new Date(inicio);
  novoFim.setDate(novoFim.getDate() - 1);

  return {
    dataInicio: novoInicio.toISOString().split('T')[0],
    dataFim: novoFim.toISOString().split('T')[0],
  };
};
