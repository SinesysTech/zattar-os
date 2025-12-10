'use client';

/**
 * CHAT FEATURE - ChatLayout Component
 *
 * Layout principal do chat com sidebar e área principal.
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChatLayoutProps {
  /** Conteúdo da sidebar (lista de salas) */
  sidebar: ReactNode;
  /** Conteúdo principal (janela de chat) */
  main: ReactNode;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Layout de duas colunas para o módulo de chat.
 * Sidebar fixa à esquerda e área principal à direita.
 */
export function ChatLayout({ sidebar, main, className }: ChatLayoutProps) {
  return (
    <div
      className={cn(
        'flex h-full overflow-hidden rounded-xl border border-border shadow-sm',
        className
      )}
    >
      {/* Sidebar - Lista de Canais */}
      <div className="w-80 border-r flex flex-col h-full">{sidebar}</div>

      {/* Main - Janela de Chat */}
      <div className="flex-1 flex flex-col min-h-0">{main}</div>
    </div>
  );
}
