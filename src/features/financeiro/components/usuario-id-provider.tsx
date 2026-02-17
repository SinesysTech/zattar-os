'use client';

/**
 * Provider que expõe o usuarioId para componentes do financeiro.
 * Lê do UserProvider centralizado (zero fetches adicionais).
 */

import * as React from 'react';
import { useUser } from '@/providers/user-provider';

interface UsuarioIdContextValue {
  usuarioId: string | null;
  isLoading: boolean;
}

const UsuarioIdContext = React.createContext<UsuarioIdContextValue | undefined>(undefined);

export function UsuarioIdProvider({ children }: { children: React.ReactNode }) {
  const userData = useUser();

  const value = React.useMemo(
    () => ({
      usuarioId: userData.id ? String(userData.id) : null,
      isLoading: userData.isLoading,
    }),
    [userData.id, userData.isLoading]
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
