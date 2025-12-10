'use client';

// Hook para buscar contratos

import { useState, useEffect, useCallback } from 'react';
import type { ContratosApiResponse, BuscarContratosParams } from '@/core/app/_lib/types/contratos';
import type { Contrato } from '@/backend/contratos/services/persistence/contrato-persistence.service';

interface UseContratosResult {
  contratos: Contrato[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar contratos
 */
export const useContratos = (params: BuscarContratosParams = {}): UseContratosResult => {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [paginacao, setPaginacao] = useState<UseContratosResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarContratos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Construir query string
      const searchParams = new URLSearchParams();

      if (params.pagina !== undefined) {
        searchParams.set('pagina', params.pagina.toString());
      }
      if (params.limite !== undefined) {
        searchParams.set('limite', params.limite.toString());
      }
      if (params.busca) {
        searchParams.set('busca', params.busca);
      }
      if (params.areaDireito) {
        searchParams.set('areaDireito', params.areaDireito);
      }
      if (params.tipoContrato) {
        searchParams.set('tipoContrato', params.tipoContrato);
      }
      if (params.status) {
        searchParams.set('status', params.status);
      }
      if (params.clienteId !== undefined) {
        searchParams.set('clienteId', params.clienteId.toString());
      }
      if (params.parteContrariaId !== undefined) {
        searchParams.set('parteContrariaId', params.parteContrariaId.toString());
      }
      if (params.responsavelId !== undefined) {
        searchParams.set('responsavelId', params.responsavelId.toString());
      }

      const response = await fetch(`/api/contratos?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: ContratosApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setContratos(data.data.contratos);
      setPaginacao({
        pagina: data.data.pagina,
        limite: data.data.limite,
        total: data.data.total,
        totalPaginas: data.data.totalPaginas,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar contratos';
      setError(errorMessage);
      setContratos([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.pagina, params.limite, params.busca, params.areaDireito, params.tipoContrato, params.status, params.clienteId, params.parteContrariaId, params.responsavelId]);

  useEffect(() => {
    buscarContratos();
  }, [buscarContratos]);

  return {
    contratos,
    paginacao,
    isLoading,
    error,
    refetch: buscarContratos,
  };
};