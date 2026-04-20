'use client';

import * as React from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ArrowRightLeft,
  type LucideIcon,
} from 'lucide-react';

import {
  DetailSection,
  DetailSectionCard,
} from '@/components/shared/detail-section';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { cn } from '@/lib/utils';
import type {
  ContratoStatusHistorico,
  StatusContrato,
} from '@/app/(authenticated)/contratos';
import { STATUS_CONTRATO_LABELS } from '@/app/(authenticated)/contratos';

// =============================================================================
// HELPERS
// =============================================================================

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getEventIcon(toStatus: StatusContrato, isCreation: boolean): LucideIcon {
  if (isCreation) return Plus;
  switch (toStatus) {
    case 'contratado':
    case 'distribuido':
      return CheckCircle2;
    case 'desistencia':
      return XCircle;
    case 'em_contratacao':
      return Clock;
    default:
      return ArrowRightLeft;
  }
}

function getDotTone(toStatus: StatusContrato, isCreation: boolean): string {
  if (isCreation) return 'bg-primary/10 text-primary';
  switch (toStatus) {
    case 'contratado':
    case 'distribuido':
      return 'bg-success/10 text-success';
    case 'desistencia':
      return 'bg-destructive/10 text-destructive';
    case 'em_contratacao':
      return 'bg-warning/10 text-warning';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function groupByMonth(
  items: ContratoStatusHistorico[],
): Record<string, ContratoStatusHistorico[]> {
  return items.reduce(
    (acc, entry) => {
      const monthKey = new Date(entry.changedAt).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(entry);
      return acc;
    },
    {} as Record<string, ContratoStatusHistorico[]>,
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

interface ContratoTimelineProps {
  historico: ContratoStatusHistorico[];
}

export function ContratoTimeline({ historico }: ContratoTimelineProps) {
  const isEmpty = historico.length === 0;

  const sorted = React.useMemo(
    () =>
      [...historico].sort(
        (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
      ),
    [historico],
  );

  const grouped = React.useMemo(() => groupByMonth(sorted), [sorted]);

  return (
    <DetailSection icon={History} label="Histórico de status">
      <DetailSectionCard>
        {isEmpty ? (
          <p className="text-[12.5px] text-muted-foreground/70 italic">
            Nenhum histórico disponível
          </p>
        ) : (
          <div className="flex flex-col">
            {Object.entries(grouped).map(([monthLabel, items]) => (
              <div key={monthLabel}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 pt-1.5 pb-2.5 pl-10">
                  {monthLabel}
                </p>

                {items.map((item, idx) => {
                  const globalIdx = sorted.findIndex((s) => s.id === item.id);
                  const isLast = globalIdx === sorted.length - 1;
                  const isCreation = item.fromStatus === null;
                  const Icon = getEventIcon(item.toStatus, isCreation);
                  const tone = getDotTone(item.toStatus, isCreation);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex gap-3 relative',
                        idx === items.length - 1 ? 'pb-4' : 'pb-4',
                      )}
                    >
                      {!isLast ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-3.25 top-6.5 bottom-0 w-px bg-border/40"
                        />
                      ) : null}

                      <div
                        className={cn(
                          'inline-flex items-center justify-center size-6.5 rounded-[8px] shrink-0 relative z-10 border border-border/50',
                          tone,
                        )}
                      >
                        <Icon className="size-3" />
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="text-[12.5px] text-foreground/90 flex items-center flex-wrap gap-1.5">
                          <span className="font-medium">
                            {isCreation
                              ? 'Contrato criado com status'
                              : 'Status alterado para'}
                          </span>
                          <SemanticBadge
                            category="status_contrato"
                            value={item.toStatus}
                            className="text-[10px]"
                          >
                            {STATUS_CONTRATO_LABELS[item.toStatus] ?? item.toStatus}
                          </SemanticBadge>
                        </div>
                        <div className="text-[10.5px] text-muted-foreground mt-1 tabular-nums">
                          {formatDateTime(item.changedAt)}
                        </div>

                        {item.reason ? (
                          <div className="mt-2 px-3 py-2 rounded-[8px] bg-muted/50 text-[11.5px] text-muted-foreground leading-relaxed">
                            {item.reason}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </DetailSectionCard>
    </DetailSection>
  );
}
