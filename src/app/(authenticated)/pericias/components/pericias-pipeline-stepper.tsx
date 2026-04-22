'use client';

/**
 * PericiasPipelineStepper — Funil de estágios de perícia em GlassPanel único.
 * ============================================================================
 * Espelho de ContratosPipelineStepper adaptado ao ciclo de vida pericial:
 *   Aguardando Laudo → Aguardando Esclarecimentos → Laudo Juntado → Finalizada
 *
 * Estados de exceção (Redesignada, Cancelada) não entram no funil principal
 * para não sujar a narrativa visual — ficam visíveis via PericiasFilterBar.
 *
 * Cada coluna é clicável para filtrar a lista por situação; a ativa ganha
 * realce sutil via fundo primary/5.
 * ============================================================================
 */

import * as React from 'react';
import {
  GitBranch,
  Clock,
  MessageSquare,
  FileCheck2,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { SituacaoPericiaCodigo, SITUACAO_PERICIA_LABELS } from '../domain';

// ---------------------------------------------------------------------------
// Config dos estágios (ordem narrativa do ciclo pericial)
// ---------------------------------------------------------------------------

interface StageConfig {
  icon: LucideIcon;
  textColor: string;
  cssVar: string;
}

const STAGE_ORDER: SituacaoPericiaCodigo[] = [
  SituacaoPericiaCodigo.AGUARDANDO_LAUDO,
  SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS,
  SituacaoPericiaCodigo.LAUDO_JUNTADO,
  SituacaoPericiaCodigo.FINALIZADA,
];

const STAGE_CONFIG: Partial<Record<SituacaoPericiaCodigo, StageConfig>> = {
  [SituacaoPericiaCodigo.AGUARDANDO_LAUDO]: {
    icon: Clock,
    textColor: 'text-info',
    cssVar: 'var(--info)',
  },
  [SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS]: {
    icon: MessageSquare,
    textColor: 'text-warning',
    cssVar: 'var(--warning)',
  },
  [SituacaoPericiaCodigo.LAUDO_JUNTADO]: {
    icon: FileCheck2,
    textColor: 'text-primary',
    cssVar: 'var(--primary)',
  },
  [SituacaoPericiaCodigo.FINALIZADA]: {
    icon: CheckCircle2,
    textColor: 'text-success',
    cssVar: 'var(--success)',
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PericiasPipelineStepperProps {
  porSituacao: Record<string, number>;
  activeSituacao?: SituacaoPericiaCodigo | null;
  onSituacaoClick?: (situacao: SituacaoPericiaCodigo) => void;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PericiasPipelineStepper({
  porSituacao,
  activeSituacao,
  onSituacaoClick,
  compact = false,
}: PericiasPipelineStepperProps) {
  const stages = React.useMemo(
    () =>
      STAGE_ORDER.map((situacao) => ({
        situacao,
        count: porSituacao[situacao] ?? 0,
      })),
    [porSituacao],
  );

  const total = React.useMemo(
    () => stages.reduce((sum, s) => sum + s.count, 0),
    [stages],
  );

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  const body = (
    <div className="flex items-stretch gap-3">
      {stages.map((stage) => {
        const cfg = STAGE_CONFIG[stage.situacao]!;
        const Icon = cfg.icon;
        const isActive = activeSituacao === stage.situacao;
        const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
        const barWidth = Math.max(15, (stage.count / maxCount) * 100);
        const clickable = typeof onSituacaoClick === 'function';

        const inner = (
          <div className="flex flex-col items-center gap-2 py-2 px-1 w-full">
            <div className="flex items-center gap-1.5">
              <Icon className={cn('size-3.5', cfg.textColor)} />
              <span
                className={cn(
                  'text-[10px] font-medium uppercase tracking-[0.06em] text-center',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground/65',
                )}
              >
                {SITUACAO_PERICIA_LABELS[stage.situacao]}
              </span>
            </div>
            <Text
              as="p"
              variant="kpi-value"
              className={cn(
                'leading-none',
                isActive ? 'text-foreground' : 'text-foreground/85',
              )}
            >
              {stage.count.toLocaleString('pt-BR')}
            </Text>
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${barWidth}%`,
                backgroundColor: cfg.cssVar,
                opacity: isActive ? 0.95 : 0.6,
                boxShadow: isActive ? `0 0 10px ${cfg.cssVar}55` : undefined,
              }}
              aria-hidden="true"
            />
            {total > 0 ? (
              <span
                className={cn(
                  'text-[10px] font-medium tabular-nums',
                  isActive ? cfg.textColor : 'text-muted-foreground/55',
                )}
              >
                {pct}% do total
              </span>
            ) : (
              <span className="text-[10px] text-transparent" aria-hidden>
                -
              </span>
            )}
          </div>
        );

        const commonWrapperClasses = cn(
          'flex-1 rounded-xl transition-all duration-180',
          isActive && 'bg-primary/5 ring-1 ring-primary/15',
        );

        if (!clickable) {
          return (
            <div key={stage.situacao} className={commonWrapperClasses}>
              {inner}
            </div>
          );
        }

        return (
          <button
            key={stage.situacao}
            type="button"
            onClick={() => onSituacaoClick?.(stage.situacao)}
            aria-pressed={isActive}
            className={cn(
              commonWrapperClasses,
              'cursor-pointer hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive && 'hover:bg-primary/8',
            )}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );

  if (compact) return body;

  return (
    <GlassPanel className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/8">
          <GitBranch className="size-3.5 text-primary/70" />
        </span>
        <Heading level="widget">Pipeline de Perícias</Heading>
      </div>
      {body}
    </GlassPanel>
  );
}
