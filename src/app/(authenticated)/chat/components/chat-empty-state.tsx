"use client";

import { cn } from '@/lib/utils';
import { MessageSquare, UserPlus, Users, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import { Heading } from "@/components/ui/typography";

const SUGGESTION_CARDS = [
  {
    icon: <UserPlus className="size-3.5" />,
    title: "Nova conversa",
    description: "Iniciar conversa direta com um colega",
    colorClass: "bg-primary/10 text-primary",
  },
  {
    icon: <Users className="size-3.5" />,
    title: "Criar grupo",
    description: "Reunir equipe em um canal de grupo",
    colorClass: "bg-info/10 text-info",
  },
  {
    icon: <Search className="size-3.5" />,
    title: "Buscar mensagens",
    description: "Encontrar conversas e arquivos anteriores",
    colorClass: "bg-success/10 text-success",
  },
  {
    icon: <FileText className="size-3.5" />,
    title: "Chat de processo",
    description: "Vincular conversa a um processo ativo",
    colorClass: "bg-warning/10 text-warning",
  },
] as const;

export function ChatEmptyState() {
  return (
    <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "hidden md:flex h-full w-full items-center justify-center p-8")}>
      <div className={cn("flex flex-col items-center inline-loose max-w-105 w-full")}>
        {/* Icon + Copy */}
        <div className={cn("flex flex-col items-center inline-medium")}>
          <div className="size-16 rounded-[1.25rem] bg-primary/8 flex items-center justify-center mb-2">
            <MessageSquare className="size-7 text-primary/70" />
          </div>
          <div className={cn("flex flex-col items-center inline-snug")}>
            <Heading level="section" className="text-foreground">
              Suas conversas
            </Heading>
            <p className={cn("text-[0.8rem] text-muted-foreground/70 text-center text-balance leading-relaxed")}>
              Selecione uma conversa para começar ou inicie uma nova.
            </p>
          </div>
        </div>

        {/* Suggestion Cards — 2x2 grid per mock */}
        <div className={cn("w-full grid grid-cols-2 inline-tight-plus")}>
          {SUGGESTION_CARDS.map(({ icon, title, description, colorClass }) => (
            <button
              key={title}
              className={cn(/* design-system-escape: p-3.5 → usar <Inset> */ "flex items-start inline-tight-plus p-3.5 rounded-[0.875rem] bg-foreground/3 border border-foreground/6 text-left hover:bg-foreground/5 hover:border-primary/12 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-250 cursor-pointer group")}
              onClick={() => toast("Em breve", { description: title })}
            >
              <div
                className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
              >
                {icon}
              </div>
              <div className="min-w-0">
                <p className={cn( "text-[0.7rem] font-semibold text-foreground mb-0.5")}>
                  {title}
                </p>
                <p className={cn("text-[0.6rem] text-muted-foreground/65 leading-snug")}>
                  {description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
