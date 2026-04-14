/**
 * source-colors — Mapeamento canônico de AgendaSource → tokens --event-*
 * ============================================================================
 * Fonte única de verdade para cores por tipo de evento. Consumido por:
 *   - semana-view (chip + accent bar vertical)
 *   - mes-view (chip compacto)
 *   - ano-view / heatmaps
 *   - agenda-filter-bar (dot dos pills)
 *
 * Cada AgendaSource mapeia para um token --event-* distinto definido em
 * globals.css (linhas 795-807). Alterar a cor de um tipo = alterar lá.
 * ============================================================================
 */

import type { CalendarSource } from "@/app/(authenticated)/calendar";

export interface SourceColorClasses {
  /** tint de fundo (opacidade /18-/20) */
  bg: string;
  /** texto na cor do evento */
  text: string;
  /** borda sutil (/30-/32) */
  border: string;
  /** cor sólida — para accent bars e dots */
  accent: string;
}

const SOURCE_COLOR_MAP: Record<string, SourceColorClasses> = {
  audiencias:  { bg: "bg-event-audiencia/18",  text: "text-event-audiencia",  border: "border-event-audiencia/30",  accent: "bg-event-audiencia" },
  expedientes: { bg: "bg-event-expediente/20", text: "text-event-expediente", border: "border-event-expediente/32", accent: "bg-event-expediente" },
  obrigacoes:  { bg: "bg-event-obrigacao/18",  text: "text-event-obrigacao",  border: "border-event-obrigacao/30",  accent: "bg-event-obrigacao" },
  pericias:    { bg: "bg-event-pericia/18",    text: "text-event-pericia",    border: "border-event-pericia/30",    accent: "bg-event-pericia" },
  agenda:      { bg: "bg-event-agenda/18",     text: "text-event-agenda",     border: "border-event-agenda/30",     accent: "bg-event-agenda" },
  prazos:      { bg: "bg-event-prazo/18",      text: "text-event-prazo",      border: "border-event-prazo/32",      accent: "bg-event-prazo" },
};

const FALLBACK: SourceColorClasses = {
  bg: "bg-event-default/18",
  text: "text-event-default",
  border: "border-event-default/30",
  accent: "bg-event-default",
};

/** Retorna as classes Tailwind para uma AgendaSource/CalendarSource. */
export function getSourceColors(source: CalendarSource | string): SourceColorClasses {
  return SOURCE_COLOR_MAP[source] ?? FALLBACK;
}
