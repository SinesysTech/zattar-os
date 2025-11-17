'use client';

// Hook para buscar usuários do sistema

import { useState, useEffect, useCallback } from 'react';

export interface Usuario {
  id: number;
  nomeCompleto: string;
  nomeExibicao: string;
  emailCorporativo: string;
  ativo: boolean;
}

interface UseUsuariosResult {
  usuarios: Usuario[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UsuariosApiResponse {
  success: boolean;
  data: {
    usuarios: Array<{
      id: number;
      nomeCompleto: string;
      nomeExibicao: string;
      emailCorporativo: string;
      ativo: boolean;
    }>;
    total: number;
  };
}

/**
 * Hook para buscar usuários do sistema
 */
export const useUsuarios = (ativo?: boolean): UseUsuariosResult => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set('limite', '1000'); // Buscar muitos usuários
      if (ativo !== undefined) {
        searchParams.set('ativo', ativo.toString());
      }

      const response = await fetch(`/api/usuarios?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro desconhecido',
        }));
        throw new Error(
          errorData.error || `Erro ${response.status}: ${response.statusText}`
        );
      }

      const data: UsuariosApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      // A API já retorna no formato correto (camelCase)
      const usuariosFormatados: Usuario[] = data.data.usuarios.map((u) => ({
        id: u.id,
        nomeCompleto: u.nomeCompleto,
        nomeExibicao: u.nomeExibicao,
        emailCorporativo: u.emailCorporativo,
        ativo: u.ativo,
      }));

      setUsuarios(usuariosFormatados);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar usuários';
      setError(errorMessage);
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  }, [ativo]);

  useEffect(() => {
    buscarUsuarios();
  }, [buscarUsuarios]);

  return {
    usuarios,
    isLoading,
    error,
    refetch: buscarUsuarios,
  };
};

