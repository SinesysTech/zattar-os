// Funções utilitárias para formatação de dados de contratos

import type {
  AreaDireito,
  TipoContrato,
  TipoCobranca,
  StatusContrato,
  PoloProcessual,
} from '@/backend/contratos/services/persistence/contrato-persistence.service';

/**
 * Formata área de direito para exibição
 */
export function formatarAreaDireito(area: AreaDireito | null | undefined): string {
  if (!area) return '-';

  const areas: Record<AreaDireito, string> = {
    trabalhista: 'Trabalhista',
    civil: 'Civil',
    previdenciario: 'Previdenciário',
    criminal: 'Criminal',
    empresarial: 'Empresarial',
    administrativo: 'Administrativo',
  };

  return areas[area] || area;
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
