
'use client';

import { useState, useEffect, useCallback } from 'react';
import { actionListarCargos } from '../actions/cargos-actions';

// Tipo simples de cargo
interface Cargo {
  id: number;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
}

interface UseCargosResult {
  cargos: Cargo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCargos = (): UseCargosResult => {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarCargos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await actionListarCargos();

      if (!response.success) {
        throw new Error(response.error || 'Erro ao listar cargos');
      }

      setCargos(response.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarCargos();
  }, [buscarCargos]);

  return {
    cargos,
    isLoading,
    error,
    refetch: buscarCargos,
  };
};
