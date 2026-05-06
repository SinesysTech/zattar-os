'use client';

import * as React from 'react';
import { DollarSign, Wallet } from 'lucide-react';

import {
  DetailSection,
  DetailSectionCard,
} from '@/components/shared/detail-section';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Text } from '@/components/ui/typography';
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
    <div className={cn("flex flex-col inline-snug px-4 py-3 rounded-xl bg-muted/30 border border-border/40")}>
      <Text variant="meta-label">{label}</Text>
      <Text
        variant="kpi-value"
        className={cn(
          'leading-none text-[22px]',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
        )}
      >
        {value}
      </Text>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <Text variant="caption" className={cn( "font-medium")}>
          Progresso de recebimento
        </Text>
        <Text variant="caption" className={cn( "text-primary font-bold tabular-nums")}>
          {pct}%
        </Text>
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
    <div className={cn("grid grid-cols-[2.2fr_1fr_1fr_1fr] inline-medium items-center px-3 py-2.5 rounded-xl bg-muted/30 border border-border/40 transition-colors hover:bg-muted/50")}>
      <Text variant="label" className="truncate block">
        {lancamento.descricao}
      </Text>
      <Text variant="label" className={cn( "tabular-nums font-semibold")}>
        {formatCurrency(lancamento.valor)}
      </Text>
      <Text variant="caption" className="tabular-nums">
        {formatDate(lancamento.dataVencimento)}
      </Text>
      <SemanticBadge
        category="payment_status"
        value={lancamento.status}
        className="w-fit"
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
    <div className={cn("flex flex-col inline-default-plus")}>
      {/* Resumo */}
      <DetailSection icon={DollarSign} label="Resumo financeiro">
        <DetailSectionCard>
          {isEmpty ? (
            <Text variant="caption" className="italic text-muted-foreground/70">
              Nenhum lançamento financeiro
            </Text>
          ) : (
            <>
              <div className={cn("grid grid-cols-3 inline-medium mb-4")}>
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
          <DetailSectionCard className={cn("inset-medium")}>
            {isLoading ? (
              <Text variant="caption" className={cn("text-center py-3 block")}>
                Carregando...
              </Text>
            ) : (
              <>
                <div className={cn("grid grid-cols-[2.2fr_1fr_1fr_1fr] inline-medium items-center px-3 pb-2")}>
                  <Text variant="meta-label">Descrição</Text>
                  <Text variant="meta-label">Valor</Text>
                  <Text variant="meta-label">Vencimento</Text>
                  <Text variant="meta-label">Status</Text>
                </div>
                <div className={cn("flex flex-col inline-snug")}>
                  {lancamentos.slice(0, 10).map((l) => (
                    <LancamentoRow key={l.id} lancamento={l} />
                  ))}
                </div>
                {lancamentos.length > 10 && (
                  <Text
                    variant="caption"
                    className={cn("pt-2.5 mt-2 text-center block border-t border-border/40")}
                  >
                    Mostrando 10 de {lancamentos.length} lançamentos
                  </Text>
                )}
              </>
            )}
          </DetailSectionCard>
        </DetailSection>
      )}
    </div>
  );
}
