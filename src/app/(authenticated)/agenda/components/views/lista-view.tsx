/**
 * ListaView — Vista tabela dos eventos
 * ============================================================================
 * Recebe AgendaEvent[] (dados reais).
 * ============================================================================
 */

"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { CalendarSource } from "@/app/(authenticated)/calendar";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/shared/glass-panel";
import type { AgendaEvent } from "../../lib/adapters";

export interface ListaViewProps {
  events: AgendaEvent[];
  onEventClick?: (e: AgendaEvent) => void;
  className?: string;
}

function sourceColors(source: CalendarSource) {
  const map: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    audiencias:  { bg: "bg-info/15",        text: "text-info",        border: "border-info/20",        dot: "bg-info",        label: "Audiencia" },
    expedientes: { bg: "bg-warning/15",     text: "text-warning",     border: "border-warning/20",     dot: "bg-warning",     label: "Expediente" },
    obrigacoes:  { bg: "bg-warning/15",     text: "text-warning",     border: "border-warning/20",     dot: "bg-warning",     label: "Obrigacao" },
    pericias:    { bg: "bg-primary/15",     text: "text-primary",     border: "border-primary/20",     dot: "bg-primary",     label: "Pericia" },
    agenda:      { bg: "bg-primary/15",     text: "text-primary",     border: "border-primary/20",     dot: "bg-primary",     label: "Pessoal" },
  };
  return map[source] ?? { bg: "bg-muted/15", text: "text-muted-foreground", border: "border-border/20", dot: "bg-muted-foreground", label: source };
}

function fmtDate(d: Date) {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${String(d.getDate()).padStart(2, "0")}/${months[d.getMonth()]}/${d.getFullYear()}`;
}
function fmtTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fmtTimeRange(start: Date, end: Date) {
  const s = fmtTime(start); const e = fmtTime(end);
  return s === e ? s : `${s} – ${e}`;
}

const PAGE_SIZE = 10;

export function ListaView({ events, onEventClick, className }: ListaViewProps) {
  const [page, setPage] = useState(0);
  const sorted = useMemo(() => [...events].sort((a, b) => a.start.getTime() - b.start.getTime()), [events]);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <GlassPanel className={cn("overflow-hidden", className)}>
      <div className="grid grid-cols-[minmax(180px,1.5fr)_minmax(140px,2fr)_100px_100px_90px_40px] gap-4 px-4 py-3 border-b border-border/10">
        {["Evento", "Processo / Partes", "Data", "Horario", "Tipo", ""].map((h) => (
          <span key={h} className="text-[10.5px] font-semibold text-muted-foreground/30 uppercase tracking-wider">{h}</span>
        ))}
      </div>
      <div>
        {paged.map((evt) => {
          const colors = sourceColors(evt.source);
          return (
            <button key={evt.id} onClick={() => onEventClick?.(evt)} className="w-full grid grid-cols-[minmax(180px,1.5fr)_minmax(140px,2fr)_100px_100px_90px_40px] gap-4 items-center px-4 py-3.5 text-left border-b border-border/6 transition-all cursor-pointer hover:bg-muted/6">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("w-1 h-10 rounded-full flex-shrink-0", colors.dot)} />
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-foreground truncate">{evt.title}</div>
                  <div className="text-[10px] text-muted-foreground/45 truncate">
                    {evt.meta.trt ? `${evt.meta.trt} · ${evt.meta.grau ?? ""}` : evt.meta.local ?? ""}
                    {evt.meta.modalidade ? ` · ${evt.meta.modalidade === "virtual" ? "Virtual" : "Presencial"}` : ""}
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                {evt.meta.processo ? (
                  <div className="text-[11px] font-mono text-muted-foreground/55 truncate">{evt.meta.processo}</div>
                ) : (
                  <span className="text-[10px] text-muted-foreground/25">—</span>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground/60">{fmtDate(evt.start)}</div>
              <div className="text-[11px] font-mono text-muted-foreground/60 tabular-nums">{fmtTimeRange(evt.start, evt.end)}</div>
              <div>
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border", colors.bg, colors.text, colors.border)}>{colors.label}</span>
              </div>
              <div>
                <div className="size-7 flex items-center justify-center rounded-lg hover:bg-muted/15"><MoreHorizontal className="size-4 text-muted-foreground/35" /></div>
              </div>
            </button>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/10">
          <span className="text-[11px] text-muted-foreground/40">Exibindo {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} de {sorted.length}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-2 py-1 rounded-lg text-[10px] text-muted-foreground/40 hover:bg-muted/15 disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors">Anterior</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className={cn("px-2.5 py-1 rounded-lg text-[10px] cursor-pointer transition-colors", i === page ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground/40 hover:bg-muted/15")}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-2 py-1 rounded-lg text-[10px] text-muted-foreground/40 hover:bg-muted/15 disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors">Proximo</button>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
