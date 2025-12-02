/**
 * Hook para buscar permissões do usuário logado
 */

import useSWR from 'swr';

interface Permissao {
  recurso: string;
  operacao: string;
  permitido: boolean;
}

interface MinhasPermissoesResponse {
  usuarioId: number;
  isSuperAdmin: boolean;
  permissoes: Permissao[];
}

interface UseMinhasPermissoesResult {
  permissoes: Permissao[];
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  // Helpers para verificar permissões específicas
  temPermissao: (recurso: string, operacao: string) => boolean;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Erro ao buscar permissões');
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Erro ao buscar permissões');
  }
  return data.data as MinhasPermissoesResponse;
};

/**
 * Hook para buscar permissões do usuário logado
 * @param recurso - Opcional: filtrar por recurso específico
 */
export function useMinhasPermissoes(recurso?: string): UseMinhasPermissoesResult {
  const url = recurso
    ? `/api/permissoes/minhas?recurso=${encodeURIComponent(recurso)}`
    : '/api/permissoes/minhas';

  const { data, error, isLoading } = useSWR<MinhasPermissoesResponse>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minuto
  });

  const temPermissao = (rec: string, operacao: string): boolean => {
    // Super admin tem todas as permissões
    if (data?.isSuperAdmin) {
      return true;
    }

    // Verificar permissão específica
    return (
      data?.permissoes.some(
        (p) => p.recurso === rec && p.operacao === operacao && p.permitido
      ) ?? false
    );
  };

  return {
    permissoes: data?.permissoes ?? [],
    isSuperAdmin: data?.isSuperAdmin ?? false,
    isLoading,
    error: error?.message ?? null,
    temPermissao,
  };
}
