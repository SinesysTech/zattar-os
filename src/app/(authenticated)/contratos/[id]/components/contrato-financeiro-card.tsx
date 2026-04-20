'use client';

import * as React from 'react';
import { DollarSign, Wallet } from 'lucide-react';

import {
  DetailSection,
  DetailSectionCard,
} from '@/components/shared/detail-section';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { cn } from '@/lib/utils';
import type { Lancamento, StatusLancamento } from '@/app/(authenticated)/financeiro/domain';

interface ContratoFinanceiroCardProps {
  lancamentos: Lancamento[];
  isLoading?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(dateStr));
  } catch {
    return '—';
  }
}

const STATUS_LABELS: Record<StatusLancamento, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  pago: 'Pago',
  recebido: 'Recebido',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
};

// =============================================================================
// SUB-COMPONENTES
// =============================================================================

function KpiTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning';
}) {
  return (
    <div className="px-3.5 py-2.5 rounded-[10px] bg-muted/40 border border-border/30">
      <div className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
        {label}
      </div>
      <div
        className={cn(
          'mt-1 font-heading text-[18px] font-bold tabular-nums leading-none',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="text-muted-foreground font-medium">
          Progresso de recebimento
        </span>
        <span className="text-primary font-bold tabular-nums">{pct}%</span>
      </div>
      <div
        className="h-1 rounded-full bg-muted/60 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function LancamentoRow({ lancamento }: { lancamento: Lancamento }) {
  return (
    <div className="grid grid-cols-[2.2fr_1fr_1fr_1fr] gap-3 items-center px-3 py-2 rounded-[10px] bg-muted/40 border border-border/30 transition-colors hover:bg-muted/60">
      <span className="text-[12.5px] font-medium text-foreground truncate">
        {lancamento.descricao}
      </span>
      <span className="text-[12.5px] font-semibold tabular-nums">
        {formatCurrency(lancamento.valor)}
      </span>
      <span className="text-[11.5px] text-muted-foreground tabular-nums">
        {formatDate(lancamento.dataVencimento)}
      </span>
      <SemanticBadge
        category="payment_status"
        value={lancamento.status}
        className="text-[10px] w-fit"
      >
        {STATUS_LABELS[lancamento.status] ?? lancamento.status}
      </SemanticBadge>
    </div>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ContratoFinanceiroCard({
  lancamentos,
  isLoading = false,
}: ContratoFinanceiroCardProps) {
  const isEmpty = lancamentos.length === 0;

  const totalReceitas = lancamentos
    .filter((l) => l.tipo === 'receita' && l.status !== 'cancelado' && l.status !== 'estornado')
    .reduce((acc, l) => acc + l.valor, 0);

  const totalPendente = lancamentos
    .filter((l) => l.status === 'pendente')
    .reduce((acc, l) => acc + l.valor, 0);

  const valorTotal = totalReceitas + totalPendente;
  const pctRecebido = valorTotal > 0 ? Math.round((totalReceitas / valorTotal) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Resumo */}
      <DetailSection icon={DollarSign} label="Resumo financeiro">
        <DetailSectionCard>
          {isEmpty ? (
            <p className="text-[12.5px] text-muted-foreground/70 italic">
              Nenhum lançamento financeiro
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                <KpiTile label="Valor total" value={formatCurrency(valorTotal)} />
                <KpiTile label="Recebido" value={formatCurrency(totalReceitas)} tone="success" />
                <KpiTile label="Pendente" value={formatCurrency(totalPendente)} tone="warning" />
              </div>
              <ProgressBar pct={pctRecebido} />
            </>
          )}
        </DetailSectionCard>
      </DetailSection>

      {/* Lançamentos */}
      {!isEmpty && (
        <DetailSection icon={Wallet} label="Lançamentos">
          <DetailSectionCard className="p-3">
            {isLoading ? (
              <p className="text-[12.5px] text-muted-foreground text-center py-3">
                Carregando...
              </p>
            ) : (
              <>
                <div className="grid grid-cols-[2.2fr_1fr_1fr_1fr] gap-3 items-center px-3 pb-2 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
                  <span>Descrição</span>
                  <span>Valor</span>
                  <span>Vencimento</span>
                  <span>Status</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {lancamentos.slice(0, 10).map((l) => (
                    <LancamentoRow key={l.id} lancamento={l} />
                  ))}
                </div>
                {lancamentos.length > 10 && (
                  <p className="pt-2.5 mt-2 text-center text-[11px] text-muted-foreground border-t border-border/30">
                    Mostrando 10 de {lancamentos.length} lançamentos
                  </p>
                )}
              </>
            )}
          </DetailSectionCard>
        </DetailSection>
      )}
    </div>
  );
}
