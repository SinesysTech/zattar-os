
'use client';

import { useState, useEffect, useCallback } from 'react';
import { actionBuscarUsuario } from '../actions/usuarios-actions';
import { Usuario } from '../types/types';

interface UseUsuarioResult {
  usuario: Usuario | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar um único usuário por ID
 */
export const useUsuario = (id: number | null | undefined): UseUsuarioResult => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarUsuario = useCallback(async () => {
    if (!id) {
        setUsuario(null);
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await actionBuscarUsuario(id);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar usuário');
      }

      setUsuario(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setUsuario(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    buscarUsuario();
  }, [buscarUsuario]);

  return {
    usuario,
    isLoading,
    error,
    refetch: buscarUsuario,
  };
};
