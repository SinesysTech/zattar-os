'use client';

/**
 * AcordoPulseStrip - 4 KPIs do acordo individual
 * ============================================================================
 * Complementa o ObrigacoesPulseStrip (módulo) com métricas específicas do
 * acordo aberto em /obrigacoes/[id]: saldo, progresso, atraso, próxima parcela.
 * ============================================================================
 */

import * as React from 'react';
import { parseISO, differenceInCalendarDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CalendarClock, CheckCircle2, Wallet } from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { AnimatedNumber } from '@/app/(authenticated)/dashboard/widgets/primitives';
import { cn } from '@/lib/utils';

import type { AcordoComParcelas } from '../../domain';

interface AcordoPulseStripProps {
  acordo: AcordoComParcelas;
}

const CURRENCY = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

export function AcordoPulseStrip({ acordo }: AcordoPulseStripProps) {
  const parcelas = acordo.parcelas ?? [];
  const hoje = new Date();

  const valorPago = parcelas
    .filter((p) => p.status === 'paga' || p.status === 'recebida')
    .reduce((acc, p) => acc + Number(p.valorBrutoCreditoPrincipal ?? 0), 0);

  const saldoDevedor = Math.max(0, acordo.valorTotal - valorPago);

  const parcelasAtrasadas = parcelas.filter((p) => {
    if (p.status === 'paga' || p.status === 'recebida' || p.status === 'cancelada') return false;
    try {
      return differenceInCalendarDays(parseISO(p.dataVencimento), hoje) < 0;
    } catch {
      return false;
    }
  }).length;

  const proximaParcela = parcelas
    .filter((p) => p.status === 'pendente')
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))[0];

  const progressoPct =
    acordo.totalParcelas > 0
      ? Math.round((acordo.parcelasPagas / acordo.totalParcelas) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Saldo devedor */}
      <GlassPanel depth={1} className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate">
              Saldo devedor
            </p>
            <p className="font-display text-2xl font-bold tabular-nums leading-none tracking-tight mt-1">
              {CURRENCY.format(saldoDevedor)}
            </p>
            <p className="text-[10px] text-muted-foreground/45 mt-0.5">
              de {CURRENCY.format(acordo.valorTotal)}
            </p>
          </div>
          <IconContainer size="md" className="bg-primary/8">
            <Wallet className="size-4 text-primary/60" />
          </IconContainer>
        </div>
      </GlassPanel>

      {/* 2. Parcelas pagas (progresso) */}
      <GlassPanel depth={1} className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate">
              Parcelas pagas
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-2xl font-bold tabular-nums leading-none tracking-tight">
                <AnimatedNumber value={acordo.parcelasPagas} />
              </p>
              <span className="text-sm text-muted-foreground/50 tabular-nums">
                / {acordo.totalParcelas}
              </span>
            </div>
          </div>
          <IconContainer size="md" className="bg-success/8">
            <CheckCircle2 className="size-4 text-success/60" />
          </IconContainer>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-success/35 transition-all duration-700"
              style={{ width: `${progressoPct}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {progressoPct}%
          </span>
        </div>
      </GlassPanel>

      {/* 3. Em atraso */}
      <GlassPanel
        depth={parcelasAtrasadas > 0 ? 2 : 1}
        className={cn(
          'px-4 py-3.5',
          parcelasAtrasadas > 0 && 'border-destructive/15',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate">
              Em atraso
            </p>
            <p
              className={cn(
                'font-display text-2xl font-bold tabular-nums leading-none tracking-tight mt-1',
                parcelasAtrasadas > 0 && 'text-destructive/80',
              )}
            >
              <AnimatedNumber value={parcelasAtrasadas} />
            </p>
            <p className="text-[10px] text-muted-foreground/45 mt-0.5">
              {parcelasAtrasadas === 0
                ? 'Tudo em dia'
                : parcelasAtrasadas === 1
                ? 'parcela vencida'
                : 'parcelas vencidas'}
            </p>
          </div>
          <IconContainer
            size="md"
            className={cn(
              'bg-destructive/8',
              parcelasAtrasadas > 0 && 'border border-destructive/20',
            )}
          >
            <AlertTriangle className="size-4 text-destructive/60" />
          </IconContainer>
        </div>
      </GlassPanel>

      {/* 4. Próxima parcela */}
      <GlassPanel depth={1} className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate">
              Próxima parcela
            </p>
            {proximaParcela ? (
              <>
                <p className="font-display text-xl font-bold tabular-nums leading-none tracking-tight mt-1">
                  {format(parseISO(proximaParcela.dataVencimento), "dd 'de' MMM", {
                    locale: ptBR,
                  })}
                </p>
                <p className="text-[10px] text-muted-foreground/45 mt-0.5 tabular-nums">
                  {CURRENCY.format(proximaParcela.valorBrutoCreditoPrincipal)}
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-xl font-bold leading-none tracking-tight mt-1 text-muted-foreground/40">
                  —
                </p>
                <p className="text-[10px] text-muted-foreground/45 mt-0.5">
                  Sem pendências
                </p>
              </>
            )}
          </div>
          <IconContainer size="md" className="bg-warning/8">
            <CalendarClock className="size-4 text-warning/60" />
          </IconContainer>
        </div>
      </GlassPanel>
    </div>
  );
}
