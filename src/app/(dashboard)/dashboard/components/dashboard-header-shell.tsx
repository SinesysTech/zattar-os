'use client';

import * as React from 'react';
import { DashboardTabs } from './dashboard-tabs';

type HeaderActionsContextValue = {
  actions: React.ReactNode;
  setActions: (node: React.ReactNode) => void;
};

const HeaderActionsContext = React.createContext<HeaderActionsContextValue | null>(null);

export function useDashboardHeaderActions() {
  const ctx = React.useContext(HeaderActionsContext);
  if (!ctx) {
    throw new Error('useDashboardHeaderActions must be used within DashboardHeaderShell');
  }
  return ctx;
}

export function DashboardHeaderShell({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = React.useState<React.ReactNode>(null);

  const value = React.useMemo<HeaderActionsContextValue>(() => ({ actions, setActions }), [actions]);

  return (
    <HeaderActionsContext.Provider value={value}>
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-center justify-between gap-3">
          <DashboardTabs />
          <div className="flex items-center gap-4">{actions}</div>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </HeaderActionsContext.Provider>
  );
}

/**
 * Helper para páginas definirem ações no header do dashboard (na mesma linha das tabs).
 * Renderiza nada; apenas registra o node no contexto.
 */
export function DashboardHeaderActions({ children }: { children: React.ReactNode }) {
  const { setActions } = useDashboardHeaderActions();

  React.useEffect(() => {
    setActions(children);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActions]);

  React.useEffect(() => {
    return () => setActions(null);
  }, [setActions]);

  return null;
}


