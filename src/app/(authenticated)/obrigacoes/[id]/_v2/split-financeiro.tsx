'use client';

import * as React from 'react';
import { Scale } from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

import { formatCurrency } from '../../utils';
import type { AcordoComParcelas } from '../../domain';

interface SplitFinanceiroProps {
  acordo: AcordoComParcelas;
}

/**
 * Visualização do split do valor total do acordo entre cliente, escritório
 * (honorários contratuais) e sucumbência. Mostra barra segmentada + breakdown.
 */
export function SplitFinanceiro({ acordo }: SplitFinanceiroProps) {
  const { valorTotal, honorariosSucumbenciaisTotal, percentualCliente, percentualEscritorio } =
    acordo;

  const sucumbencia = honorariosSucumbenciaisTotal ?? 0;
  const valorPrincipal = Math.max(0, valorTotal - sucumbencia);
  const valorEscritorio = valorPrincipal * (percentualEscritorio / 100);
  const valorCliente = valorPrincipal * (percentualCliente / 100);
  const totalEscritorio = valorEscritorio + sucumbencia;

  const pctCliente = valorTotal > 0 ? (valorCliente / valorTotal) * 100 : 0;
  const pctEscritorio = valorTotal > 0 ? (valorEscritorio / valorTotal) * 100 : 0;
  const pctSucumbencia = valorTotal > 0 ? (sucumbencia / valorTotal) * 100 : 0;

  return (
    <GlassPanel depth={1} className={cn(/* design-system-escape: p-5 → usar <Inset> */ "p-5")}>
      <div className={cn("flex items-start justify-between inline-medium mb-4")}>
        <div>
          <Text variant="meta-label" className="text-muted-foreground/60">
            Split financeiro
          </Text>
          <Text variant="caption" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-foreground/85 font-medium mt-0.5")}>
            Distribuição sobre {formatCurrency(valorTotal)}
          </Text>
        </div>
        <IconContainer size="md" className="bg-primary/8 shrink-0">
          <Scale className="size-4 text-primary/70" />
        </IconContainer>
      </div>

      <div className="h-2 rounded-full bg-muted/30 overflow-hidden flex mb-4">
        {pctCliente > 0 && (
          <div
            className="h-full bg-primary/70 transition-all duration-500"
            style={{ width: `${pctCliente}%` }}
            aria-label={`Cliente ${pctCliente.toFixed(1)}%`}
          />
        )}
        {pctEscritorio > 0 && (
          <div
            className="h-full bg-success/60 transition-all duration-500"
            style={{ width: `${pctEscritorio}%` }}
            aria-label={`Escritório ${pctEscritorio.toFixed(1)}%`}
          />
        )}
        {pctSucumbencia > 0 && (
          <div
            className="h-full bg-warning/60 transition-all duration-500"
            style={{ width: `${pctSucumbencia}%` }}
            aria-label={`Sucumbência ${pctSucumbencia.toFixed(1)}%`}
          />
        )}
      </div>

      <ul className={cn(/* design-system-escape: space-y-2.5 sem token DS */ "space-y-2.5")}>
        <SplitRow
          dotClass="bg-primary/70"
          label="Cliente"
          hint={`${percentualCliente}% sobre principal`}
          valor={valorCliente}
          valorTotal={valorTotal}
        />
        <SplitRow
          dotClass="bg-success/60"
          label="Escritório (honorários)"
          hint={`${percentualEscritorio}% sobre principal`}
          valor={valorEscritorio}
          valorTotal={valorTotal}
        />
        {sucumbencia > 0 && (
          <SplitRow
            dotClass="bg-warning/60"
            label="Sucumbência"
            hint="100% escritório"
            valor={sucumbencia}
            valorTotal={valorTotal}
          />
        )}
      </ul>

      {sucumbencia > 0 && (
        <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "mt-4 pt-3 border-t border-border/15 flex items-center justify-between")}>
          <Text variant="meta-label" className="text-muted-foreground/60">
            Total escritório
          </Text>
          <Text variant="caption" className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "font-semibold tabular-nums")}>
            {formatCurrency(totalEscritorio)}
          </Text>
        </div>
      )}
    </GlassPanel>
  );
}

function SplitRow({
  dotClass,
  label,
  hint,
  valor,
  valorTotal,
}: {
  dotClass: string;
  label: string;
  hint: string;
  valor: number;
  valorTotal: number;
}) {
  const pct = valorTotal > 0 ? (valor / valorTotal) * 100 : 0;
  return (
    <li className={cn("flex items-center inline-medium")}>
      <span className={cn('size-2 rounded-full shrink-0', dotClass)} />
      <div className={cn("flex-1 min-w-0 flex items-baseline justify-between inline-medium")}>
        <div className="min-w-0">
          <Text variant="caption" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground/85")}>
            {label}
          </Text>
          <Text variant="meta-label" className="text-muted-foreground/55 block">
            {hint}
          </Text>
        </div>
        <div className="text-right shrink-0">
          <Text variant="caption" className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "font-semibold tabular-nums")}>
            {formatCurrency(valor)}
          </Text>
          <Text
            variant="meta-label"
            className="text-muted-foreground/55 tabular-nums block"
          >
            {pct.toFixed(1)}%
          </Text>
        </div>
      </div>
    </li>
  );
}
