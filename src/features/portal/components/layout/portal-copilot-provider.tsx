'use client';

/**
 * PortalCopilotProvider (v2)
 *
 * CopilotKit leve para o Portal do Cliente.
 * Usa CopilotPopup (balão flutuante) em vez de Sidebar.
 * System prompt do portal vai via BuiltInAgent no backend.
 */

import { CopilotKit } from '@copilotkit/react-core';
import { CopilotPopup } from '@copilotkit/react-core/v2';
import { useCopilotChatSuggestions } from '@copilotkit/react-core';
import '@copilotkit/react-core/v2/styles.css';
import type { ReactNode } from 'react';

function PortalSuggestions() {
  useCopilotChatSuggestions({
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
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_API_KEY}
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
    </CopilotKit>
  );
}
