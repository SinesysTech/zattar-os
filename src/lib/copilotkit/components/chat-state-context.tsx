'use client';

/**
 * ChatStateContext
 *
 * Contexto personalizado para controlar o estado aberto/fechado do chat do CopilotKit.
 * Necessário porque useChatContext do @copilotkit/react-ui só funciona dentro
 * dos componentes de UI do CopilotKit (CopilotSidebar, CopilotPopup internamente).
 *
 * Este contexto permite que componentes externos (como AppHeader) controlem
 * o estado do popup sem depender do contexto interno do CopilotKit.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ChatStateContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const ChatStateContext = createContext<ChatStateContextValue | null>(null);

export function ChatStateProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false);

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);
  }, []);

  const toggle = useCallback(() => {
    setOpenState((prev) => !prev);
  }, []);

  return (
    <ChatStateContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </ChatStateContext.Provider>
  );
}

export function useChatState(): ChatStateContextValue {
  const context = useContext(ChatStateContext);
  if (!context) {
    throw new Error(
      'useChatState must be used within a ChatStateProvider. ' +
      'Did you forget to wrap your app in a <ChatStateProvider> component?'
    );
  }
  return context;
}
