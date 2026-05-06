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
import { Text } from '@/components/ui/typography';
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
          <Text variant="caption" className="italic text-muted-foreground/70">
            Nenhum histórico disponível
          </Text>
        ) : (
          <div className="flex flex-col">
            {Object.entries(grouped).map(([monthLabel, items]) => (
              <div key={monthLabel}>
                <Text
                  variant="meta-label"
                  className={cn(/* design-system-escape: pt-1.5 padding direcional sem Inset equiv.; pb-3 padding direcional sem Inset equiv.; pl-10 padding direcional sem Inset equiv. */ "block pt-1.5 pb-3 pl-10 text-muted-foreground/70")}
                >
                  {monthLabel}
                </Text>

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
                        'flex inline-medium relative',
                        idx === items.length - 1 ? /* design-system-escape: pb-4 padding direcional sem Inset equiv. */ 'pb-4' : /* design-system-escape: pb-4 padding direcional sem Inset equiv. */ 'pb-4',
                      )}
                    >
                      {!isLast ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-3 top-7 bottom-0 w-px bg-border/30"
                        />
                      ) : null}

                      <div
                        className={cn(
                          'inline-flex items-center justify-center size-6 rounded-lg shrink-0 relative z-10 border border-border/50',
                          tone,
                        )}
                      >
                        <Icon className="size-3" />
                      </div>

                      <div className={cn(/* design-system-escape: pt-0.5 padding direcional sem Inset equiv. */ "flex-1 min-w-0 pt-0.5")}>
                        <div className={cn("flex items-center flex-wrap inline-snug")}>
                          <Text variant="label" className={cn( "font-medium")}>
                            {isCreation
                              ? 'Contrato criado com status'
                              : 'Status alterado para'}
                          </Text>
                          <SemanticBadge
                            category="status_contrato"
                            value={item.toStatus}
                          >
                            {STATUS_CONTRATO_LABELS[item.toStatus] ?? item.toStatus}
                          </SemanticBadge>
                        </div>
                        <Text
                          variant="micro-caption"
                          className="mt-1 tabular-nums block"
                        >
                          {formatDateTime(item.changedAt)}
                        </Text>

                        {item.reason ? (
                          <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "mt-2 px-3 py-2 rounded-lg bg-muted/40")}>
                            <Text
                              variant="caption"
                              className={cn(/* design-system-escape: leading-relaxed sem token DS */ "leading-relaxed text-muted-foreground")}
                            >
                              {item.reason}
                            </Text>
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
