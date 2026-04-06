/**
 * Constantes da timeline: mapeamento de tipos de eventos para ícones e cores.
 *
 * Cada evento processual é identificado por palavras-chave no campo `titulo`
 * e recebe um conjunto de metadados visuais (ícone, badge, cores).
 */

import {
  FileText,
  Mail,
  Scale,
  MessageSquare,
  ArrowUpRight,
  Calendar,
  Activity,
  type LucideIcon,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

export interface TimelineItemMeta {
  /** Ícone Lucide para representar o tipo de evento */
  icon: LucideIcon;
  /** Classe CSS de cor do ícone no círculo da timeline */
  colorClass: string;
  /** Rótulo legível para o badge de tipo */
  badgeLabel: string;
  /** Classe de cor de fundo do badge */
  badgeBgClass: string;
  /** Classe de cor de texto do badge */
  badgeTextClass: string;
  /** Classe de cor da borda do badge */
  badgeBorderClass: string;
}

// -----------------------------------------------------------------------------
// Definições de tipo (sem exposição de implementação interna)
// -----------------------------------------------------------------------------

interface TipoDefinicao {
  /** Termos a verificar (case-insensitive) no titulo */
  termos: string[];
  icon: LucideIcon;
  colorClass: string;
  badgeLabel: string;
  badgeBgClass: string;
  badgeTextClass: string;
  badgeBorderClass: string;
}

const DEFINICOES_TIPO: TipoDefinicao[] = [
  {
    termos: ['petição', 'peticao', 'contestação', 'contestacao', 'réplica', 'replica'],
    icon: FileText,
    colorClass: 'text-muted-foreground',
    badgeLabel: 'Petição',
    badgeBgClass: 'bg-muted',
    badgeTextClass: 'text-muted-foreground',
    badgeBorderClass: 'border-border',
  },
  {
    termos: ['citação', 'citacao', 'intimação', 'intimacao', 'aviso', 'notificação', 'notificacao'],
    icon: Mail,
    colorClass: 'text-info',
    badgeLabel: 'Citação',
    badgeBgClass: 'bg-info/5',
    badgeTextClass: 'text-info',
    badgeBorderClass: 'border-info/20',
  },
  {
    termos: ['sentença', 'sentenca', 'decisão', 'decisao', 'acórdão', 'acordao', 'julgamento'],
    icon: Scale,
    colorClass: 'text-success',
    badgeLabel: 'Decisão',
    badgeBgClass: 'bg-success/5',
    badgeTextClass: 'text-success',
    badgeBorderClass: 'border-success/20',
  },
  {
    termos: ['despacho'],
    icon: MessageSquare,
    colorClass: 'text-warning',
    badgeLabel: 'Despacho',
    badgeBgClass: 'bg-warning/5',
    badgeTextClass: 'text-warning',
    badgeBorderClass: 'border-warning/20',
  },
  {
    termos: ['agravo', 'recurso', 'embargo', 'embargos', 'apelação', 'apelacao'],
    icon: ArrowUpRight,
    colorClass: 'text-primary',
    badgeLabel: 'Recurso',
    badgeBgClass: 'bg-primary/5',
    badgeTextClass: 'text-primary',
    badgeBorderClass: 'border-primary/20',
  },
  {
    termos: ['audiência', 'audiencia'],
    icon: Calendar,
    colorClass: 'text-info',
    badgeLabel: 'Audiência',
    badgeBgClass: 'bg-info/5',
    badgeTextClass: 'text-info',
    badgeBorderClass: 'border-info/20',
  },
];

/** Metadados padrão para eventos sem correspondência */
const META_PADRAO: TimelineItemMeta = {
  icon: Activity,
  colorClass: 'text-muted-foreground',
  badgeLabel: 'Movimento',
  badgeBgClass: 'bg-muted',
  badgeTextClass: 'text-muted-foreground',
  badgeBorderClass: 'border-border',
};

// -----------------------------------------------------------------------------
// Função principal
// -----------------------------------------------------------------------------

/**
 * Retorna metadados visuais para um item da timeline com base no título.
 *
 * @param titulo - Texto do campo `titulo` do item da timeline
 * @param isDocumento - Indica se o item é um documento (true) ou movimento (false)
 * @returns Metadados com ícone, label e classes de cor para badge e ícone
 *
 * @example
 * const meta = getTimelineItemMeta('Petição Inicial', true);
 * // meta.badgeLabel === 'Petição'
 * // meta.icon === FileText
 */
export function getTimelineItemMeta(
  titulo: string,
  isDocumento: boolean
): TimelineItemMeta {
  const tituloNormalizado = titulo.toLowerCase();

  for (const definicao of DEFINICOES_TIPO) {
    const correspondeu = definicao.termos.some((termo) =>
      tituloNormalizado.includes(termo)
    );

    if (correspondeu) {
      return {
        icon: definicao.icon,
        colorClass: definicao.colorClass,
        badgeLabel: definicao.badgeLabel,
        badgeBgClass: definicao.badgeBgClass,
        badgeTextClass: definicao.badgeTextClass,
        badgeBorderClass: definicao.badgeBorderClass,
      };
    }
  }

  // Se for documento sem correspondência específica, usa ícone de arquivo
  if (isDocumento) {
    return {
      icon: FileText,
      colorClass: 'text-muted-foreground',
      badgeLabel: 'Documento',
      badgeBgClass: 'bg-muted',
      badgeTextClass: 'text-muted-foreground',
      badgeBorderClass: 'border-border',
    };
  }

  return META_PADRAO;
}
