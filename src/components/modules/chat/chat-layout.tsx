'use client';

import { ReactNode } from 'react';
import { cn } from ' @/lib/utils';

interface ChatLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  className?: string;
}

export function ChatLayout({ sidebar, main, className }: ChatLayoutProps) {
  return (
    <div className={cn('flex h-full overflow-hidden rounded-xl border border-border shadow-sm', className)}>
      {/* Sidebar - Lista de Canais */}
      <div className="w-80 border-r flex flex-col h-full">
        {sidebar}
      </div>

      {/* Main - Janela de Chat */}
      <div className="flex-1 flex flex-col min-h-0">
        {main}
      </div>
    </div>
  );
}
