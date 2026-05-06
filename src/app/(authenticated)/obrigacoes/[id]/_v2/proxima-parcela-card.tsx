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
      <GlassPanel depth={1} className={cn("inset-default-plus flex items-center justify-center min-h-[180px]")}>
        <div className={cn("flex flex-col text-center stack-tight")}>
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
        'inset-default-plus relative overflow-hidden',
        atrasada && 'border-destructive/20',
      )}
    >
      <div className={cn("flex items-start justify-between inline-medium mb-4")}>
        <div className="min-w-0">
          <Text variant="meta-label" className="text-muted-foreground/60">
            Próxima parcela
          </Text>
          <div className={cn("flex items-baseline inline-tight mt-1")}>
            <Heading level="card" className="tabular-nums">
              Parcela {parcela.numeroParcela}
            </Heading>
          </div>
        </div>
        <IconContainer size="md" className="bg-primary/8 shrink-0">
          <CalendarClock className="size-4 text-primary/70" />
        </IconContainer>
      </div>

      <div className={cn("flex flex-col stack-micro mb-5")}>
        <div className={cn("flex items-baseline inline-tight")}>
          <Text
            variant="kpi-value"
            className={cn(/* design-system-escape: text-3xl → migrar para <Heading level="display-*">; leading-none sem token DS; tracking-tight sem token DS */ /* design-system-escape: text-3xl → migrar para <Heading level="display-*">; leading-none sem token DS; tracking-tight sem token DS */ "text-3xl leading-none tracking-tight")}
          >
            {formatCurrency(parcela.valorBrutoCreditoPrincipal)}
          </Text>
          <Icon className={cn('size-4', accentClass)} />
        </div>
        <div className={cn("flex items-center inline-tight text-body-sm")}>
          <Text variant="caption" className={cn( "font-medium text-foreground/85")}>
            {format(venc, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
          <span
            className={cn(
              /* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; */ 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
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

      <div className={cn("flex inline-tight flex-wrap")}>
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
