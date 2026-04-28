import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// LEGACY COMPONENTS — shadcn/ui canonical inline-class approach
// @deprecated Use `<Heading>` or `<Text>` from this file instead.
// =============================================================================

/** @deprecated Use `<Heading level="page">` instead. */
const H1 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn('scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl', className)}
      {...props}
    />
  )
);
H1.displayName = 'H1';

/** @deprecated Use `<Heading level="section">` instead. */
const H2 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
        className
      )}
      {...props}
    />
  )
);
H2.displayName = 'H2';

/** @deprecated Use `<Heading level="card">` instead. */
const H3 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('scroll-m-20 text-2xl font-semibold tracking-tight', className)}
      {...props}
    />
  )
);
H3.displayName = 'H3';

/** @deprecated Use `<Heading level="subsection">` instead. */
const H4 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h4
      ref={ref}
      className={cn('scroll-m-20 text-xl font-semibold tracking-tight', className)}
      {...props}
    />
  )
);
H4.displayName = 'H4';

/** @deprecated Use `<Text variant="body">` instead. */
const P = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('leading-7 not-first:mt-6', className)}
      {...props}
    />
  )
);
P.displayName = 'P';

/** @deprecated Use `<Text variant="body-lg">` instead. */
const Lead = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-xl text-muted-foreground', className)}
      {...props}
    />
  )
);
Lead.displayName = 'Lead';

/** @deprecated */
const Large = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
  )
);
Large.displayName = 'Large';

/** @deprecated Use `<Text variant="label">` instead. */
const Small = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <small
      ref={ref}
      className={cn('text-sm font-medium leading-none', className)}
      {...props}
    />
  )
);
Small.displayName = 'Small';

/** @deprecated Use `<Text variant="caption">` instead. */
const Muted = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
Muted.displayName = 'Muted';

/** @deprecated */
const Blockquote = React.forwardRef<HTMLQuoteElement, React.HTMLAttributes<HTMLQuoteElement>>(
  ({ className, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cn('mt-6 border-l-2 pl-6 italic', className)}
      {...props}
    />
  )
);
Blockquote.displayName = 'Blockquote';

/** @deprecated */
const List = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)}
      role="list"
      {...props}
    />
  )
);
List.displayName = 'List';

/** @deprecated */
const InlineCode = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <code
      ref={ref}
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
        className
      )}
      {...props}
    />
  )
);
InlineCode.displayName = 'InlineCode';

interface TableProps extends React.ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode;
}

/** @deprecated */
const Table = React.forwardRef<HTMLDivElement, TableProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('my-6 w-full overflow-y-auto', className)} {...props}>
    <table className="w-full">{children}</table>
  </div>
));
Table.displayName = 'Typography.Table';

/**
 * @deprecated Use `<Heading>` or `<Text>` components instead.
 */
export const Typography = {
  H1,
  H2,
  H3,
  H4,
  P,
  Blockquote,
  List,
  InlineCode,
  Lead,
  Large,
  Small,
  Muted,
  Table,
};

/** @deprecated Use `<Heading>` or `<Text>` components instead. */
export { H1, H2, H3, H4, P, Blockquote, List, InlineCode, Lead, Large, Small, Muted, Table };

// =============================================================================
// DESIGN SYSTEM: Typed Typography Components
// =============================================================================

const HEADING_LEVELS = {
  page: { className: 'text-page-title', tag: 'h1' as const },
  section: { className: 'text-section-title', tag: 'h2' as const },
  card: { className: 'text-card-title', tag: 'h3' as const },
  subsection: { className: 'text-subsection-title', tag: 'h4' as const },
  widget: { className: 'text-widget-title', tag: 'h3' as const },
  'display-1': { className: 'text-display-1', tag: 'h1' as const },
  'display-2': { className: 'text-display-2', tag: 'h1' as const },
  'marketing-hero': { className: 'text-marketing-hero', tag: 'h1' as const },
  'marketing-section': { className: 'text-marketing-section', tag: 'h2' as const },
  'marketing-title': { className: 'text-marketing-title', tag: 'h3' as const },
} as const;

type HeadingLevel = keyof typeof HEADING_LEVELS;

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: React.ReactNode;
}

function Heading({ level, as: asTag, className: userClassName, children, ...props }: HeadingProps) {
  const config = HEADING_LEVELS[level];
  const Tag = asTag ?? config.tag;
  return (
    <Tag className={cn(config.className, userClassName)} {...props}>
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
  'marketing-lead': { className: 'text-marketing-lead', tag: 'p' as const },
  'marketing-overline': { className: 'text-marketing-overline', tag: 'span' as const },
} as const;

type TextVariant = keyof typeof TEXT_VARIANTS;

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant: TextVariant;
  as?: React.ElementType;
  children: React.ReactNode;
}

function Text({ variant, as: asTag, className: userClassName, children, ...props }: TextProps) {
  const config = TEXT_VARIANTS[variant];
  const Tag = asTag ?? config.tag;
  return (
    <Tag className={cn(config.className, userClassName)} {...props}>
      {children}
    </Tag>
  );
}
Text.displayName = 'Text';

export { Heading, Text };
export type { HeadingLevel, TextVariant, HeadingProps, TextProps };
export { HEADING_LEVELS, TEXT_VARIANTS };
