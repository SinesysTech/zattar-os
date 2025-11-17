'use client';

// Hook para buscar e gerenciar dados do perfil do usuário logado

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/client';
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

  const buscarPerfil = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Obter usuário autenticado do Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar dados do usuário na tabela usuarios pelo auth_user_id
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (usuarioError || !usuarioData) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar dados completos via API
      const response = await fetch(`/api/usuarios/${usuarioData.id}`);

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

      setUsuario(data.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar perfil';
      setError(errorMessage);
      setUsuario(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarPerfil();
  }, [buscarPerfil]);

  return {
    usuario,
    isLoading,
    error,
    refetch: buscarPerfil,
  };
};
