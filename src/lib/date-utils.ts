/**
 * Utilitários de data/hora para o timezone de São Paulo (America/Sao_Paulo)
 *
 * Este módulo centraliza a manipulação de datas para garantir consistência
 * em todo o sistema, especialmente para audiências e outros eventos com horário.
 */

import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte strings de data e hora locais para uma string ISO no timezone de São Paulo.
 * Use esta função ao criar/editar eventos com data e hora.
 *
 * @param dateStr - Data no formato 'YYYY-MM-DD'
 * @param timeStr - Hora no formato 'HH:mm'
 * @returns String ISO (ex: '2025-01-15T14:30:00.000-03:00')
 */
export function localToISO(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  // Criar data no timezone local (São Paulo)
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  // Formatar para ISO com offset do timezone atual
  return date.toISOString();
}

/**
 * Converte uma data ISO para exibição no formato brasileiro.
 *
 * @param isoStr - String ISO ou objeto Date
 * @param formatStr - Formato de saída (padrão: 'dd/MM/yyyy HH:mm')
 * @returns String formatada no padrão brasileiro
 */
export function formatDateBR(
  isoStr: string | Date | null | undefined,
  formatStr: string = 'dd/MM/yyyy HH:mm'
): string {
  if (!isoStr) return '';

  const date = typeof isoStr === 'string' ? parseISO(isoStr) : isoStr;

  if (!isValid(date)) return '';

  return format(date, formatStr, { locale: ptBR });
}

/**
 * Converte uma data ISO para um objeto Date local.
 * Use para manipulações de data em componentes React.
 *
 * @param isoStr - String ISO
 * @returns Objeto Date ou null se inválido
 */
export function isoToDate(isoStr: string | null | undefined): Date | null {
  if (!isoStr) return null;

  const date = parseISO(isoStr);
  return isValid(date) ? date : null;
}

/**
 * Retorna a data/hora atual no timezone de São Paulo.
 */
export function nowBR(): Date {
  return new Date();
}

/**
 * Formata data para input HTML (type="date")
 *
 * @param date - Objeto Date ou string ISO
 * @returns String no formato 'YYYY-MM-DD'
 */
export function formatForDateInput(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(d)) return '';

  return format(d, 'yyyy-MM-dd');
}

/**
 * Formata hora para input HTML (type="time")
 *
 * @param date - Objeto Date ou string ISO
 * @returns String no formato 'HH:mm'
 */
export function formatForTimeInput(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(d)) return '';

  return format(d, 'HH:mm');
}

/**
 * Extrai apenas a data (sem hora) de um ISO string.
 *
 * @param isoStr - String ISO
 * @returns String no formato 'YYYY-MM-DD' ou vazio se inválido
 */
export function extractDatePart(isoStr: string | null | undefined): string {
  if (!isoStr) return '';

  const date = parseISO(isoStr);
  if (!isValid(date)) return '';

  return format(date, 'yyyy-MM-dd');
}

/**
 * Extrai apenas a hora de um ISO string.
 *
 * @param isoStr - String ISO
 * @returns String no formato 'HH:mm' ou vazio se inválido
 */
export function extractTimePart(isoStr: string | null | undefined): string {
  if (!isoStr) return '';

  const date = parseISO(isoStr);
  if (!isValid(date)) return '';

  return format(date, 'HH:mm');
}

/**
 * Verifica se uma string de data é válida.
 */
export function isValidDateString(str: string | null | undefined): boolean {
  if (!str) return false;
  const date = parseISO(str);
  return isValid(date);
}

/**
 * Retorna o timezone atual configurado.
 */
export function getTimezone(): string {
  return TIMEZONE;
}
