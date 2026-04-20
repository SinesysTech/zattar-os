'use client';

/**
 * ObrigacoesDayList — Glass Briefing
 * ============================================================================
 * Lista as parcelas com vencimento no dia selecionado.
 * Usado no layout master-detail da view mensal.
 * ============================================================================
 */

import * as React from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { AcordoComParcelas, Parcela } from '../../domain';
import { STATUS_LABELS, TIPO_LABELS } from '../../domain';

interface ObrigacoesDayListProps {
  selectedDate: Date;
  obrigacoes: AcordoComParcelas[];
  onAddObrigacao?: () => void;
  className?: string;
}

interface ParcelaDisplay {
  parcela: Parcela;
  acordo: AcordoComParcelas;
}

const PARCELA_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  recebida: 'Recebida',
  paga: 'Paga',
  atrasada: 'Atrasada',
  cancelada: 'Cancelada',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function ObrigacoesDayList({
  selectedDate,
  obrigacoes,
  onAddObrigacao,
  className,
}: ObrigacoesDayListProps) {
  const parcelasDoDia = React.useMemo(() => {
    const items: ParcelaDisplay[] = [];
    obrigacoes.forEach((acordo) => {
      acordo.parcelas?.forEach((parcela) => {
        if (!parcela.dataVencimento) return;
        if (isSameDay(parseISO(parcela.dataVencimento), selectedDate)) {
          items.push({ parcela, acordo });
        }
      });
    });
    return items.sort((a, b) => {
      if (a.parcela.status === 'atrasada' && b.parcela.status !== 'atrasada')
        return -1;
      if (a.parcela.status !== 'atrasada' && b.parcela.status === 'atrasada')
        return 1;
      return (a.parcela.numeroParcela || 0) - (b.parcela.numeroParcela || 0);
    });
  }, [obrigacoes, selectedDate]);

  const formattedDate = capitalizeFirstLetter(
    format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR }),
  );

  const countLabel =
    parcelasDoDia.length === 1 ? '1 parcela' : `${parcelasDoDia.length} parcelas`;

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/10 px-6 py-4">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="h-4 w-4 text-muted-foreground/50 shrink-0" />
          <h2 className="text-sm font-semibold tracking-tight truncate">
            {formattedDate}
          </h2>
        </div>
        {onAddObrigacao && (
          <Button
            size="sm"
            onClick={onAddObrigacao}
            className="h-7 text-[11px] shrink-0"
          >
            <Plus className="h-3 w-3 mr-1" />
            Nova
          </Button>
        )}
      </div>

      {/* Content */}
      {parcelasDoDia.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 opacity-60">
          <Calendar className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground/50">
            Nenhuma obrigação neste dia
          </p>
          {onAddObrigacao && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddObrigacao}
              className="h-7 text-[11px]"
            >
              <Plus className="h-3 w-3 mr-1" />
              Nova obrigação
            </Button>
          )}
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-2">
              {parcelasDoDia.map((item) => {
                const { parcela, acordo } = item;
                const isAtrasada = parcela.status === 'atrasada';
                const processoNumero =
                  acordo.processo?.numero_processo || `Acordo #${acordo.id}`;
                const tipoLabel = TIPO_LABELS[acordo.tipo] ?? acordo.tipo;
                const statusLabel =
                  PARCELA_STATUS_LABELS[parcela.status] ||
                  STATUS_LABELS[parcela.status as keyof typeof STATUS_LABELS] ||
                  parcela.status;

                return (
                  <GlassPanel
                    key={parcela.id}
                    depth={1}
                    className={cn(
                      'px-4 py-3 transition-colors',
                      isAtrasada && 'border-destructive/20',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium tabular-nums">
                            Parcela {parcela.numeroParcela}
                          </span>
                          <SemanticBadge
                            category="parcela_status"
                            value={parcela.status}
                            className="text-[9px]"
                          >
                            {statusLabel}
                          </SemanticBadge>
                          <SemanticBadge
                            category="obrigacao_tipo"
                            value={acordo.tipo}
                            className="text-[9px]"
                          >
                            {tipoLabel}
                          </SemanticBadge>
                        </div>
                        <div className="text-[10px] text-muted-foreground/55 truncate mt-1">
                          {processoNumero}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold tabular-nums">
                          {formatCurrency(parcela.valorBrutoCreditoPrincipal || 0)}
                        </div>
                      </div>
                    </div>
                  </GlassPanel>
                );
              })}
            </div>
          </ScrollArea>

          <div className="border-t border-border/10 px-6 py-3">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/55">
              {countLabel}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
