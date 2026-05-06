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
          <div className={cn(/* design-system-escape: px-7 padding direcional sem Inset equiv.; pt-6 padding direcional sem Inset equiv.; pb-0 padding direcional sem Inset equiv. */ "px-7 pt-6 pb-0 shrink-0")}>
            {/* Top row */}
            <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-start justify-between gap-4 mb-4")}>
              <div className={cn(/* design-system-escape: gap-3.5 gap sem token DS */ "flex items-start gap-3.5 flex-1 min-w-0")}>
                <div className={cn(
                  "size-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                  colors.bg,
                )}>
                  <Gavel className={cn("size-5", colors.text)} />
                </div>
                <div className="min-w-0">
                  <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS */ "flex items-center gap-2.5 flex-wrap mb-1")}>
                    <DialogTitle
                      className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-[17px] font-bold text-foreground")}
                    >
                      {event.title}
                    </DialogTitle>
                    {event.status && (
                      <span className={cn(
                        /* design-system-escape: gap-1 gap sem token DS; px-2.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading> */ /* design-system-escape: gap-1 gap sem token DS; px-2.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading> */ "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                        statusClasses(event.status),
                      )}>
                        <CircleDot className="size-3" />
                        {event.status}
                      </span>
                    )}
                  </div>
                  <p className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "text-[13px] text-muted-foreground/60 flex items-center gap-1.5")}>
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
            <div className={cn(/* design-system-escape: gap-0 gap sem token DS; p-3.5 → usar <Inset> */ "flex gap-0 mb-4 rounded-xl border border-border/15 bg-muted/4 p-3.5")}>
              {/* Horário */}
              <div className="flex-1">
<Text variant="overline" as="span" className="text-muted-foreground/40">Horário</Text>
                <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS; font-medium → className de <Text>/<Heading> */ "flex items-center gap-1.5 mt-1 text-[13.5px] font-medium text-foreground")}>
                  <Clock className="size-3.5 text-muted-foreground/40" />
                  {fmtTime(event.start)} – {fmtTime(event.end)}
                </div>
              </div>
              <div className={cn(/* design-system-escape: mx-4 margin sem primitiva DS */ "w-px bg-border/15 mx-4")} />
              {/* Modalidade */}
              <div className="flex-1">
<Text variant="overline" as="span" className="text-muted-foreground/40">Modalidade</Text>
                <div className="mt-1">
                  {event.modalidade ? (
                    <span className={cn(/* design-system-escape: gap-1 gap sem token DS; px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11.5px] font-medium bg-primary/10 text-primary")}>
                      {event.modalidade === "virtual" ? <Video className="size-3" /> : <MapPin className="size-3" />}
                      {event.modalidade === "virtual" ? "Virtual" : event.modalidade === "presencial" ? "Presencial" : "Híbrida"}
                    </span>
                  ) : (
                    <span className="text-[13px] text-muted-foreground/30">—</span>
                  )}
                </div>
              </div>
              <div className={cn(/* design-system-escape: mx-4 margin sem primitiva DS */ "w-px bg-border/15 mx-4")} />
              {/* Tribunal */}
              <div className="flex-1">
<Text variant="overline" as="span" className="text-muted-foreground/40">Tribunal</Text>
                <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS; font-medium → className de <Text>/<Heading> */ "flex items-center gap-1.5 mt-1 text-[13.5px] font-medium text-foreground")}>
                  <Landmark className="size-3.5 text-muted-foreground/40" />
                  {event.trt ?? "—"}{event.grau ? ` · ${event.grau}` : ""}
                </div>
              </div>
              <div className={cn(/* design-system-escape: mx-4 margin sem primitiva DS */ "w-px bg-border/15 mx-4")} />
              {/* Responsável */}
              <div className="flex-1">
