'use client';

/**
 * Widget: Status das Parcelas — StackedBar + breakdown
 * ============================================================================
 * Conectado via useDashboard() → data.contratos.parcelasStatus
 * Mostra barra empilhada com legenda, contagens, percentuais e totais.
 *
 * Uso:
 *   import { WidgetParcelasStatus } from '@/app/(authenticated)/dashboard/widgets/contratos/parcelas-status'
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';
import {
  WidgetContainer,
  StackedBar,
  fmtMoeda,
  fmtNum,
} from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario, isDashboardAdmin } from '../../hooks';
import { tokenForTone } from '@/lib/design-system';
import { ToneDot } from '@/components/ui/tone-dot';

export function WidgetParcelasStatus() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (!data) {
    return (
      <WidgetContainer title="Parcelas" icon={BarChart3} subtitle="Status de pagamento" depth={1}>
        <p className={cn(/* design-system-escape: py-4 padding direcional sem Inset equiv. */ "text-[11px] text-muted-foreground/60 py-4 text-center")}>
          Não foi possível carregar os dados.
        </p>
      </WidgetContainer>
    );
  }

  const contratos = isDashboardUsuario(data)
    ? data.contratos
    : isDashboardAdmin(data)
      ? data.contratos
      : undefined;

  if (!contratos) {
    return (
      <WidgetContainer title="Parcelas" icon={BarChart3} subtitle="Status de pagamento" depth={1}>
        <p className={cn(/* design-system-escape: py-4 padding direcional sem Inset equiv. */ "text-[11px] text-muted-foreground/60 py-4 text-center")}>
          Dados indisponíveis
        </p>
      </WidgetContainer>
    );
  }

  const { parcelasStatus } = contratos;

  const totalCount = parcelasStatus.reduce((acc, p) => acc + p.count, 0);
  const totalValor = parcelasStatus.reduce((acc, p) => acc + p.valor, 0);
  const valorPendente = parcelasStatus
    .filter((p) => p.status !== 'paga')
    .reduce((acc, p) => acc + p.valor, 0);

  const segments = parcelasStatus.map((p) => ({
    value: p.count,
    color: tokenForTone(p.tone),
    label: p.status,
  }));

  if (totalCount === 0) {
    return (
      <WidgetContainer title="Parcelas" icon={BarChart3} subtitle="Status de pagamento" depth={1}>
        <p className={cn(/* design-system-escape: py-6 padding direcional sem Inset equiv. */ "text-[11px] text-muted-foreground/60 py-6 text-center italic")}>
          Nenhuma parcela registrada.
        </p>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Parcelas"
      icon={BarChart3}
      subtitle="Status de pagamento"
      depth={1}
    >
      <div className={cn("flex flex-col inline-default")}>
        <StackedBar segments={segments} height={10} />

        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex flex-col gap-1.5")}>
          {parcelasStatus.map((p) => {
            const pct = totalCount > 0 ? ((p.count / totalCount) * 100).toFixed(0) : '0';
            return (
              <div key={p.status} className={cn("flex items-center inline-tight")}>
                <ToneDot tone={p.tone} shape="square" size="lg" aria-label={p.status} />
                <span className="text-[10px] text-muted-foreground/70 truncate flex-1 capitalize">
                  {p.status.replace(/_/g, ' ')}
                </span>
                <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[10px] font-medium tabular-nums")}>
                  {fmtNum(p.count)}
                </span>
                <span className="text-[9px] text-muted-foreground/50 tabular-nums w-8 text-right">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>

        <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "flex justify-between pt-3 border-t border-border/10")}>
          <div>
            <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/60 uppercase tracking-wider")}>
              Total
            </p>
            <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-body-sm font-semibold font-display tabular-nums")}>
              {fmtMoeda(totalValor)}
            </p>
          </div>
          <div className="text-right">
            <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/60 uppercase tracking-wider")}>
              Pendente
            </p>
            <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-body-sm font-semibold font-display tabular-nums text-warning/80")}>
              {fmtMoeda(valorPendente)}
            </p>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
