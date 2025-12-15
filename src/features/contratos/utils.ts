/**
 * CONTRATOS FEATURE - Utilitários de Formatação
 *
 * Funções utilitárias para formatação de dados de contratos.
 */

import type {
  SegmentoTipo,
  TipoContrato,
  TipoCobranca,
  StatusContrato,
  PoloProcessual,
} from './domain';

// =============================================================================
// FORMATADORES DE ENUMS
// =============================================================================

/**
 * Formata tipo de segmento para exibição
 */
export function formatarSegmentoTipo(segmento: SegmentoTipo | null | undefined): string {
  if (!segmento) return '-';

  const segmentos: Record<SegmentoTipo, string> = {
    trabalhista: 'Trabalhista',
    civil: 'Civil',
    previdenciario: 'Previdenciário',
    criminal: 'Criminal',
    empresarial: 'Empresarial',
    administrativo: 'Administrativo',
  };

  return segmentos[segmento] || segmento;
}

/**
 * @deprecated Use formatarSegmentoTipo. Mantido para compatibilidade.
 */
export function formatarAreaDireito(area: SegmentoTipo | null | undefined): string {
  return formatarSegmentoTipo(area);
}

/**
 * Formata tipo de contrato para exibição
 */
export function formatarTipoContrato(tipo: TipoContrato | null | undefined): string {
  if (!tipo) return '-';

  const tipos: Record<TipoContrato, string> = {
    ajuizamento: 'Ajuizamento',
    defesa: 'Defesa',
    ato_processual: 'Ato Processual',
    assessoria: 'Assessoria',
    consultoria: 'Consultoria',
    extrajudicial: 'Extrajudicial',
    parecer: 'Parecer',
  };

  return tipos[tipo] || tipo;
}

/**
 * Formata tipo de cobrança para exibição
 */
export function formatarTipoCobranca(tipo: TipoCobranca | null | undefined): string {
  if (!tipo) return '-';

  const tipos: Record<TipoCobranca, string> = {
    pro_exito: 'Pró-Êxito',
    pro_labore: 'Pró-Labore',
  };

  return tipos[tipo] || tipo;
}

/**
 * Formata status do contrato para exibição
 */
export function formatarStatusContrato(status: StatusContrato | null | undefined): string {
  if (!status) return '-';

  const statuses: Record<StatusContrato, string> = {
    em_contratacao: 'Em Contratação',
    contratado: 'Contratado',
    distribuido: 'Distribuído',
    desistencia: 'Desistência',
  };

  return statuses[status] || status;
}

/**
 * Formata polo processual para exibição
 */
export function formatarPoloProcessual(polo: PoloProcessual | null | undefined): string {
  if (!polo) return '-';

  const polos: Record<PoloProcessual, string> = {
    autor: 'Autor',
    re: 'Réu',
  };

  return polos[polo] || polo;
}

// =============================================================================
// FORMATADORES DE DATA
// =============================================================================

/**
 * Formata data ISO para formato brasileiro (DD/MM/YYYY)
 */
export function formatarData(dataISO: string | null | undefined): string {
  if (!dataISO) return '-';

  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
}

/**
 * Formata data e hora ISO para formato brasileiro (DD/MM/YYYY HH:mm)
 */
export function formatarDataHora(dataISO: string | null | undefined): string {
  if (!dataISO) return '-';

  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

// =============================================================================
// HELPERS DE BADGE/ESTILO
// =============================================================================

/**
 * Retorna tom e estilo de badge para status do contrato
 */
export function getStatusBadgeStyle(
  status: StatusContrato | null | undefined,
): { tone: 'warning' | 'success' | 'info' | 'danger' | 'neutral'; variant: 'soft' | 'solid' | 'outline' } {
  if (!status) return { tone: 'neutral', variant: 'outline' };

  const styles: Record<StatusContrato, { tone: 'warning' | 'success' | 'info' | 'danger' | 'neutral'; variant: 'soft' | 'solid' | 'outline' }> = {
    em_contratacao: { tone: 'warning', variant: 'soft' },
    contratado: { tone: 'success', variant: 'soft' },
    distribuido: { tone: 'info', variant: 'soft' },
    desistencia: { tone: 'danger', variant: 'solid' },
  };

  return styles[status] || { tone: 'neutral', variant: 'outline' };
}

/**
 * Retorna tom e estilo de badge para tipo de contrato
 */
export function getTipoContratoBadgeStyle(
  tipo: TipoContrato | null | undefined,
): { tone: 'primary' | 'neutral'; variant: 'soft' | 'outline' } {
  if (!tipo) return { tone: 'neutral', variant: 'outline' };

  // Ajuizamento e defesa são mais importantes, outros são secundários
  if (tipo === 'ajuizamento' || tipo === 'defesa') {
    return { tone: 'primary', variant: 'soft' };
  }

  return { tone: 'neutral', variant: 'soft' };
}

/**
 * Retorna variant para Badge do status do contrato
 */
export function getStatusVariant(status: StatusContrato): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'contratado':
      return 'default';
    case 'distribuido':
      return 'secondary';
    case 'desistencia':
      return 'destructive';
    case 'em_contratacao':
    default:
      return 'outline';
  }
}

/**
 * Retorna variant para Badge do tipo de contrato
 */
export function getTipoContratoVariant(tipo: TipoContrato): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (tipo) {
    case 'ajuizamento':
      return 'default';
    case 'defesa':
      return 'secondary';
    default:
      return 'outline';
  }
}
