import * as React from 'react';
import { cn } from '@/lib/utils';
import { SPACING_TOKENS } from '@/lib/design-system/tokens';

interface StackProps extends React.HTMLAttributes<HTMLElement> {
  /** Gap vertical entre os elementos */
  gap?: 'tight' | 'default' | 'loose' | 'section' | 'field';
  /** Tag HTML a ser renderizada */
  as?: React.ElementType;
  /** Conteúdo do stack */
  children: React.ReactNode;
}

const STACK_GAPS = {
  tight: 'stack-tight',
  default: 'stack-default',
  loose: 'stack-loose',
  section: 'stack-section',
  field: 'stack-field',
} as const;

/**
 * Stack - Primitiva de layout vertical.
 * Baseada em flex-col com gaps semânticos do Design System.
 */
export function Stack({
  gap = 'default',
  as: Tag = 'div',
  className,
  children,
  ...props
}: StackProps) {
  const gapToken = STACK_GAPS[gap];
  return (
    <Tag className={cn('flex flex-col', SPACING_TOKENS[gapToken], className)} {...props}>
      {children}
    </Tag>
  );
}
Stack.displayName = 'Stack';

interface InlineProps extends React.HTMLAttributes<HTMLElement> {
  /** Gap horizontal entre os elementos */
  gap?: 'tight' | 'default' | 'loose';
  /** Tag HTML a ser renderizada */
  as?: React.ElementType;
  /** Alinhamento vertical (align-items) */
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  /** Alinhamento horizontal (justify-content) */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Se true, permite quebra de linha */
  wrap?: boolean;
  /** Conteúdo do inline */
  children: React.ReactNode;
}

const INLINE_GAPS = {
  tight: 'inline-tight',
  default: 'inline-default',
  loose: 'inline-loose',
} as const;

/**
 * Inline - Primitiva de layout horizontal.
 * Baseada em flex-row com gaps semânticos do Design System.
 */
export function Inline({
  gap = 'default',
  as: Tag = 'div',
  align = 'center',
  justify = 'start',
  wrap = false,
  className,
  children,
  ...props
}: InlineProps) {
  const gapToken = INLINE_GAPS[gap];
  return (
    <Tag
      className={cn(
        'flex flex-row',
        SPACING_TOKENS[gapToken],
        {
          'items-start': align === 'start',
          'items-center': align === 'center',
          'items-end': align === 'end',
          'items-baseline': align === 'baseline',
          'items-stretch': align === 'stretch',
          'justify-start': justify === 'start',
          'justify-center': justify === 'center',
          'justify-end': justify === 'end',
          'justify-between': justify === 'between',
          'justify-around': justify === 'around',
          'justify-evenly': justify === 'evenly',
          'flex-wrap': wrap,
        },
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
Inline.displayName = 'Inline';

interface InsetProps extends React.HTMLAttributes<HTMLElement> {
  /** Variante de padding semântico */
  variant?: 'card' | 'card-compact' | 'dialog' | 'page' | 'section';
  /** Tag HTML a ser renderizada */
  as?: React.ElementType;
  /** Conteúdo do inset */
  children: React.ReactNode;
}

const INSET_VARIANTS = {
  card: 'inset-card',
  'card-compact': 'inset-card-compact',
  dialog: 'inset-dialog',
  page: 'inset-page',
  section: 'inset-section',
} as const;

/**
 * Inset - Primitiva de padding wrapper.
 * Aplica paddings semânticos do Design System.
 */
export function Inset({
  variant = 'section',
  as: Tag = 'div',
  className,
  children,
  ...props
}: InsetProps) {
  const variantToken = INSET_VARIANTS[variant];
  return (
    <Tag className={cn(SPACING_TOKENS[variantToken], className)} {...props}>
      {children}
    </Tag>
  );
}
Inset.displayName = 'Inset';
