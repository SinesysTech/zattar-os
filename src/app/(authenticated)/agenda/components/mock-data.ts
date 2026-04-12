/**
 * Mock Data — Dados para desenvolvimento visual das views da Agenda
 * ============================================================================
 * Tipos locais + dados ficticios para montar as views mockadas.
 * Em producao, estes dados virao de AgendaEvent (via adapters.ts).
 * ============================================================================
 */

import type { LucideIcon } from "lucide-react";
import {
  Gavel,
  FileText,
  CreditCard,
  Stethoscope,
  CalendarDays,
  AlertCircle,
} from "lucide-react";

// ─── Event Source ──────────────────────────────────────────────────────

export type AgendaSource =
  | "audiencias"
  | "expedientes"
  | "obrigacoes"
  | "pericias"
  | "agenda"
  | "prazos";

export interface SourceConfig {
  label: string;
  icon: LucideIcon;
  /** Tailwind color token (sem prefixo bg-/text-) */
  color: string;
}

export const SOURCE_CONFIGS: Record<AgendaSource, SourceConfig> = {
  audiencias:  { label: "Audiencias",  icon: Gavel,        color: "info" },
  expedientes: { label: "Expedientes", icon: FileText,     color: "warning" },
  obrigacoes:  { label: "Obrigacoes",  icon: CreditCard,   color: "warning" },
  pericias:    { label: "Pericias",    icon: Stethoscope,  color: "primary" },
  agenda:      { label: "Pessoal",     icon: CalendarDays,  color: "primary" },
  prazos:      { label: "Prazos",      icon: AlertCircle,   color: "destructive" },
};

// ─── Prep Status ──────────────────────────────────────────────────────

export type PrepStatus = "preparado" | "parcial" | "pendente";

// ─── Mock Event ───────────────────────────────────────────────────────

export interface MockEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  source: AgendaSource;
  /** Numero do processo vinculado */
  processo?: string;
  /** Partes (reclamante vs reclamada) */
  partes?: { reclamante: string; reclamada: string };
  /** Tribunal */
  trt?: string;
  /** Grau */
  grau?: string;
  /** Modalidade */
  modalidade?: "virtual" | "presencial" | "hibrida" | null;
  /** Responsavel */
  responsavel?: { iniciais: string; nome: string };
  /** Status do preparo */
  prepStatus?: PrepStatus;
  /** Percentual de preparo (0-100) */
  prepPercent?: number;
  /** Se e prazo fatal */
  fatal?: boolean;
  /** Status generico */
  status?: string;
  /** Descricao / observacoes */
  descricao?: string;
  /** Local */
  local?: string;
}

// ─── KPI Data ─────────────────────────────────────────────────────────

export interface AgendaKpi {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  suffix?: string;
}

// ─── Deadline Data ────────────────────────────────────────────────────

export interface Deadline {
  id: string;
  label: string;
  processo: string;
  daysLeft: number;
  fatal: boolean;
}

// ─── Prep Item ────────────────────────────────────────────────────────

export interface PrepItem {
  id: string;
  label: string;
  date: string;
  percent: number;
  missing?: string;
}

// ─── Alert Item ───────────────────────────────────────────────────────

export interface AlertItem {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
}

// ─── Checklist Item ───────────────────────────────────────────────────

export interface ChecklistItem {
  label: string;
  done: boolean;
}

// ─── Factory: Mock Events for April 2026 ──────────────────────────────

function d(day: number, h: number, m = 0) {
  return new Date(2026, 3, day, h, m); // April = month 3
}

