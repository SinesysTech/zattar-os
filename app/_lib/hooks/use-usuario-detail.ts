/**
 * Hook para buscar dados completos de um usuário
 */

import useSWR from 'swr';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import type { Permissao } from '@/app/_lib/types/usuarios';

interface UsuarioDetailResponse {
  success: boolean;
  data: Usuario;
}

interface PermissoesResponse {
  success: boolean;
  data: {
    usuario_id: number;
    is_super_admin: boolean;
    permissoes: Permissao[];
  };
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Erro ao carregar dados');
  }
  return res.json();
};

/**
 * Hook para buscar dados do usuário
 */
export function useUsuarioDetail(usuarioId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<UsuarioDetailResponse>(
    usuarioId ? `/api/usuarios/${usuarioId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 segundos
    }
  );

  return {
    usuario: data?.data,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para buscar permissões do usuário
 */
export function useUsuarioPermissoes(usuarioId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<PermissoesResponse>(
    usuarioId ? `/api/permissoes/usuarios/${usuarioId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 segundos
    }
  );

  return {
    permissoes: data?.data.permissoes || [],
    isSuperAdmin: data?.data.is_super_admin || false,
    isLoading,
    error,
    mutate,
  };
}
