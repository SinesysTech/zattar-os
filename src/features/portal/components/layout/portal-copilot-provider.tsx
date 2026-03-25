'use client';

/**
 * PortalCopilotProvider
 *
 * CopilotKit leve para o Portal do Cliente.
 * Usa CopilotPopup (balão flutuante) em vez de Sidebar.
 * Ferramentas limitadas a consulta (read-only).
 */

import { CopilotKit } from '@copilotkit/react-core';
import { CopilotPopup } from '@copilotkit/react-ui';
import { useCopilotChatSuggestions } from '@copilotkit/react-core';
import '@copilotkit/react-ui/styles.css';
import type { ReactNode } from 'react';

const PORTAL_SYSTEM_PROMPT = `Você é o assistente virtual do Portal do Cliente da Zattar Advogados.
Seu nome é Pedrinho e você ajuda clientes a acompanhar seus processos jurídicos.

## Suas capacidades:
- Consultar processos vinculados ao cliente (por CPF ou CNPJ)
- Mostrar próximas audiências
- Informar sobre expedientes e prazos
- Explicar termos jurídicos em linguagem acessível
- Consultar contratos do cliente

## Regras:
- Sempre responda em português brasileiro
- Use linguagem simples e acessível (o cliente NÃO é advogado)
- Explique termos jurídicos quando usá-los
- Nunca exponha dados internos do escritório (IDs, nomes de advogados, dados financeiros)
- Seja empático e profissional
- Se não souber algo, oriente o cliente a entrar em contato com o escritório`;

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
    <CopilotKit runtimeUrl="/api/copilotkit">
      <PortalSuggestions />
      <CopilotPopup
        instructions={PORTAL_SYSTEM_PROMPT}
        labels={{
          title: 'Pedrinho - Assistente',
          initial: 'Olá! Sou o Pedrinho, assistente da Zattar Advogados. Como posso ajudar?',
          placeholder: 'Pergunte sobre seus processos...',
        }}
        className="portal-copilot-popup"
      />
      {children}
    </CopilotKit>
  );
}
