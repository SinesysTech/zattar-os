/**
 * Componentes utilitários da Dev Library.
 * Vivem em _components/ — pasta privada (Next ignora como rota).
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DemoPageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
}

export function DemoPageHeader({
  eyebrow,
  title,
  description,
  children,
}: DemoPageHeaderProps) {
  return (
    <header className="mb-10 border-b border-border pb-8">
      {eyebrow && (
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </div>
      )}
      <h1 className="font-headline text-3xl font-bold tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </header>
  )
}

interface DemoSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function DemoSection({
  title,
  description,
  children,
  className,
}: DemoSectionProps) {
  return (
    <section className={cn('mb-12', className)}>
      <div className="mb-4">
        <h2 className="font-headline text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

interface DemoCanvasProps {
  children: ReactNode
  className?: string
  /** Background — default usa surface-container-low */
  background?: 'default' | 'card' | 'dark'
}

export function DemoCanvas({
  children,
  className,
  background = 'default',
}: DemoCanvasProps) {
  const bgClass =
    background === 'dark'
      ? 'dark bg-surface text-on-surface'
      : background === 'card'
        ? 'bg-card'
        : 'bg-surface-container-low'

  return (
    <div
      className={cn(
        'rounded-xl border border-border p-6',
        bgClass,
        className,
      )}
    >
      {children}
    </div>
  )
}

interface DemoLabelProps {
  children: ReactNode
}

export function DemoLabel({ children }: DemoLabelProps) {
  return (
    <div className="mb-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  )
}

interface UsageInProductionProps {
  /** Lista de call sites reais no codebase */
  sites: Array<{
    file: string
    line?: number
    snippet: string
    note?: string
  }>
}

/**
 * Mostra como o componente é REALMENTE usado nos módulos refatorados.
 * Cada entrada é um call site real do codebase, não um exemplo abstrato.
 */
export function UsageInProduction({ sites }: UsageInProductionProps) {
  return (
    <DemoSection
      title="Uso em produção"
      description="Call sites reais no codebase. Estes são os usos canônicos — siga estes padrões."
    >
      <div className="space-y-4">
        {sites.map((site) => (
          <div
            key={`${site.file}:${site.line ?? ''}`}
            className="rounded-lg border border-border bg-surface-container-low p-4"
          >
            <div className="mb-2 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              <span className="text-foreground">{site.file}</span>
              {site.line && <span className="text-muted-foreground">:{site.line}</span>}
            </div>
            <pre className="overflow-x-auto rounded bg-surface-container-highest p-3 text-xs leading-relaxed">
              <code>{site.snippet}</code>
            </pre>
            {site.note && (
              <p className="mt-2 text-xs italic text-muted-foreground">
                {site.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </DemoSection>
  )
}

interface DemoSwatchProps {
  /** Token CSS variable name (com ou sem --) */
  token: string
  /** Label visível */
  label: string
  /** Sub-label opcional (ex: hex equivalent) */
  sublabel?: string
}

export function DemoSwatch({ token, label, sublabel }: DemoSwatchProps) {
  const cssVar = token.startsWith('--') ? token : `--${token}`
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-16 w-full rounded-lg border border-border shadow-sm"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div>
        <div className="text-xs font-semibold">{label}</div>
        <div className="font-mono text-[10px] text-muted-foreground">
          {cssVar}
        </div>
        {sublabel && (
          <div className="text-[10px] text-muted-foreground">{sublabel}</div>
        )}
      </div>
    </div>
  )
}
