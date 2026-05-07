'use client';

import * as React from 'react';
import { parseISO, format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarRange } from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

import { formatCurrency } from '../../utils';
import type { Parcela, StatusParcela } from '../../domain';

interface CronogramaParcelasProps {
  parcelas: Parcela[];
  onSelecionar?: (parcela: Parcela) => void;
}

const STATUS_CONFIG: Record<
  StatusParcela,
  { dot: string; ring: string; label: string; labelClass: string }
> = {
  recebida: {
    dot: 'bg-success',
    ring: 'ring-success/20',
    label: 'Recebida',
    labelClass: 'text-success',
  },
  paga: {
    dot: 'bg-success',
    ring: 'ring-success/20',
    label: 'Paga',
    labelClass: 'text-success',
  },
  atrasada: {
    dot: 'bg-destructive',
    ring: 'ring-destructive/20',
    label: 'Atrasada',
    labelClass: 'text-destructive',
  },
  pendente: {
    dot: 'bg-muted-foreground/35',
    ring: 'ring-muted-foreground/10',
    label: 'Pendente',
    labelClass: 'text-muted-foreground/70',
  },
  cancelada: {
    dot: 'bg-muted-foreground/20',
    ring: 'ring-muted-foreground/5',
    label: 'Cancelada',
    labelClass: 'text-muted-foreground/50',
  },
};

/**
 * Timeline horizontal das parcelas. Status colorido, data e valor por dot.
 * Linha conectora indica progresso (preenchida até a última parcela efetivada).
 */
export function CronogramaParcelas({ parcelas, onSelecionar }: CronogramaParcelasProps) {
  const hoje = new Date();
  const parcelasOrdenadas = [...parcelas].sort((a, b) =>
    a.numeroParcela - b.numeroParcela,
  );

  const efetivadas = parcelasOrdenadas.filter(
    (p) => p.status === 'recebida' || p.status === 'paga',
  ).length;

  const progressoPct =
    parcelasOrdenadas.length > 1
      ? (efetivadas / parcelasOrdenadas.length) * 100
      : 0;

  return (
    <GlassPanel depth={1} className={cn("inset-default-plus")}>
      <div className={cn("flex items-start justify-between inline-medium mb-5")}>
        <div>
          <Text variant="meta-label" className="text-muted-foreground/60">
            Cronograma
          </Text>
          <Text variant="caption" weight="medium" className={cn( "text-foreground/85 mt-0.5")}>
            {efetivadas} de {parcelasOrdenadas.length} parcelas efetivadas
          </Text>
        </div>
        <IconContainer size="md" className="bg-primary/8 shrink-0">
          <CalendarRange className="size-4 text-primary/70" />
        </IconContainer>
      </div>

      <div className={cn("relative overflow-x-auto pb-2 -mx-1 px-1")}>
        <div
          className={cn("relative flex items-start justify-between inline-tight min-w-fit")}
          style={{ minWidth: parcelasOrdenadas.length * 96 }}
        >
          {/* linha de fundo */}
          <div className="absolute top-3 left-3 right-3 h-px bg-border/30" />
          {/* linha de progresso */}
          <div
            className="absolute top-3 left-3 h-px bg-success/50 transition-all duration-700"
            style={{
              width: `calc(${progressoPct}% - ${
                progressoPct === 100 ? '0.75rem' : '0px'
              })`,
            }}
          />

          {parcelasOrdenadas.map((parcela) => {
            const venc = parseISO(parcela.dataVencimento);
            const diff = differenceInCalendarDays(venc, hoje);
            const cfg = STATUS_CONFIG[parcela.status];
            const isAtraso =
              parcela.status === 'pendente' && diff < 0;
            const finalCfg = isAtraso
              ? {
                  ...cfg,
                  dot: 'bg-destructive/85',
                  ring: 'ring-destructive/15',
                  label: `Atrasada · ${Math.abs(diff)}d`,
                  labelClass: 'text-destructive',
                }
              : cfg;

            return (
              <button
                key={parcela.id}
                type="button"
                onClick={() => onSelecionar?.(parcela)}
                className={cn(
                  'relative flex flex-col items-center inline-tight min-w-[84px] group rounded-lg px-1 py-1',
                  'cursor-pointer hover:bg-primary/5 transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                )}
              >
                <span
                  className={cn(
                    'relative z-10 size-2.5 rounded-full ring-4',
                    'bg-background',
                    finalCfg.ring,
                  )}
                >
                  <span
                    className={cn(
                      'absolute inset-0 rounded-full',
                      finalCfg.dot,
                    )}
                  />
                </span>
                <div className={cn("flex flex-col text-center stack-nano")}>
                  <Text
                    variant="meta-label"
                    className="text-muted-foreground/60"
                  >
                    Parc. {parcela.numeroParcela}
                  </Text>
                  <Text
                    variant="caption" weight="medium"
                    className={cn( "text-foreground/85 tabular-nums block")}
                  >
                    {format(venc, 'dd MMM', { locale: ptBR })}
                  </Text>
                  <Text
                    variant="meta-label"
                    className={cn('tabular-nums block', finalCfg.labelClass)}
                  >
                    {formatCurrency(parcela.valorBrutoCreditoPrincipal)}
                  </Text>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
}
