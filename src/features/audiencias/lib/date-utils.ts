/**
 * Utilitários de data/hora usados pela feature de Audiências.
 *
 * Nota: este arquivo existia em `src/lib/date-utils.ts`, mas era usado somente
 * pela feature `audiencias`, então foi movido para manter o microcosmo da feature
 * fechado em si mesmo.
 */

import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIMEZONE = "America/Sao_Paulo";

/**
 * Converte strings de data e hora locais para uma string ISO.
 *
 * @param dateStr - Data no formato 'YYYY-MM-DD'
 * @param timeStr - Hora no formato 'HH:mm'
 */
export function localToISO(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  return date.toISOString();
}

export function formatDateBR(
  isoStr: string | Date | null | undefined,
  formatStr: string = "dd/MM/yyyy HH:mm"
): string {
  if (!isoStr) return "";

  const date = typeof isoStr === "string" ? parseISO(isoStr) : isoStr;
  if (!isValid(date)) return "";

  return format(date, formatStr, { locale: ptBR });
}

export function isoToDate(isoStr: string | null | undefined): Date | null {
  if (!isoStr) return null;
  const date = parseISO(isoStr);
  return isValid(date) ? date : null;
}

export function nowBR(): Date {
  return new Date();
}

export function formatForDateInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "yyyy-MM-dd");
}

export function formatForTimeInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "HH:mm");
}

export function extractDatePart(isoStr: string | null | undefined): string {
  if (!isoStr) return "";
  const date = parseISO(isoStr);
  if (!isValid(date)) return "";
  return format(date, "yyyy-MM-dd");
}

export function extractTimePart(isoStr: string | null | undefined): string {
  if (!isoStr) return "";
  const date = parseISO(isoStr);
  if (!isValid(date)) return "";
  return format(date, "HH:mm");
}

export function isValidDateString(str: string | null | undefined): boolean {
  if (!str) return false;
  const date = parseISO(str);
  return isValid(date);
}

export function getTimezone(): string {
  return TIMEZONE;
}


