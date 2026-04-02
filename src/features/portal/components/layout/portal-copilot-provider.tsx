'use client';

/**
 * PortalCopilotProvider (v2)
 *
 * CopilotKit leve para o Portal do Cliente.
 * Usa CopilotPopup (balão flutuante) em vez de Sidebar.
 * System prompt do portal vai via BuiltInAgent no backend.
 */

import { CopilotKitProvider, CopilotPopup, useConfigureSuggestions } from '@copilotkit/react-core/v2';
import '@copilotkit/react-core/v2/styles.css';
import type { ReactNode } from 'react';

function PortalSuggestions() {
  useConfigureSuggestions({
    suggestions: [
      { title: 'Meus processos', message: 'Quais são meus processos em andamento?' },
      { title: 'Próximas audiências', message: 'Tenho audiências marcadas?' },
      { title: 'Prazos pendentes', message: 'Tenho prazos ou expedientes pendentes?' },
    ],
  });
  return null;
}

export function PortalCopilotProvider({ children }: { children: ReactNode }) {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_API_KEY}
      onError={(event) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[CopilotKit ${event.code}]`, event.error.message)
        }
      }}
    >
      <PortalSuggestions />
      <CopilotPopup
        labels={{
          modalHeaderTitle: 'Pedrinho - Assistente',
          welcomeMessageText: 'Olá! Sou o Pedrinho, assistente da Zattar Advogados. Como posso ajudar?',
          chatInputPlaceholder: 'Pergunte sobre seus processos...',
        }}
        className="portal-copilot-popup"
      />
      {children}
    </CopilotKitProvider>
  );
}
