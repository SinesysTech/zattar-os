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
  PapelContratual,
} from '../domain';

// =============================================================================
// FORMATADORES DE ENUMS
// =============================================================================

/**
 * Formata tipo de segmento para exibição
 *
 * @param segmento - Tipo de segmento (trabalhista, civil, etc.)
 * @returns String formatada para exibição ou '-' se null/undefined
 *
 * @example
 * ```typescript
 * formatarSegmentoTipo('trabalhista'); // "Trabalhista"
 * formatarSegmentoTipo(null); // "-"
 * ```
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
 * Formata tipo de contrato para exibição
 *
 * @param tipo - Tipo de contrato (ajuizamento, defesa, etc.)
 * @returns String formatada para exibição ou '-' se null/undefined
 *
 * @example
 * ```typescript
 * formatarTipoContrato('ajuizamento'); // "Ajuizamento"
 * formatarTipoContrato('ato_processual'); // "Ato Processual"
 * ```
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
 *
 * @param tipo - Tipo de cobrança (pro_exito, pro_labore)
 * @returns String formatada para exibição ou '-' se null/undefined
 *
 * @example
 * ```typescript
 * formatarTipoCobranca('pro_exito'); // "Pró-Êxito"
 * formatarTipoCobranca('pro_labore'); // "Pró-Labore"
 * ```
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
 *
 * @param status - Status do contrato (em_contratacao, contratado, etc.)
 * @returns String formatada para exibição ou '-' se null/undefined
 *
 * @example
 * ```typescript
 * formatarStatusContrato('em_contratacao'); // "Em Contratação"
 * formatarStatusContrato('distribuido'); // "Distribuído"
 * ```
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

export function formatarPapelContratual(papel: PapelContratual | null | undefined): string {
  if (!papel) return '-';

  const papeis: Record<PapelContratual, string> = {
    autora: 'Autora',
    re: 'Ré',
  };

  return papeis[papel] || papel;
}

// =============================================================================
// FORMATADORES DE DATA
// =============================================================================

/**
 * Formata data ISO para formato brasileiro (DD/MM/YYYY)
 *
 * @param dataISO - String de data em formato ISO (YYYY-MM-DD ou ISO 8601)
 * @returns Data formatada (DD/MM/YYYY) ou '-' se inválida/null
 *
 * @example
 * ```typescript
 * formatarData('2024-01-15'); // "15/01/2024"
 * formatarData('2024-01-15T10:30:00Z'); // "15/01/2024"
 * formatarData(null); // "-"
 * ```
 */
export function formatarData(dataISO: string | null | undefined): string {
  if (!dataISO) return '-';

  try {
    const data = new Date(dataISO);
    if (isNaN(data.getTime())) return '-';
    // Usa UTC para evitar deslocamento de fuso horário em datas sem hora
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(data);
  } catch {
    return '-';
  }
}

/**
 * Formata data e hora ISO para formato brasileiro (DD/MM/YYYY HH:mm)
 *
 * @param dataISO - String de data/hora em formato ISO
 * @returns Data e hora formatadas ou '-' se inválida/null
 *
 * @example
 * ```typescript
 * formatarDataHora('2024-01-15T10:30:00Z'); // "15/01/2024 10:30"
 * formatarDataHora(null); // "-"
 * ```
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
 *
 * @param status - Status do contrato
 * @returns Objeto com tone e variant para Badge component
 *
 * @example
 * ```typescript
 * const { tone, variant } = getStatusBadgeStyle('contratado');
 * // { tone: 'success', variant: 'soft' }
 * ```
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
 *
 * @param tipo - Tipo de contrato
 * @returns Objeto com tone e variant para Badge component
 *
 * @example
 * ```typescript
 * const { tone, variant } = getTipoContratoBadgeStyle('ajuizamento');
 * // { tone: 'primary', variant: 'soft' }
 * ```
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
 * Retorna variant para Badge do status do contrato (shadcn/ui)
 *
 * @param status - Status do contrato
 * @returns Variant string para Badge component do shadcn/ui
 *
 * @example
 * ```typescript
 * <Badge variant={getStatusVariant(contrato.status)}>
 *   {formatarStatusContrato(contrato.status)}
 * </Badge>
 * ```
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
 * Retorna variant para Badge do tipo de contrato (shadcn/ui)
 *
 * @param tipo - Tipo de contrato
 * @returns Variant string para Badge component do shadcn/ui
 *
 * @example
 * ```typescript
 * <Badge variant={getTipoContratoVariant(contrato.tipoContrato)}>
 *   {formatarTipoContrato(contrato.tipoContrato)}
 * </Badge>
 * ```
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
