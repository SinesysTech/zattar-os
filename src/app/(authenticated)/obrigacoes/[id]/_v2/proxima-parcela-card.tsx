'use client';

import * as React from 'react';
import { parseISO, differenceInCalendarDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDown, ArrowUp, CalendarClock, CheckCircle2 } from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { formatCurrency } from '../../utils';
import type { Parcela, DirecaoPagamento } from '../../domain';

interface ProximaParcelaCardProps {
  parcela: Parcela | null;
  direcao: DirecaoPagamento;
  onMarcarRecebida?: () => void;
  onVerParcela?: () => void;
}

export function ProximaParcelaCard({
  parcela,
  direcao,
  onMarcarRecebida,
  onVerParcela,
}: ProximaParcelaCardProps) {
  if (!parcela) {
    return (
      <GlassPanel depth={1} className="p-5 flex items-center justify-center min-h-[180px]">
        <div className="text-center space-y-2">
          <IconContainer size="md" className="bg-success/8 mx-auto">
            <CheckCircle2 className="size-4 text-success/70" />
          </IconContainer>
          <Text variant="caption" className="text-muted-foreground">
            Nenhuma parcela pendente
          </Text>
        </div>
      </GlassPanel>
    );
  }

  const hoje = new Date();
  const venc = parseISO(parcela.dataVencimento);
  const diff = differenceInCalendarDays(venc, hoje);
  const atrasada = diff < 0;
  const hoje0 = diff === 0;

  const rotuloDias = atrasada
    ? `Em atraso há ${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'dia' : 'dias'}`
    : hoje0
    ? 'Vence hoje'
    : `Vence em ${diff} ${diff === 1 ? 'dia' : 'dias'}`;

  const isRecebimento = direcao === 'recebimento';
  const Icon = isRecebimento ? ArrowDown : ArrowUp;
  const accentClass = atrasada
    ? 'text-destructive'
    : hoje0
    ? 'text-warning'
    : 'text-primary';

  return (
    <GlassPanel
      depth={2}
      className={cn(
        'p-5 relative overflow-hidden',
        atrasada && 'border-destructive/20',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <Text variant="meta-label" className="text-muted-foreground/60">
            Próxima parcela
          </Text>
          <div className="flex items-baseline gap-2 mt-1">
            <Heading level="card" className="tabular-nums">
              Parcela {parcela.numeroParcela}
            </Heading>
          </div>
        </div>
        <IconContainer size="md" className="bg-primary/8 shrink-0">
          <CalendarClock className="size-4 text-primary/70" />
        </IconContainer>
      </div>

      <div className="space-y-1 mb-5">
        <div className="flex items-baseline gap-2">
          <Text
            variant="kpi-value"
            className="text-3xl leading-none tracking-tight"
          >
            {formatCurrency(parcela.valorBrutoCreditoPrincipal)}
          </Text>
          <Icon className={cn('size-4', accentClass)} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Text variant="caption" className="font-medium text-foreground/85">
            {format(venc, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
              atrasada
                ? 'bg-destructive/10 text-destructive'
                : hoje0
                ? 'bg-warning/10 text-warning'
                : 'bg-primary/8 text-primary/80',
            )}
          >
            {rotuloDias}
          </span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {onMarcarRecebida && (
          <Button
            size="sm"
            className="rounded-xl"
            onClick={onMarcarRecebida}
          >
            <CheckCircle2 className="size-3.5 mr-1" />
            {isRecebimento ? 'Marcar como recebida' : 'Marcar como paga'}
          </Button>
        )}
        {onVerParcela && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={onVerParcela}
          >
            Ver detalhes
          </Button>
        )}
      </div>
    </GlassPanel>
  );
}
