"use client";

import { MessageSquare, UserPlus, Users, Search } from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/shared/glass-panel";
import { IconContainer } from "@/components/ui/icon-container";

const SUGGESTION_CARDS = [
  {
    icon: <UserPlus className="size-3.5" />,
    label: "Nova conversa direta",
  },
  {
    icon: <Users className="size-3.5" />,
    label: "Criar grupo",
  },
  {
    icon: <Search className="size-3.5" />,
    label: "Buscar mensagens",
  },
] as const;

export function ChatEmptyState() {
  return (
    <div className="hidden md:flex h-full w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        {/* Icon + Copy */}
        <div className="flex flex-col items-center gap-3">
          <div className="size-14 rounded-full bg-primary/[0.08] flex items-center justify-center">
            <MessageSquare className="size-6 text-primary/60" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <h2 className="text-base font-semibold text-foreground/80">
              Suas conversas
            </h2>
            <p className="text-sm text-muted-foreground/60 text-center text-balance">
              Selecione uma conversa para começar ou inicie uma nova.
            </p>
          </div>
        </div>

        {/* Suggestion Cards */}
        <GlassPanel depth={1} className="w-full p-1 gap-0.5 flex flex-col rounded-xl">
          {SUGGESTION_CARDS.map(({ icon, label }) => (
            <button
              key={label}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-foreground/[0.04] transition-colors group"
              onClick={() => toast("Em breve", { description: label })}
            >
              <IconContainer
                size="sm"
                className="bg-primary/[0.08] text-primary/60 shrink-0 group-hover:bg-primary/[0.12] transition-colors"
              >
                {icon}
              </IconContainer>
              <span className="text-[0.8125rem] font-medium text-foreground/70 group-hover:text-foreground/90 transition-colors">
                {label}
              </span>
            </button>
          ))}
        </GlassPanel>
      </div>
    </div>
  );
}
