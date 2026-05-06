import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// DESIGN SYSTEM: Typed Typography Components
// Padrão canônico do projeto — seguindo a filosofia shadcn/ui de tokens inline.
// =============================================================================

const HEADING_LEVELS = {
  page: { className: 'text-page-title', tag: 'h1' as const },
  section: { className: 'text-section-title', tag: 'h2' as const },
  card: { className: 'text-card-title', tag: 'h3' as const },
  subsection: { className: 'text-subsection-title', tag: 'h4' as const },
  widget: { className: 'text-widget-title', tag: 'h3' as const },
  // Display — hero, empty states dramáticos (spec Glass Briefing)
  'display-1': { className: 'text-display-1', tag: 'h1' as const },
  'display-2': { className: 'text-display-2', tag: 'h1' as const },
  // Marketing — apenas src/app/website/*
  'marketing-hero': { className: 'text-marketing-hero', tag: 'h1' as const },
  'marketing-section': { className: 'text-marketing-section', tag: 'h2' as const },
  'marketing-title': { className: 'text-marketing-title', tag: 'h3' as const },
} as const;

type HeadingLevel = keyof typeof HEADING_LEVELS;

/**
 * FONT_WEIGHT — modificador ortogonal a tipografia.
 * Evita combinatorial explosion de variants (`body-sm-medium`, `body-sm-bold`).
 * Cada variant Text/Heading mantém peso default via @apply em globals.css;
 * a prop `weight` sobrepõe quando ênfase pontual é necessária.
 */
const FONT_WEIGHT = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

type FontWeight = keyof typeof FONT_WEIGHT;

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Peso da fonte. Sobrepõe o default da variant quando definido. */
  weight?: FontWeight;
  children: React.ReactNode;
}

function Heading({
  level,
  as: asTag,
  weight,
  className: userClassName,
  children,
  ...props
}: HeadingProps) {
  const config = HEADING_LEVELS[level];
  const Tag = asTag ?? config.tag;
  return (
    <Tag
      className={cn(config.className, weight && FONT_WEIGHT[weight], userClassName)}
      {...props}
    >
      {children}
    </Tag>
  );
}
Heading.displayName = 'Heading';

const TEXT_VARIANTS = {
  'kpi-value': { className: 'text-kpi-value', tag: 'span' as const },
  label: { className: 'text-label', tag: 'span' as const },
  caption: { className: 'text-caption', tag: 'p' as const },
  'widget-sub': { className: 'text-widget-sub', tag: 'p' as const },
  'meta-label': { className: 'text-meta-label', tag: 'span' as const },
  'micro-caption': { className: 'text-micro-caption', tag: 'span' as const },
  'micro-badge': { className: 'text-micro-badge', tag: 'span' as const },
  overline: { className: 'text-overline', tag: 'span' as const },
  body: { className: 'text-body', tag: 'p' as const },
  'body-lg': { className: 'text-body-lg', tag: 'p' as const },
  'body-sm': { className: 'text-body-sm', tag: 'p' as const },
  helper: { className: 'text-helper', tag: 'span' as const },
  // Marketing — apenas src/app/website/*
  'marketing-lead': { className: 'text-marketing-lead', tag: 'p' as const },
  'marketing-overline': { className: 'text-marketing-overline', tag: 'span' as const },
} as const;

type TextVariant = keyof typeof TEXT_VARIANTS;

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant: TextVariant;
  as?: React.ElementType;
  /** Peso da fonte. Sobrepõe o default da variant quando definido. */
  weight?: FontWeight;
  children: React.ReactNode;
}

function Text({
  variant,
  as: asTag,
  weight,
  className: userClassName,
  children,
  ...props
}: TextProps) {
  const config = TEXT_VARIANTS[variant];
  const Tag = asTag ?? config.tag;
  return (
    <Tag
      className={cn(config.className, weight && FONT_WEIGHT[weight], userClassName)}
      {...props}
    >
      {children}
    </Tag>
  );
}
Text.displayName = 'Text';

export { Heading, Text };
export type { HeadingLevel, TextVariant, HeadingProps, TextProps, FontWeight };
export { HEADING_LEVELS, TEXT_VARIANTS, FONT_WEIGHT };
