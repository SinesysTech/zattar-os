'use client';

// Hook para buscar e gerenciar dados do perfil do usuário logado

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

interface UsePerfilResult {
  usuario: Usuario | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UsuarioApiResponse {
  success: boolean;
  data: Usuario;
}

/**
 * Hook para buscar dados do perfil do usuário logado
 */
export const usePerfil = (): UsePerfilResult => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const buscarPerfil = useCallback(async () => {
    // Evitar múltiplas requisições simultâneas ou repetidas
    if (isFetchingRef.current || hasFetchedRef.current) {
      return;
    }

    isFetchingRef.current = true;
    hasFetchedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Buscar perfil do usuário logado via API
      const response = await fetch('/api/perfil');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro desconhecido',
        }));
        throw new Error(
          errorData.error || `Erro ${response.status}: ${response.statusText}`
        );
      }

      const data: UsuarioApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      if (isMountedRef.current) {
        setUsuario(data.data);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao buscar perfil';
        setError(errorMessage);
        setUsuario(null);
      }
      // Resetar flag em caso de erro para permitir retry
      hasFetchedRef.current = false;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Executar apenas uma vez na montagem
    buscarPerfil();

    return () => {
      isMountedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    usuario,
    isLoading,
    error,
    refetch: useCallback(async () => {
      hasFetchedRef.current = false;
      isFetchingRef.current = false;
      await buscarPerfil();
    }, [buscarPerfil]),
  };
};
