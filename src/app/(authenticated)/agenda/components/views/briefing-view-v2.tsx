/**
 * BriefingViewV2 — Vista de briefing diario redesenhada
 * ============================================================================
 * Recebe AgendaEvent[] (dados reais). Timeline narrativa com sidebar.
 * ============================================================================
 */

"use client";

import { useMemo } from "react";
import {
  Sparkles,
  Sun,
  Sunset,
  Landmark,
  Video,
  MapPin,
  FileText,
  ExternalLink,
  ShieldCheck,
  Bell,
  Zap,
  AlertCircle,
  TriangleAlert,
  Clock,
  FilePen,
  Users,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/shared/glass-panel";
import { PrepProgress } from "../prep-progress";
import type { AgendaEvent } from "../../lib/adapters";
import type { AlertItem, PrepItem } from "../mock-data";

// ─── Types ────────────────────────────────────────────────────────────

export interface BriefingViewV2Props {
  currentDate: Date;
  events: AgendaEvent[];
  userName?: string;
  onEventClick?: (e: AgendaEvent) => void;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function fmtTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const DAY_NAMES = ["Domingo", "Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado"];
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function sourceColors(source: string) {
  const map: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    audiencias:  { bg: "bg-info/15",        text: "text-info",        border: "border-info/20",        dot: "bg-info",        label: "Audiencia" },
    expedientes: { bg: "bg-warning/15",     text: "text-warning",     border: "border-warning/20",     dot: "bg-warning",     label: "Expediente" },
    obrigacoes:  { bg: "bg-warning/15",     text: "text-warning",     border: "border-warning/20",     dot: "bg-warning",     label: "Obrigacao" },
    pericias:    { bg: "bg-primary/15",     text: "text-primary",     border: "border-primary/20",     dot: "bg-primary",     label: "Pericia" },
    agenda:      { bg: "bg-primary/15",     text: "text-primary",     border: "border-primary/20",     dot: "bg-primary",     label: "Pessoal" },
  };
  return map[source] ?? { bg: "bg-muted/15", text: "text-muted-foreground", border: "border-border/20", dot: "bg-muted-foreground", label: source };
}

// ─── Event Card ───────────────────────────────────────────────────────

function BriefingEventCard({ event, onClick }: { event: AgendaEvent; onClick?: () => void }) {
  const colors = sourceColors(event.source);
  const isFatal = event.meta?.prazoVencido;
  const prepPct = event.meta?.prepStatus === "preparado" ? 100 : event.meta?.prepStatus === "parcial" ? 60 : event.meta?.prepStatus === "pendente" ? 20 : undefined;

  return (
    <button onClick={onClick} className={cn("w-full text-left rounded-xl p-4 bg-muted/[0.035] border border-border/8 transition-all hover:bg-muted/[0.06] hover:border-border/15 cursor-pointer", isFatal && "border-destructive/15")}>
      <div className="flex items-start gap-4">
        <div className="text-right flex-shrink-0 w-14">
          <div className={cn("text-sm font-mono font-bold tabular-nums", isFatal ? "text-destructive" : "text-foreground")}>{fmtTime(event.start)}</div>
          {event.start.getTime() !== event.end.getTime() && <div className="text-[9px] text-muted-foreground/40 font-mono tabular-nums">{fmtTime(event.end)}</div>}
          {isFatal && <div className="text-[9px] text-destructive/60 font-bold uppercase mt-0.5">FATAL</div>}
        </div>
        <div className={cn("w-1 self-stretch rounded-full flex-shrink-0", colors.dot)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-foreground">{event.title}</span>
            <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border", colors.bg, colors.text, colors.border)}>{colors.label}</span>
            {event.meta?.status && (
              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border",
                event.meta?.status === "Marcada" && "bg-success/15 text-success border-success/20",
                event.meta?.status === "Pendente" && "bg-warning/15 text-warning border-warning/20",
              )}>{event.meta?.status}</span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground/45">
            {event.meta?.trt && <span className="flex items-center gap-1"><Landmark className="size-3" /> {event.meta?.trt}{event.meta?.grau ? ` · ${event.meta?.grau}` : ""}</span>}
            {event.meta?.modalidade && <span className="flex items-center gap-1">{event.meta?.modalidade === "virtual" ? <Video className="size-3" /> : <MapPin className="size-3" />} {event.meta?.modalidade === "virtual" ? "Virtual" : "Presencial"}</span>}
            {event.meta?.local && <span className="flex items-center gap-1"><MapPin className="size-3" /> {event.meta?.local}</span>}
          </div>
          {event.meta?.processo && (
            <div className="mt-2 p-2 rounded-lg bg-muted/[0.03] border border-border/6 flex items-center gap-3">
              <FileText className="size-3.5 text-muted-foreground/35 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-muted-foreground/50">{event.meta?.processo}</div>
              </div>
              <ExternalLink className="size-3 text-muted-foreground/25 flex-shrink-0" />
            </div>
          )}
          {prepPct != null && <div className="mt-2"><PrepProgress percent={prepPct} size="sm" /></div>}
          {event.meta?.responsavelNome && (
            <div className="flex items-center gap-2 mt-2">
              <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary flex-shrink-0">
                {event.meta?.responsavelNome.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <span className="text-[10px] text-muted-foreground/45">{event.meta?.responsavelNome}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export function BriefingViewV2({ currentDate, events, userName = "Jordan", onEventClick, className }: BriefingViewV2Props) {
  const dayEvents = useMemo(
    () => events.filter((e) => isSameDay(e.start, currentDate)).sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events, currentDate],
  );

  const morning = dayEvents.filter((e) => e.start.getHours() < 12);
  const afternoon = dayEvents.filter((e) => e.start.getHours() >= 12);
  const audienciaCount = dayEvents.filter((e) => e.source === "audiencias").length;
  const dateStr = `${DAY_NAMES[currentDate.getDay()]}, ${currentDate.getDate()} de ${MONTH_NAMES[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;

  // Derive prep items from events with prepStatus
  const prepItems: PrepItem[] = useMemo(() => {
    return events
      .filter((e) => e.meta?.prepStatus)
      .map((e) => ({
        id: e.id,
        label: `${e.title.slice(0, 25)}${e.title.length > 25 ? "..." : ""} (${fmtTime(e.start)})`,
        date: `${e.start.getDate()}/${String(e.start.getMonth() + 1).padStart(2, "0")}`,
        percent: e.meta?.prepStatus === "preparado" ? 100 : e.meta?.prepStatus === "parcial" ? 60 : 20,
      }))
      .slice(0, 5);
  }, [events]);

  // Derive alerts
  const alerts: AlertItem[] = useMemo(() => {
    const items: AlertItem[] = [];
    const now = new Date();
    // Fatal deadlines today
    dayEvents.filter((e) => e.meta?.prazoVencido).forEach((e) => {
      items.push({ id: `alert-${e.id}`, severity: "critical", title: "Prazo Fatal Hoje", description: `${e.title} ${fmtTime(e.start)}` });
    });
    // Low prep
    events.filter((e) => e.meta?.prepStatus === "pendente" && e.start > now).forEach((e) => {
      items.push({ id: `alert-prep-${e.id}`, severity: "info", title: "Preparo Pendente", description: `${e.title.slice(0, 20)} — ${e.start.getDate()}/${String(e.start.getMonth() + 1).padStart(2, "0")}` });
    });
    return items.slice(0, 4);
  }, [events, dayEvents]);

  return (
    <div className={cn("flex gap-4", className)}>
      <div className="flex-1 space-y-4 min-w-0">
        {/* Narrative */}
        <GlassPanel className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center"><Sparkles className="size-4 text-primary" /></div>
            <div>
              <div className="text-sm font-semibold text-foreground">Bom dia, {userName}</div>
              <div className="text-xs text-muted-foreground/50">{dateStr}</div>
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground/60 leading-relaxed">
            Voce tem <span className="text-foreground font-semibold">{dayEvents.length} compromissos</span> hoje
            {audienciaCount > 0 && <>, incluindo <span className="text-info font-semibold">{audienciaCount} audiencia{audienciaCount > 1 ? "s" : ""}</span></>}.
            {dayEvents.length === 0 && " Dia livre para foco e preparacao."}
          </p>
        </GlassPanel>

        {/* Morning */}
        {morning.length > 0 && (
          <>
            <div className="flex items-center gap-3 mt-6 mb-3">
              <Sun className="size-4 text-warning" />
              <span className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider">Manha</span>
              <div className="flex-1 h-px bg-border/8" />
            </div>
            {morning.map((evt) => <BriefingEventCard key={evt.id} event={evt} onClick={() => onEventClick?.(evt)} />)}
          </>
        )}

        {/* Afternoon */}
        {afternoon.length > 0 && (
          <>
            <div className="flex items-center gap-3 mt-6 mb-3">
              <Sunset className="size-4 text-warning/70" />
              <span className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider">Tarde</span>
              <div className="flex-1 h-px bg-border/8" />
            </div>
            {afternoon.map((evt) => <BriefingEventCard key={evt.id} event={evt} onClick={() => onEventClick?.(evt)} />)}
          </>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-64 flex-shrink-0 space-y-4 hidden lg:flex lg:flex-col">
        {prepItems.length > 0 && (
          <GlassPanel className="p-4">
            <div className="flex items-center gap-2 mb-3"><ShieldCheck className="size-3.5 text-primary" /><span className="text-xs font-semibold text-foreground">Radar de Preparo</span></div>
            <div className="space-y-3">{prepItems.map((item) => <PrepProgress key={item.id} label={item.label} percent={item.percent} size="md" />)}</div>
          </GlassPanel>
        )}
        {alerts.length > 0 && (
          <GlassPanel className="p-4">
            <div className="flex items-center gap-2 mb-3"><Bell className="size-3.5 text-warning" /><span className="text-xs font-semibold text-foreground">Alertas</span></div>
            <div className="space-y-2">
              {alerts.map((alert) => {
                const Icon = alert.severity === "critical" ? AlertCircle : alert.severity === "warning" ? TriangleAlert : Clock;
                const cls = alert.severity === "critical" ? "bg-destructive/[0.06] border-destructive/10 text-destructive" : "bg-warning/[0.04] border-warning/8 text-warning";
                return (
                  <div key={alert.id} className={cn("flex items-start gap-2 p-2 rounded-lg border", cls)}>
                    <Icon className="size-3.5 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-semibold">{alert.title}</div>
                      <div className="text-[9px] text-muted-foreground/40">{alert.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        )}
        <GlassPanel className="p-4">
          <div className="flex items-center gap-2 mb-3"><Zap className="size-3.5 text-primary" /><span className="text-xs font-semibold text-foreground">Acoes Rapidas</span></div>
          <div className="space-y-1.5">
            {[
              { icon: ExternalLink, label: "Abrir PJe" },
              { icon: FilePen, label: "Preparar Peca" },
              { icon: Users, label: "Confirmar Testemunhas" },
              { icon: CalendarCheck, label: "Pauta da Semana" },
            ].map((a) => (
              <button key={a.label} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-muted-foreground/60 hover:bg-muted/10 hover:text-muted-foreground transition-colors cursor-pointer">
                <a.icon className="size-3.5 text-muted-foreground/35" />{a.label}
              </button>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
