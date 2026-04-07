/**
 * Briefing Domain — Tipos para a view "Briefing" da Agenda
 * ============================================================================
 * Extensoes do dominio de calendario para suportar:
 * - PrepStatus (status de preparacao de audiencias/eventos)
 * - DaySummary (resumo estatistico do dia)
 * - WeekPulseDay (intensidade diaria da semana)
 * - CalendarView (5 views incluindo briefing)
 * - SOURCE_CONFIG e COLOR_MAP (config visual por fonte/cor)
 * ============================================================================
 */

import type { CalendarSource } from "./domain";

// ─── Prep Status ───────────────────────────────────────────────────────

export type PrepStatus = "preparado" | "parcial" | "pendente";

// ─── Calendar View (extended) ──────────────────────────────────────────

export type CalendarView = "month" | "week" | "day" | "agenda" | "briefing";

// ─── Briefing Event Metadata ───────────────────────────────────────────

/** Metadata enriquecido extraido de UnifiedCalendarEvent.metadata */
export interface BriefingEventMeta {
  processo?: string;
  trt?: string;
  grau?: string;
  modalidade?: "virtual" | "presencial" | "hibrida" | null;
  enderecoPresencial?: { cidade?: string; uf?: string } | null;
  urlAudienciaVirtual?: string | null;
  status?: string;
  prepStatus?: PrepStatus;
  prazoVencido?: boolean;
  parcelaNum?: number;
  valor?: number;
  descricao?: string;
  local?: string;
  responsavelNome?: string;
}

// ─── Day Summary ───────────────────────────────────────────────────────

export interface DaySummary {
  total: number;
  audiencias: number;
  horasOcupado: string;
  horasFoco: string;
  alertas: number;
}

// ─── Week Pulse ────────────────────────────────────────────────────────

export interface WeekPulseDay {
  date: Date;
  dia: string;
  eventos: number;
  horas: number;
  hoje: boolean;
}

// ─── Event Color ───────────────────────────────────────────────────────

export type EventColor = "sky" | "amber" | "violet" | "rose" | "emerald" | "orange";

export interface ColorConfig {
  /** Tailwind bg class with opacity for light/dark */
  bg: string;
  /** Solid bg class for dots/indicators */
  bgSolid: string;
  /** Tailwind text class for light/dark */
  text: string;
  /** Tailwind border class */
  border: string;
  /** CSS hsl value for inline styles */
  dot: string;
}

/**
 * COLOR_MAP — Compat shim sobre @/lib/design-system/event-colors.
 * Delega para o helper canônico. Em código novo, importe direto:
 *   import { getEventColorClasses } from '@/lib/design-system/event-colors'
 */
import { getEventColorClasses as _getEventColorClasses } from "@/lib/design-system/event-colors";

function _buildBriefingEntry(legacy: EventColor): ColorConfig {
  const c = _getEventColorClasses(legacy);
  return {
    bg: c.bgSoft,
    bgSolid: c.bgSolid,
    text: c.text,
    border: c.border,
    dot: c.dot,
  };
}

export const COLOR_MAP: Record<EventColor, ColorConfig> = {
  sky:     _buildBriefingEntry("sky"),
  amber:   _buildBriefingEntry("amber"),
  violet:  _buildBriefingEntry("violet"),
  rose:    _buildBriefingEntry("rose"),
  emerald: _buildBriefingEntry("emerald"),
  orange:  _buildBriefingEntry("orange"),
};

// ─── Source Config ──────────────────────────────────────────────────────

export interface SourceConfig {
  label: string;
  defaultColor: EventColor;
}

export const SOURCE_CONFIG: Record<CalendarSource, SourceConfig> = {
  agenda:      { label: "Agenda",      defaultColor: "violet" },
  audiencias:  { label: "Audiências",  defaultColor: "sky" },
  expedientes: { label: "Expedientes", defaultColor: "amber" },
  obrigacoes:  { label: "Obrigações",  defaultColor: "amber" },
  pericias:    { label: "Perícias",    defaultColor: "violet" },
};