export const MOCK_EVENTS: MockEvent[] = [
  {
    id: "aud-1",
    title: "Audiencia de Instrucao e Julgamento",
    start: d(13, 9, 30),
    end: d(13, 11, 0),
    allDay: false,
    source: "audiencias",
    processo: "0012345-67.2025.5.01.0001",
    partes: { reclamante: "Jose da Silva", reclamada: "Empresa ABC Ltda" },
    trt: "TRT1",
    grau: "1o Grau",
    modalidade: "virtual",
    responsavel: { iniciais: "MS", nome: "Dra. Maria Santos" },
    prepStatus: "parcial",
    prepPercent: 60,
    status: "Marcada",
    descricao:
      "Reclamante alega adicional de insalubridade grau maximo. Empresa contesta com laudo pericial proprio. Verificar se perito judicial foi nomeado. Audiencia anterior foi adiada por ausencia do preposto.",
  },
  {
    id: "prazo-1",
    title: "Prazo: Recurso Ordinario",
    start: d(13, 14, 0),
    end: d(13, 14, 0),
    allDay: false,
    source: "prazos",
    processo: "0067890-12.2024.5.01.0042",
    partes: { reclamante: "Pereira", reclamada: "Industria XYZ S.A." },
    trt: "TRT1",
    grau: "1o Grau",
    fatal: true,
    status: "Pendente",
  },
  {
    id: "exp-1",
    title: "Publicacao DJE",
    start: d(14, 9, 0),
    end: d(14, 9, 30),
    allDay: false,
    source: "expedientes",
    processo: "0034567-89.2024.5.02.0015",
    partes: { reclamante: "Oliveira", reclamada: "Comercio Beta Ltda" },
    status: "Recebido",
  },
  {
    id: "pessoal-1",
    title: "Reuniao Equipe",
    start: d(14, 10, 0),
    end: d(14, 11, 0),
    allDay: false,
    source: "agenda",
    local: "Escritorio — Sala 2",
  },
  {
    id: "aud-2",
    title: "Audiencia de Conciliacao",
    start: d(15, 9, 30),
    end: d(15, 11, 0),
    allDay: false,
    source: "audiencias",
    processo: "0098765-43.2025.5.02.0033",
    partes: { reclamante: "Santos", reclamada: "Construtora Gama" },
    trt: "TRT2",
    grau: "1o Grau",
    modalidade: "presencial",
    responsavel: { iniciais: "JM", nome: "Dr. Joao Medeiros" },
    prepStatus: "preparado",
    prepPercent: 100,
    status: "Marcada",
  },
  {
    id: "aud-3",
    title: "Audiencia de Julgamento",
    start: d(15, 13, 30),
    end: d(15, 15, 0),
    allDay: false,
    source: "audiencias",
    processo: "0011111-22.2025.5.01.0005",
    trt: "TRT1",
    modalidade: "virtual",
    responsavel: { iniciais: "MS", nome: "Dra. Maria Santos" },
    prepStatus: "parcial",
    prepPercent: 40,
    status: "Marcada",
  },
  {
    id: "pessoal-2",
    title: "Reuniao Cliente — Novo caso",
    start: d(15, 13, 30),
    end: d(15, 14, 30),
    allDay: false,
    source: "agenda",
    local: "Escritorio — Sala 3",
    responsavel: { iniciais: "JM", nome: "Jordan Medeiros" },
  },
  {
    id: "obr-1",
    title: "Pagamento FGTS Competencia",
    start: d(16, 10, 0),
    end: d(16, 10, 30),
    allDay: false,
    source: "obrigacoes",
    status: "Pendente",
  },
  {
    id: "exp-2",
    title: "Despacho Judicial",
    start: d(16, 14, 0),
    end: d(16, 14, 30),
    allDay: false,
    source: "expedientes",
    processo: "0055555-66.2024.5.01.0012",
    status: "Recebido",
  },
  {
    id: "per-1",
    title: "Pericia Medica",
    start: d(17, 9, 0),
    end: d(17, 12, 0),
    allDay: false,
    source: "pericias",
    processo: "0045678-90.2024.5.05.0008",
    partes: { reclamante: "Ferreira", reclamada: "Metalurgica Delta" },
    responsavel: { iniciais: "CL", nome: "Dr. Carlos Lima" },
    prepStatus: "pendente",
    prepPercent: 25,
    status: "Ag. Laudo",
    modalidade: "presencial",
  },
  {
    id: "aud-4",
    title: "Audiencia de Instrucao",
    start: d(17, 14, 0),
    end: d(17, 16, 0),
    allDay: false,
    source: "audiencias",
    trt: "TRT5",
    modalidade: "virtual",
    status: "Marcada",
    responsavel: { iniciais: "MS", nome: "Dra. Maria Santos" },
    prepStatus: "pendente",
    prepPercent: 10,
  },
  {
    id: "pessoal-3",
    title: "Atendimento Cliente",
    start: d(14, 15, 0),
    end: d(14, 16, 0),
    allDay: false,
    source: "agenda",
    local: "Escritorio — Sala 3",
    responsavel: { iniciais: "RM", nome: "Roberto Mendes" },
  },
  {
    id: "aud-5",
    title: "Audiencia de Instrucao",
    start: d(20, 10, 0),
    end: d(20, 12, 0),
    allDay: false,
    source: "audiencias",
    trt: "TRT1",
    modalidade: "virtual",
    status: "Marcada",
  },
  {
    id: "exp-3",
    title: "Intimacao",
    start: d(22, 9, 0),
    end: d(22, 9, 30),
    allDay: false,
    source: "expedientes",
    status: "Recebido",
  },
  {
    id: "aud-6",
    title: "Audiencia de Conciliacao",
    start: d(28, 10, 0),
    end: d(28, 11, 30),
    allDay: false,
    source: "audiencias",
    trt: "TRT2",
    modalidade: "presencial",
    status: "Marcada",
  },
  {
    id: "prazo-2",
    title: "Contestacao",
    start: d(13, 23, 59),
    end: d(13, 23, 59),
    allDay: false,
    source: "prazos",
    processo: "0012345-00.2025.5.01.0001",
    fatal: true,
    status: "Pendente",
  },
  {
    id: "prazo-3",
    title: "Recurso Ordinario",
    start: d(15, 23, 59),
    end: d(15, 23, 59),
    allDay: false,
    source: "prazos",
    processo: "0067890-00.2024.5.01.0042",
    fatal: false,
    status: "Pendente",
  },
  {
    id: "prazo-4",
    title: "Juntada de Documentos",
    start: d(17, 23, 59),
    end: d(17, 23, 59),
    allDay: false,
    source: "prazos",
    processo: "0045678-00.2024.5.05.0008",
    fatal: false,
    status: "Pendente",
  },
];

