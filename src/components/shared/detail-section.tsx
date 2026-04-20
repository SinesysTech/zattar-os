'use client';

/**
 * DetailSection — Padrão de seção enxuta usada em páginas de detalhe.
 * ============================================================================
 * Canônico do Design System: extraído do `audiencia-detail-dialog` e
 * promovido para uso em qualquer página de detalhe (contratos, processos,
 * partes, etc.).
 *
 *   <DetailSection icon={FileText} label="Dados" action={<button>…</button>}>
 *     <DetailSectionCard>conteúdo</DetailSectionCard>
 *   </DetailSection>
 *
 * Tokens:
 *   Header: ícone 3.5 text-primary + label text-[11px] font-semibold
 *           uppercase tracking-[0.08em] text-muted-foreground
 *   Card:   rounded-[14px] bg-muted/40 border border-border/30 p-[14px_16px]
 * ============================================================================
 */

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DetailSectionProps {
  /** Ícone à esquerda do label — mantém size-3.5 text-primary. */
  icon: LucideIcon;
  /** Label em uppercase compacto. */
  label: string;
  /** Ação à direita (editar, adicionar, etc). */
  action?: React.ReactNode;
  /** Conteúdo (tipicamente um `DetailSectionCard`). */
  children: React.ReactNode;
  /** Classe extra no wrapper externo. */
  className?: string;
}

interface DetailSectionCardProps {
  children: React.ReactNode;
  className?: string;
}

// ─── SectionHeader ───────────────────────────────────────────────────────────

export function DetailSection({
  icon: Icon,
  label,
  action,
  children,
  className,
}: DetailSectionProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-2 mb-2.5 px-0.5">
        <Icon className="size-3.5 text-primary shrink-0" aria-hidden="true" />
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
          {label}
        </h4>
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

export function DetailSectionCard({ children, className }: DetailSectionCardProps) {
  return (
    <div
      className={cn(
        'rounded-[14px] bg-card border border-border/60 shadow-sm px-4 py-3.5',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── SectionAction (helper para o slot `action`) ─────────────────────────────

interface DetailSectionActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function DetailSectionAction({
  icon: Icon,
  children,
  className,
  ...rest
}: DetailSectionActionProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-semibold',
        'text-primary/70 hover:text-primary transition-colors cursor-pointer',
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon className="size-2.5" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