<Text variant="overline" as="span" className="text-muted-foreground/40">Responsável</Text>
                <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS; font-medium → className de <Text>/<Heading> */ "flex items-center gap-1.5 mt-1 text-[13.5px] font-medium text-foreground")}>
                  {event.responsavel ? (
                    <>
                      <div className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "size-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0")}>
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
              <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS */ "flex items-center gap-2.5 mb-5 flex-wrap")}>
                <button className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[13px] font-medium hover:bg-primary/90 transition-colors cursor-pointer")}>
                  <Video className="size-4" /> Entrar na Sala Virtual
                </button>
                <button className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "inline-flex items-center gap-2 px-4 py-2 border border-border/30 text-foreground/80 rounded-xl text-[13px] font-medium hover:bg-muted/10 transition-colors cursor-pointer")}>
                  <FileText className="size-4" /> Visualizar Ata
                </button>
                <button className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "inline-flex items-center gap-2 px-4 py-2 border border-border/30 text-foreground/80 rounded-xl text-[13px] font-medium hover:bg-muted/10 transition-colors cursor-pointer")}>
                  <ExternalLink className="size-4" /> Abrir PJe
                </button>
              </div>
            )}

            <div className="h-px bg-border/15" />
          </div>

          {/* ── Scrollable Body ── */}
          <div className={cn(/* design-system-escape: px-7 padding direcional sem Inset equiv.; py-5 padding direcional sem Inset equiv. */ "overflow-y-auto flex-1 px-7 py-5")} style={{ scrollbarWidth: "thin" }}>
            {/* Processo Section */}
            {event.processo && (
              <div className="mb-5">
                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 mb-3")}>
                  <FileText className="size-3.5 text-muted-foreground/40" />
                  <Text variant="caption" className="font-semibold text-muted-foreground/40 uppercase tracking-wider">Processo Vinculado</Text>
                </div>
                <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "rounded-xl border border-border/15 bg-muted/4 p-4")}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[12px] font-mono font-semibold text-foreground")}>{event.processo}</div>
                      {event.trt && (
                        <div className="text-[11px] text-muted-foreground/40 mt-1">
                          Vara do Trabalho · {event.trt}
                        </div>
                      )}
                    </div>
                    <button className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading> */ /* design-system-escape: gap-1.5 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading> */ "inline-flex items-center gap-1.5 px-3 py-1.5 border border-border/30 text-foreground/70 rounded-lg text-xs font-medium hover:bg-muted/10 transition-colors cursor-pointer")}>
                      <ExternalLink className="size-3" /> Ver Processo
                    </button>
                  </div>
                  {event.partes && (
                    <>
                      <div className={cn(/* design-system-escape: my-3 margin sem primitiva DS */ "h-px bg-border/10 my-3")} />
                      <div className={cn(/* design-system-escape: gap-6 → migrar para <Inline gap="loose"> */ "flex gap-6")}>
                        <div>
                          <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 mb-1")}>
                            <div className="size-1.5 rounded-full bg-info" />
                            <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-info uppercase tracking-wider")}>Reclamante</span>
                          </div>
                          <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[12px] font-medium text-foreground")}>{event.partes.reclamante}</span>
                        </div>
                        <div>
                          <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 mb-1")}>
                            <div className="size-1.5 rounded-full bg-destructive" />
                            <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-destructive uppercase tracking-wider")}>Reclamada</span>
                          </div>
                          <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[12px] font-medium text-foreground")}>{event.partes.reclamada}</span>
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
                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 mb-3")}>
                  <ShieldCheck className="size-3.5 text-muted-foreground/40" />
                  <Text variant="caption" className="font-semibold text-muted-foreground/40 uppercase tracking-wider">Checklist de Preparo</Text>
                  <span className={cn(
                    /* design-system-escape: font-semibold → className de <Text>/<Heading>; px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    prepPct >= 80 ? "bg-success/15 text-success" : prepPct >= 40 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive",
                  )}>
                    {prepPct}%
                  </span>
                </div>
                <div className="rounded-xl border border-border/15 bg-muted/4 divide-y divide-border/10">
                  {checklist.map((item, i) => (
                    <div key={i} className={cn(/* design-system-escape: gap-3 gap sem token DS; px-4 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "flex items-center gap-3 px-4 py-2.5")}>
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
                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 mb-3")}>
                  <MessageSquare className="size-3.5 text-muted-foreground/40" />
                  <Text variant="caption" className="font-semibold text-muted-foreground/40 uppercase tracking-wider">Observações</Text>
                </div>
                <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "rounded-xl border border-border/15 bg-muted/4 p-4")}>
                  <p className={cn(/* design-system-escape: leading-relaxed sem token DS */ "text-[13px] text-muted-foreground/60 leading-relaxed")}>
                    {event.descricao}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className={cn(/* design-system-escape: px-7 padding direcional sem Inset equiv.; py-4 padding direcional sem Inset equiv. */ "flex items-center justify-between px-7 py-4 border-t border-border/15 shrink-0")}>
            <button
              onClick={onClose}
              className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "inline-flex items-center gap-2 px-4 py-2 border border-border/30 text-foreground/70 rounded-xl text-[13px] font-medium hover:bg-muted/10 transition-colors cursor-pointer")}
            >
              Fechar
            </button>
            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex gap-2")}>
              <button className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "inline-flex items-center gap-2 px-4 py-2 border border-border/30 text-foreground/70 rounded-xl text-[13px] font-medium hover:bg-muted/10 transition-colors cursor-pointer")}>
                <Pencil className="size-4" /> Editar
              </button>
              <button className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[13px] font-medium hover:bg-primary/90 transition-colors cursor-pointer")}>
                <CheckCircle className="size-4" /> Marcar Preparado
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