// ─── Mock Deadlines ───────────────────────────────────────────────────

export const MOCK_DEADLINES: Deadline[] = [
  { id: "dl-1", label: "Contestacao — Proc. 0012345", processo: "0012345-00.2025.5.01.0001", daysLeft: 1, fatal: true },
  { id: "dl-2", label: "Recurso Ordinario — Proc. 0067890", processo: "0067890-00.2024.5.01.0042", daysLeft: 3, fatal: false },
  { id: "dl-3", label: "Juntada de Documentos — 0045678", processo: "0045678-00.2024.5.05.0008", daysLeft: 5, fatal: false },
];

// ─── Mock Prep Items ──────────────────────────────────────────────────

export const MOCK_PREP_ITEMS: PrepItem[] = [
  { id: "prep-1", label: "Aud. Instrucao (09:30)", date: "13/04", percent: 60, missing: "Rol de testemunhas" },
  { id: "prep-2", label: "Aud. Conciliacao (15/04)", date: "15/04", percent: 100 },
  { id: "prep-3", label: "Pericia Medica (17/04)", date: "17/04", percent: 25, missing: "Laudo medico, Quesitos" },
];

// ─── Mock Alerts ──────────────────────────────────────────────────────

export const MOCK_ALERTS: AlertItem[] = [
  { id: "alert-1", severity: "critical", title: "Prazo Fatal Hoje", description: "Recurso Ordinario 14:00" },
  { id: "alert-2", severity: "warning", title: "Conflito 15/04", description: "2 eventos as 13:30" },
  { id: "alert-3", severity: "info", title: "Preparo Pendente", description: "Pericia 17/04 — 25%" },
];

// ─── Mock Checklist (for dialog) ──────────────────────────────────────

export const MOCK_CHECKLIST: ChecklistItem[] = [
  { label: "Documentacao do processo revisada", done: true },
  { label: "Estrategia de argumentacao definida", done: true },
  { label: "Sala virtual testada", done: true },
  { label: "Rol de testemunhas confirmado", done: false },
  { label: "Calculos atualizados", done: false },
];

// ─── Source color helpers ─────────────────────────────────────────────

/** Maps source to Tailwind color classes for consistent theming */
export function sourceColorClasses(source: AgendaSource) {
  const map: Record<AgendaSource, { bg: string; text: string; border: string; dot: string }> = {
    audiencias:  { bg: "bg-info/15",        text: "text-info",        border: "border-info/20",        dot: "bg-info" },
    expedientes: { bg: "bg-warning/15",     text: "text-warning",     border: "border-warning/20",     dot: "bg-warning" },
    obrigacoes:  { bg: "bg-warning/15",     text: "text-warning",     border: "border-warning/20",     dot: "bg-warning" },
    pericias:    { bg: "bg-primary/15",     text: "text-primary",     border: "border-primary/20",     dot: "bg-primary" },
    agenda:      { bg: "bg-primary/15",     text: "text-primary",     border: "border-primary/20",     dot: "bg-primary" },
    prazos:      { bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/20", dot: "bg-destructive" },
  };
  return map[source];
}
