/**
 * AgendaFilterBar — Barra de filtros unificada para Agenda
 * ============================================================================
 * Combina: Search + Date Navigation + Source Pills
 * Segue o padrao visual AudienciasFilterBar com chips ativaveis.
 * ============================================================================
 */

"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOURCE_CONFIGS, type AgendaSource } from "./mock-data";

// ─── Props ────────────────────────────────────────────────────────────

export interface AgendaFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  activeSources: Set<AgendaSource>;
  onToggleSource: (source: AgendaSource) => void;
  className?: string;
}

// ─── Source pill colors ───────────────────────────────────────────────

function sourceDotColor(source: AgendaSource): string {
  const map: Record<AgendaSource, string> = {
    audiencias: "bg-event-audiencia",
    expedientes: "bg-event-expediente",
    obrigacoes: "bg-event-obrigacao",
    pericias: "bg-event-pericia",
    prazos: "bg-event-prazo",
    agenda: "bg-event-agenda",
  };
  return map[source];
}

const SOURCE_ORDER: AgendaSource[] = [
  "audiencias", "expedientes", "obrigacoes", "pericias", "prazos", "agenda",
];

// ─── Component ────────────────────────────────────────────────────────

export function AgendaFilterBar({
  search,
  onSearchChange,
  onPrev,
  onNext,
  onToday,
  activeSources,
  onToggleSource,
  className,
}: AgendaFilterBarProps) {
  const allActive = activeSources.size === 0;

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/45" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar eventos..."
          className={cn(
            "w-56 pl-8 pr-3 py-2 rounded-lg text-xs",
            "bg-muted/10 border border-border/15 text-foreground placeholder:text-muted-foreground/40",
            "focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/20",
            "transition-all",
          )}
          aria-label="Buscar eventos"
        />
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="p-1.5 rounded-lg hover:bg-muted/20 transition-colors text-muted-foreground/50 hover:text-muted-foreground cursor-pointer"
          aria-label="Periodo anterior"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <button
          onClick={onToday}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/8 text-primary hover:bg-primary/12 transition-colors cursor-pointer"
        >
          Hoje
        </button>
        <button
          onClick={onNext}
          className="p-1.5 rounded-lg hover:bg-muted/20 transition-colors text-muted-foreground/50 hover:text-muted-foreground cursor-pointer"
          aria-label="Proximo periodo"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-border/10" />

      {/* Source Filter Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* All toggle */}
        <button
          onClick={() => {
            /* Toggle "all": clear all specific filters */
            if (!allActive) {
              SOURCE_ORDER.forEach((s) => { if (activeSources.has(s)) onToggleSource(s); });
            }
          }}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer",
            allActive
              ? "border-primary/20 bg-primary/8 text-primary"
              : "border-border/10 text-muted-foreground/40 hover:bg-muted/10",
          )}
        >
          <span className="size-1.5 rounded-full bg-primary" />
          Todos
        </button>

        {SOURCE_ORDER.map((source) => {
          const cfg = SOURCE_CONFIGS[source];
          const active = activeSources.has(source);

          return (
            <button
              key={source}
              onClick={() => onToggleSource(source)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer",
                active
                  ? "border-primary/20 bg-primary/8 text-primary"
                  : "border-border/10 text-muted-foreground/40 hover:bg-muted/10 hover:text-muted-foreground/60",
              )}
            >
              <span className={cn("size-1.5 rounded-full", sourceDotColor(source))} />
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
