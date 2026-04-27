'use client';

/**
 * PulseKpiCard — Card KPI reutilizável do design system Glass / Neon Magistrate.
 * ============================================================================
 * Padrão ouro extraído de ExpedientesPulseStrip. Usado por qualquer módulo que
 * precise de uma strip de 4 métricas operacionais com GlassPanel, ícone,
 * valor animado e footer (barra de proporção ou sparkline).
 *
 * Uso:
 *   <PulseKpiCard
 *     label="Vencidos"
 *     icon={AlertTriangle}
 *     iconColor="text-destructive/60"
 *     iconBg="bg-destructive/8"
 *     footer={<PulseKpiBar pct={pct} color="bg-destructive/25" />}
 *   >
 *     <AnimatedNumber value={vencidos} />
 *   </PulseKpiCard>
 * ============================================================================
 */

import * as React from 'react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { cn } from '@/lib/utils';

// ─── PulseKpiCard ─────────────────────────────────────────────────────────────

export interface PulseKpiCardProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Classe de cor do ícone — ex: "text-primary/60" */
  iconColor?: string;
  /** Classe de fundo do container do ícone — ex: "bg-primary/8" */
  iconBg?: string;
  /** Borda extra no container do ícone quando em destaque — ex: "border border-destructive/20" */
  iconHighlightBorder?: string;
  /** Eleva para depth=2 e aplica borda colorida no painel */
  highlight?: boolean;
  /** Classe de borda quando em destaque — ex: "border-destructive/15" */
  highlightBorderColor?: string;
  /** Slot inferior: PulseKpiBar, Sparkline ou null */
  footer?: React.ReactNode;
  /** Valor do KPI: AnimatedNumber, texto formatado, etc. */
  children?: React.ReactNode;
  className?: string;
}

export function PulseKpiCard({
  label,
  icon: Icon,
  iconColor = 'text-primary/60',
  iconBg = 'bg-primary/8',
  iconHighlightBorder,
  highlight = false,
  highlightBorderColor,
  footer,
  children,
  className,
}: PulseKpiCardProps) {
  return (
    <GlassPanel
      depth={highlight ? 2 : 1}
      className={cn(
        'px-4 py-3.5',
        highlight && highlightBorderColor,
        className,
      )}
    >
      {/* Header: label + valor + ícone */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-meta-label truncate">{label}</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <p className="text-kpi-value leading-none tracking-tight">
              {children}
            </p>
          </div>
        </div>
        <IconContainer
          size="md"
          className={cn(iconBg, highlight && iconHighlightBorder)}
        >
          <Icon className={cn('size-4', iconColor)} />
        </IconContainer>
      </div>

      {/* Footer: barra de proporção ou sparkline */}
      {footer}
    </GlassPanel>
  );
}

// ─── PulseKpiBar ──────────────────────────────────────────────────────────────

export interface PulseKpiBarProps {
  pct: number;
  /** Classe de cor da barra preenchida — ex: "bg-primary/25" */
  color?: string;
}

export function PulseKpiBar({ pct, color = 'bg-primary/25' }: PulseKpiBarProps) {
  return (
    <div className="mt-2.5 flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-micro-badge tabular-nums text-muted-foreground/50 shrink-0">
        {pct}%
      </span>
    </div>
  );
}

// ─── PulseKpiGrid ─────────────────────────────────────────────────────────────

export interface PulseKpiGridProps {
  children: React.ReactNode;
  className?: string;
}

/** Wrapper de grid responsivo 2→4 colunas para a strip de cards KPI. */
export function PulseKpiGrid({ children, className }: PulseKpiGridProps) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3', className)}>
      {children}
    </div>
  );
}
