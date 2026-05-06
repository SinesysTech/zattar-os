/**
 * AgendaFilterBar — Barra de filtros unificada para Agenda
 * ============================================================================
 * Combina: Date Navigation + Source Pills
 * Segue o padrão visual AudienciasFilterBar com chips ativáveis.
 * O SearchInput fica fora deste componente, emparelhado com o ViewToggle
 * à direita da linha de controle (padrão Audiências / Expedientes / Partes).
 * ============================================================================
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOURCE_CONFIGS, type AgendaSource } from "./mock-data";

// ─── Props ────────────────────────────────────────────────────────────

export interface AgendaFilterBarProps {
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
  onPrev,
  onNext,
  onToday,
  activeSources,
  onToggleSource,
  className,
}: AgendaFilterBarProps) {
  const allActive = activeSources.size === 0;

  return (
    <div className={cn("flex items-center inline-medium flex-wrap", className)}>
      {/* Date Navigation */}
      <div className={cn("flex items-center inline-micro")}>
        <button
          onClick={onPrev}
          className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "p-1.5 rounded-lg hover:bg-muted/20 transition-colors text-muted-foreground/50 hover:text-muted-foreground cursor-pointer")}
          aria-label="Período anterior"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <button
          onClick={onToday}
          className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading> */ /* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "px-3 py-1.5 rounded-lg text-caption font-medium bg-primary/8 text-primary hover:bg-primary/12 transition-colors cursor-pointer")}
        >
          Hoje
        </button>
        <button
          onClick={onNext}
          className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "p-1.5 rounded-lg hover:bg-muted/20 transition-colors text-muted-foreground/50 hover:text-muted-foreground cursor-pointer")}
          aria-label="Próximo período"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-border/10" />

      {/* Source Filter Pills */}
      <div className={cn("flex items-center inline-snug flex-wrap")}>
        {/* All toggle */}
        <button
          onClick={() => {
            /* Toggle "all": clear all specific filters */
            if (!allActive) {
              SOURCE_ORDER.forEach((s) => { if (activeSources.has(s)) onToggleSource(s); });
            }
          }}
          className={cn(
            /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "inline-flex items-center inline-snug px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer",
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
                /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "inline-flex items-center inline-snug px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer",
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
