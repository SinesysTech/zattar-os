'use client';

/**
 * Provider client que obtém e persiste o usuarioId durante a sessão
 * Evita recarregar o server component a cada mudança de tab
 */

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UsuarioIdContextValue {
  usuarioId: string | null;
  isLoading: boolean;
}

const UsuarioIdContext = React.createContext<UsuarioIdContextValue | undefined>(undefined);

export function UsuarioIdProvider({ children }: { children: React.ReactNode }) {
  const [usuarioId, setUsuarioId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    async function fetchUsuarioId() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('usuarios')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (error || !data) {
          router.push('/login');
          return;
        }

        setUsuarioId(data.id ? String(data.id) : null);
      } catch (error) {
        console.error('Erro ao obter usuarioId:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsuarioId();
  }, [router]);

  const value = React.useMemo(
    () => ({ usuarioId, isLoading }),
    [usuarioId, isLoading]
  );

  return <UsuarioIdContext.Provider value={value}>{children}</UsuarioIdContext.Provider>;
}

export function useUsuarioId() {
  const context = React.useContext(UsuarioIdContext);
  if (context === undefined) {
    throw new Error('useUsuarioId deve ser usado dentro de UsuarioIdProvider');
  }
  return context;
}


