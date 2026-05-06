/**
 * AgendaEventDetail — Dialog de detalhes de evento
 * ============================================================================
 * Light glass dialog com:
 * - Header: ícone + título + status badge + close
 * - Meta strip: horário, modalidade, tribunal, responsável
 * - Action buttons: Sala Virtual, Visualizar Ata, Abrir PJe
 * - Processo vinculado: número, partes, link
 * - Checklist de preparo
 * - Observações
 *
 * Usa Dialog de @/components/ui/dialog para overlay e glass dialog styling.
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
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

const DAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
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
  if (!event) return null;

  const dateStr = `${DAY_NAMES[event.start.getDay()]}, ${event.start.getDate()} de ${MONTH_NAMES[event.start.getMonth()]} de ${event.start.getFullYear()}`;
  const colors = sourceColorClasses(event.source);
  const prepDone = checklist.filter((c) => c.done).length;
  const prepTotal = checklist.length;
  const prepPct = prepTotal > 0 ? Math.round((prepDone / prepTotal) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className=" flex max-h-[92vh] w-[95vw] flex-col overflow-hidden p-0 gap-0 [scrollbar-width:thin] sm:max-w-3xl"
      >
        <DialogDescription className="sr-only">Detalhes do evento de agenda</DialogDescription>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* ── Header ── */}
          <div className={cn("px-7 pt-6 pb-0 shrink-0")}>
            {/* Top row */}
            <div className={cn("flex items-start justify-between inline-default mb-4")}>
              <div className={cn(/* design-system-escape: gap-3.5 gap sem token DS */ "flex items-start gap-3.5 flex-1 min-w-0")}>
                <div className={cn(
                  "size-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                  colors.bg,
                )}>
                  <Gavel className={cn("size-5", colors.text)} />
                </div>
                <div className="min-w-0">
                  <div className={cn("flex items-center inline-tight-plus flex-wrap mb-1")}>
                    <DialogTitle
                      className={cn( "text-[17px] font-bold text-foreground")}
                    >
                      {event.title}
                    </DialogTitle>
                    {event.status && (
                      <span className={cn(
                        /* design-system-escape: gap-1 gap sem token DS; px-2.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption" as="div">; */ /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; */ "inline-flex items-center inline-micro px-2.5 py-0.5 rounded-full text-caption font-medium",
                        statusClasses(event.status),
                      )}>
                        <CircleDot className="size-3" />
                        {event.status}
                      </span>
                    )}
                  </div>
                  <p className={cn("text-[13px] text-muted-foreground/60 flex items-center inline-snug")}>
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
            <div className={cn(/* design-system-escape: p-3.5 → usar <Inset> */ "flex inline-none mb-4 rounded-xl border border-border/15 bg-muted/4 p-3.5")}>
              {/* Horário */}
              <div className="flex-1">
<Text variant="overline" as="span" className="text-muted-foreground/40">Horário</Text>
                <div className={cn( "flex items-center inline-snug mt-1 text-[13.5px] font-medium text-foreground")}>
                  <Clock className="size-3.5 text-muted-foreground/40" />
                  {fmtTime(event.start)} – {fmtTime(event.end)}
                </div>
              </div>
              <div className={cn("w-px bg-border/15 mx-4")} />
              {/* Modalidade */}
              <div className="flex-1">
<Text variant="overline" as="span" className="text-muted-foreground/40">Modalidade</Text>
                <div className="mt-1">
                  {event.modalidade ? (
                    <span className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; */ "inline-flex items-center inline-micro px-2 py-0.5 rounded-md text-[11.5px] font-medium bg-primary/10 text-primary")}>
                      {event.modalidade === "virtual" ? <Video className="size-3" /> : <MapPin className="size-3" />}
                      {event.modalidade === "virtual" ? "Virtual" : event.modalidade === "presencial" ? "Presencial" : "Híbrida"}
                    </span>
                  ) : (
                    <span className="text-[13px] text-muted-foreground/30">—</span>
                  )}
                </div>
              </div>
              <div className={cn("w-px bg-border/15 mx-4")} />
              {/* Tribunal */}
              <div className="flex-1">
<Text variant="overline" as="span" className="text-muted-foreground/40">Tribunal</Text>
                <div className={cn( "flex items-center inline-snug mt-1 text-[13.5px] font-medium text-foreground")}>
                  <Landmark className="size-3.5 text-muted-foreground/40" />
                  {event.trt ?? "—"}{event.grau ? ` · ${event.grau}` : ""}
                </div>
              </div>
              <div className={cn("w-px bg-border/15 mx-4")} />
              {/* Responsável */}
              <div className="flex-1">
