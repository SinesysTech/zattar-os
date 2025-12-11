'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/client';
import { listarPermissoesUsuario } from '../repository';
import { usuarioRepository } from '../repository';
import type { Permissao } from '../types';

export interface MinhasPermissoesData {
  usuarioId: number;
  isSuperAdmin: boolean;
  permissoes: Permissao[];
}

/**
 * Hook para buscar permissões do usuário logado
 * Retorna permissões do usuário autenticado, opcionalmente filtradas por recurso
 */
export function useMinhasPermissoes(recurso?: string) {
  const [data, setData] = useState<MinhasPermissoesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissoes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Buscar usuário logado via Supabase
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('Usuário não autenticado');
        setIsLoading(false);
        return;
      }

      // Buscar usuário no banco pelo auth_user_id
      const usuario = await usuarioRepository.findByEmail(user.email || '');
      if (!usuario) {
        setError('Usuário não encontrado');
        setIsLoading(false);
        return;
      }

      // Buscar permissões
      const permissoes = await listarPermissoesUsuario(usuario.id);

      // Filtrar por recurso se especificado
      let permissoesFiltradas = permissoes;
      if (recurso) {
        permissoesFiltradas = permissoes.filter((p) => p.recurso === recurso);
      }

      setData({
        usuarioId: usuario.id,
        isSuperAdmin: usuario.isSuperAdmin,
        permissoes: permissoesFiltradas,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar permissões');
    } finally {
      setIsLoading(false);
    }
  }, [recurso]);

  useEffect(() => {
    fetchPermissoes();
  }, [fetchPermissoes]);

  // Função para verificar se o usuário tem uma permissão específica
  const temPermissao = useCallback((recurso: string, operacao: string): boolean => {
    if (!data) return false;
    if (data.isSuperAdmin) return true;
    
    return data.permissoes.some(
      (p) => p.recurso === recurso && p.operacao === operacao && p.permitido
    );
  }, [data]);

  return {
    data,
    isLoading,
    error,
    temPermissao,
    refetch: fetchPermissoes,
  };
}

