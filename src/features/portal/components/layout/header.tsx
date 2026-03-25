"use client";

import { Search, Bell, MessageSquare, Settings } from "lucide-react";

export function PortalHeader() {
  return (
    <header className="fixed top-4 left-4 right-4 lg:left-72 rounded-xl border border-border bg-card/80 backdrop-blur-xl flex justify-between items-center h-16 px-6 z-40 shadow-lg font-headline font-medium">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md focus-within:ring-1 focus-within:ring-primary/50 rounded-lg overflow-hidden transition-all">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <input
            className="bg-muted border-none w-full pl-10 pr-4 py-2 text-sm text-on-surface focus:ring-0 placeholder:text-muted-foreground outline-none"
            placeholder="Buscar processos ou documentos..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-on-surface-variant">
          <button className="hover:text-primary transition-colors cursor-pointer" aria-label="Notificações">
            <Bell className="w-5 h-5" />
          </button>
          <button className="hover:text-primary transition-colors cursor-pointer" aria-label="Mensagens">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button className="hover:text-primary transition-colors cursor-pointer" aria-label="Configurações">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="h-8 w-[1px] bg-border mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-on-surface">Cliente Zattar</p>
            <p className="text-[10px] text-on-surface-variant">ID: 9845-ZT</p>
          </div>
          <div className="h-10 w-10 rounded-full border border-primary/40 bg-accent overflow-hidden flex items-center justify-center text-primary font-bold">
            CZ
          </div>
        </div>
      </div>
    </header>
  );
}