<Text variant="overline" as="span" className="text-muted-foreground/40">Responsável</Text>
                <div className={cn( "flex items-center inline-snug mt-1 text-[13.5px] font-medium text-foreground")}>
                  {event.responsavel ? (
                    <>
                      <div className={cn( "size-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0")}>
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
              <div className={cn("flex items-center inline-tight-plus mb-5 flex-wrap")}>
                <button className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; */ "inline-flex items-center inline-tight px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[13px] font-medium hover:bg-primary/90 transition-colors cursor-pointer")}>
                  <Video className="size-4" /> Entrar na Sala Virtual
                </button>
                <button className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; */ "inline-flex items-center inline-tight px-4 py-2 border border-border/30 text-foreground/80 rounded-xl text-[13px] font-medium hover:bg-muted/10 transition-colors cursor-pointer")}>
                  <FileText className="size-4" /> Visualizar Ata
                </button>
                <button className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; */ "inline-flex items-center inline-tight px-4 py-2 border border-border/30 text-foreground/80 rounded-xl text-[13px] font-medium hover:bg-muted/10 transition-colors cursor-pointer")}>
                  <ExternalLink className="size-4" /> Abrir PJe
                </button>
              </div>
            )}

            <div className="h-px bg-border/15" />
          </div>

          {/* ── Scrollable Body ── */}
          <div className={cn("overflow-y-auto flex-1 px-7 py-5")} style={{ scrollbarWidth: "thin" }}>
            {/* Processo Section */}
            {event.processo && (
              <div className="mb-5">
                <div className={cn("flex items-center inline-tight mb-3")}>
                  <FileText className="size-3.5 text-muted-foreground/40" />
                  <Text variant="caption" className="font-semibold text-muted-foreground/40 uppercase tracking-wider">Processo Vinculado</Text>
                </div>
                <div className={cn("rounded-xl border border-border/15 bg-muted/4 inset-card-compact")}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={cn( "text-[12px] font-mono font-semibold text-foreground")}>{event.processo}</div>
                      {event.trt && (
                        <div className="text-[11px] text-muted-foreground/40 mt-1">
                          Vara do Trabalho · {event.trt}
                        </div>
                      )}
                    </div>
                    <button className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption" as="div">; */ /* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; */ "inline-flex items-center inline-snug px-3 py-1.5 border border-border/30 text-foreground/70 rounded-lg text-caption font-medium hover:bg-muted/10 transition-colors cursor-pointer")}>
                      <ExternalLink className="size-3" /> Ver Processo
                    </button>
                  </div>
                  {event.partes && (
                    <>
                      <div className={cn("h-px bg-border/10 my-3")} />
                      <div className={cn("flex inline-loose")}>
                        <div>
                          <div className={cn("flex items-center inline-snug mb-1")}>
                            <div className="size-1.5 rounded-full bg-info" />
                            <span className={cn("text-overline text-info")}>Reclamante</span>
                          </div>
                          <span className={cn( "text-[12px] font-medium text-foreground")}>{event.partes.reclamante}</span>
                        </div>
                        <div>
                          <div className={cn("flex items-center inline-snug mb-1")}>
                            <div className="size-1.5 rounded-full bg-destructive" />
                            <span className={cn("text-overline text-destructive")}>Reclamada</span>
                          </div>
                          <span className={cn( "text-[12px] font-medium text-foreground")}>{event.partes.reclamada}</span>
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
                <div className={cn("flex items-center inline-tight mb-3")}>
                  <ShieldCheck className="size-3.5 text-muted-foreground/40" />
                  <Text variant="caption" className="font-semibold text-muted-foreground/40 uppercase tracking-wider">Checklist de Preparo</Text>
                  <span className={cn(
                    /* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    prepPct >= 80 ? "bg-success/15 text-success" : prepPct >= 40 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive",
                  )}>
                    {prepPct}%
                  </span>
                </div>
                <div className="rounded-xl border border-border/15 bg-muted/4 divide-y divide-border/10">
                  {checklist.map((item, i) => (
                    <div key={i} className={cn("flex items-center inline-medium px-4 py-2.5")}>
                      <div className={cn(
                        "size-5 rounded border-2 flex items-center justify-center shrink-0",
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

            {/* Observações */}
            {event.descricao && (
              <div>
                <div className={cn("flex items-center inline-tight mb-3")}>
                  <MessageSquare className="size-3.5 text-muted-foreground/40" />
                  <Text variant="caption" className="font-semibold text-muted-foreground/40 uppercase tracking-wider">Observações</Text>
                </div>
                <div className={cn("rounded-xl border border-border/15 bg-muted/4 inset-card-compact")}>
                  <p className={cn("text-[13px] text-muted-foreground/60 leading-relaxed")}>
                    {event.descricao}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className={cn("flex items-center justify-between px-7 py-4 border-t border-border/15 shrink-0")}>
            <button
              onClick={onClose}
              className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; */ "inline-flex items-center inline-tight px-4 py-2 border border-border/30 text-foreground/70 rounded-xl text-[13px] font-medium hover:bg-muted/10 transition-colors cursor-pointer")}
            >
              Fechar
            </button>
            <div className={cn("flex inline-tight")}>
              <button className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; */ "inline-flex items-center inline-tight px-4 py-2 border border-border/30 text-foreground/70 rounded-xl text-[13px] font-medium hover:bg-muted/10 transition-colors cursor-pointer")}>
                <Pencil className="size-4" /> Editar
              </button>
              <button className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; */ "inline-flex items-center inline-tight px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[13px] font-medium hover:bg-primary/90 transition-colors cursor-pointer")}>
                <CheckCircle className="size-4" /> Marcar Preparado
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
