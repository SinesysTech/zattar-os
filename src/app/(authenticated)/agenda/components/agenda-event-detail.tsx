/**
 * AgendaEventDetail — Dialog de detalhes de evento
 * ============================================================================
 * Light glass dialog com:
 * - Header: icone + titulo + status badge + close
 * - Meta strip: horario, modalidade, tribunal, responsavel
 * - Action buttons: Sala Virtual, Visualizar Ata, Abrir PJe
 * - Processo vinculado: numero, partes, link
 * - Checklist de preparo
 * - Observacoes
 *
 * Usa DialogFormShell para overlay e glass dialog styling.
 * ============================================================================
 */

"use client";

import {
  Gavel,
  Calendar,
  Clock,
  Video,
  MapPin,
  Landmark,
  X,
  FileText,
  ExternalLink,
  ShieldCheck,
  MessageSquare,
  Pencil,
  CheckCircle,
  Check,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MockEvent, ChecklistItem } from "./mock-data";
import { MOCK_CHECKLIST, sourceColorClasses } from "./mock-data";

// ─── Types ────────────────────────────────────────────────────────────

export interface AgendaEventDetailProps {
  event: MockEvent | null;
  open: boolean;
  onClose: () => void;
  checklist?: ChecklistItem[];
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function fmtTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const DAY_NAMES = ["Domingo", "Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function statusClasses(status?: string) {
  if (!status) return "";
  const map: Record<string, string> = {
    "Marcada": "bg-success/15 text-success",
    "Pendente": "bg-warning/15 text-warning",
    "Finalizada": "bg-info/15 text-info",
    "Cancelada": "bg-destructive/15 text-destructive",
    "Recebido": "bg-info/15 text-info",
    "Ag. Laudo": "bg-warning/15 text-warning",
  };
  return map[status] ?? "bg-muted/15 text-muted-foreground";
}

// ─── Component ────────────────────────────────────────────────────────

export function AgendaEventDetail({
  event,
  open,
  onClose,
  checklist = MOCK_CHECKLIST,
}: AgendaEventDetailProps) {
  if (!open || !event) return null;

  const dateStr = `${DAY_NAMES[event.start.getDay()]}, ${event.start.getDate()} de ${MONTH_NAMES[event.start.getMonth()]} de ${event.start.getFullYear()}`;
  const colors = sourceColorClasses(event.source);
  const prepDone = checklist.filter((c) => c.done).length;
  const prepTotal = checklist.length;
  const prepPct = prepTotal > 0 ? Math.round((prepDone / prepTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      {/* Overlay — usa glass-dialog-overlay token (globals.css) */}
      <div
        className="absolute inset-0 glass-dialog-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog — usa glass-dialog token (globals.css) */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div
          className={cn(
            "w-full max-w-[780px] max-h-[92vh] flex flex-col overflow-hidden",
            "glass-dialog rounded-2xl",
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-detail-title"
        >
          {/* ── Header ── */}
          <div className="px-7 pt-6 pb-0 flex-shrink-0">
            {/* Top row */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className={cn(
                  "size-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                  colors.bg,
                )}>
                  <Gavel className={cn("size-5", colors.text)} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1">
                    <h2
                      id="event-detail-title"
                      className="text-[17px] font-bold text-foreground"
                    >
                      {event.title}
                    </h2>
                    {event.status && (
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                        statusClasses(event.status),
                      )}>
                        <CircleDot className="size-3" />
                        {event.status}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-muted-foreground/60 flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    {dateStr}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="size-8 rounded-lg border border-border/30 flex items-center justify-center text-muted-foreground/50 hover:bg-muted/15 hover:text-muted-foreground transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Meta strip */}
            <div className="flex gap-0 mb-4 rounded-xl border border-border/15 bg-muted/[0.04] p-3.5">
              {/* Horario */}
              <div className="flex-1">
                <span className="text-[11px] font-medium text-muted-foreground/40 uppercase tracking-wider">Horario</span>
                <div className="flex items-center gap-1.5 mt-1 text-[13.5px] font-medium text-foreground">
                  <Clock className="size-3.5 text-muted-foreground/40" />
                  {fmtTime(event.start)} – {fmtTime(event.end)}
                </div>
              </div>
              <div className="w-px bg-border/15 mx-4" />
              {/* Modalidade */}
              <div className="flex-1">
                <span className="text-[11px] font-medium text-muted-foreground/40 uppercase tracking-wider">Modalidade</span>
                <div className="mt-1">
                  {event.modalidade ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11.5px] font-medium bg-primary/10 text-primary">
                      {event.modalidade === "virtual" ? <Video className="size-3" /> : <MapPin className="size-3" />}
                      {event.modalidade === "virtual" ? "Virtual" : event.modalidade === "presencial" ? "Presencial" : "Hibrida"}
                    </span>
                  ) : (
                    <span className="text-[13px] text-muted-foreground/30">—</span>
                  )}
                </div>
              </div>
              <div className="w-px bg-border/15 mx-4" />
              {/* Tribunal */}
              <div className="flex-1">
                <span className="text-[11px] font-medium text-muted-foreground/40 uppercase tracking-wider">Tribunal</span>
                <div className="flex items-center gap-1.5 mt-1 text-[13.5px] font-medium text-foreground">
                  <Landmark className="size-3.5 text-muted-foreground/40" />
                  {event.trt ?? "—"}{event.grau ? ` · ${event.grau}` : ""}
                </div>
              </div>
              <div className="w-px bg-border/15 mx-4" />
              {/* Responsavel */}
              <div className="flex-1">
                <span className="text-[11px] font-medium text-muted-foreground/40 uppercase tracking-wider">Responsavel</span>
                <div className="flex items-center gap-1.5 mt-1 text-[13.5px] font-medium text-foreground">
                  {event.responsavel ? (
                    <>
                      <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary flex-shrink-0">
                        {event.responsavel.iniciais}
                      </div>
                      {event.responsavel.nome}
                    </>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {event.source === "audiencias" && (
              <div className="flex items-center gap-2.5 mb-5 flex-wrap">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[13px] font-medium hover:bg-primary/90 transition-colors cursor-pointer">
                  <Video className="size-4" /> Entrar na Sala Virtual
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 border border-border/30 text-foreground/80 rounded-xl text-[13px] font-medium hover:bg-muted/10 transition-colors cursor-pointer">
                  <FileText className="size-4" /> Visualizar Ata
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 border border-border/30 text-foreground/80 rounded-xl text-[13px] font-medium hover:bg-muted/10 transition-colors cursor-pointer">
                  <ExternalLink className="size-4" /> Abrir PJe
                </button>
              </div>
            )}

            <div className="h-px bg-border/15" />
          </div>

          {/* ── Scrollable Body ── */}
          <div className="overflow-y-auto flex-1 px-7 py-5" style={{ scrollbarWidth: "thin" }}>
            {/* Processo Section */}
            {event.processo && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="size-3.5 text-muted-foreground/40" />
                  <span className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wider">Processo Vinculado</span>
                </div>
                <div className="rounded-xl border border-border/15 bg-muted/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-mono font-semibold text-foreground">{event.processo}</div>
                      {event.trt && (
                        <div className="text-[11px] text-muted-foreground/40 mt-1">
                          Vara do Trabalho · {event.trt}
                        </div>
                      )}
                    </div>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border/30 text-foreground/70 rounded-lg text-xs font-medium hover:bg-muted/10 transition-colors cursor-pointer">
                      <ExternalLink className="size-3" /> Ver Processo
                    </button>
                  </div>
                  {event.partes && (
                    <>
                      <div className="h-px bg-border/10 my-3" />
                      <div className="flex gap-6">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="size-1.5 rounded-full bg-info" />
                            <span className="text-[10px] font-medium text-info uppercase tracking-wider">Reclamante</span>
                          </div>
                          <span className="text-[12px] font-medium text-foreground">{event.partes.reclamante}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="size-1.5 rounded-full bg-destructive" />
                            <span className="text-[10px] font-medium text-destructive uppercase tracking-wider">Reclamada</span>
                          </div>
                          <span className="text-[12px] font-medium text-foreground">{event.partes.reclamada}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Checklist */}
            {event.source === "audiencias" && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="size-3.5 text-muted-foreground/40" />
                  <span className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wider">Checklist de Preparo</span>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    prepPct >= 80 ? "bg-success/15 text-success" : prepPct >= 40 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive",
                  )}>
                    {prepPct}%
                  </span>
                </div>
                <div className="rounded-xl border border-border/15 bg-muted/[0.04] divide-y divide-border/10">
                  {checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <div className={cn(
                        "size-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                        item.done
                          ? "border-success bg-success/10"
                          : "border-border/30 bg-transparent",
                      )}>
                        {item.done && <Check className="size-3 text-success" />}
                      </div>
                      <span className={cn(
                        "text-[13px]",
                        item.done ? "text-foreground" : "text-muted-foreground/50",
                      )}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observacoes */}
            {event.descricao && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="size-3.5 text-muted-foreground/40" />
                  <span className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wider">Observacoes</span>
                </div>
                <div className="rounded-xl border border-border/15 bg-muted/[0.04] p-4">
                  <p className="text-[13px] text-muted-foreground/60 leading-relaxed">
                    {event.descricao}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-7 py-4 border-t border-border/15 flex-shrink-0">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border/30 text-foreground/70 rounded-xl text-[13px] font-medium hover:bg-muted/10 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 px-4 py-2 border border-border/30 text-foreground/70 rounded-xl text-[13px] font-medium hover:bg-muted/10 transition-colors cursor-pointer">
                <Pencil className="size-4" /> Editar
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[13px] font-medium hover:bg-primary/90 transition-colors cursor-pointer">
                <CheckCircle className="size-4" /> Marcar Preparado
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
