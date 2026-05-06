'use client';

/**
 * Widget: Modelo de Cobrança — Pro Labore vs Pro Êxito
 * ============================================================================
 * Conectado via useDashboard() → data.contratos.modeloCobranca
 * Mostra comparação lado a lado: Pro Labore (contratos + faturado) vs
 * Pro Êxito (contratos + potencial), com ProgressRing para taxa de realização.
 *
 * Uso:
 *   import { WidgetModeloCobranca } from '@/app/(authenticated)/dashboard/widgets/contratos/modelo-cobranca'
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';
import {
  WidgetContainer,
  ProgressRing,
  fmtMoeda,
  fmtNum,
} from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario, isDashboardAdmin } from '../../hooks';

export function WidgetModeloCobranca() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (!data) {
    return (
      <WidgetContainer title="Modelo de Cobrança" icon={Activity} subtitle="Pro Labore vs Pro Êxito" depth={1}>
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
      <WidgetContainer title="Modelo de Cobrança" icon={Activity} subtitle="Pro Labore vs Pro Êxito" depth={1}>
        <p className={cn(/* design-system-escape: py-4 padding direcional sem Inset equiv. */ "text-[11px] text-muted-foreground/60 py-4 text-center")}>
          Dados indisponíveis
        </p>
      </WidgetContainer>
    );
  }

  const { modeloCobranca } = contratos;
  const { proLabore, proExito } = modeloCobranca;

  return (
    <WidgetContainer
      title="Modelo de Cobrança"
      icon={Activity}
      subtitle="Pro Labore vs Pro Êxito"
      depth={1}
    >
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex flex-col gap-4")}>
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-2 gap-4")}>
          {/* Pro Labore */}
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; p-3 → usar <Inset> */ "flex flex-col gap-2 p-3 rounded-xl bg-primary/[0.04] border border-primary/10")}>
            <p className={cn(/* design-system-escape: tracking-wider sem token DS; font-medium → className de <Text>/<Heading> */ "text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium")}>
              Pro Labore
            </p>
            <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-col gap-1")}>
              <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-baseline gap-1")}>
                <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "font-display text-body-lg font-bold")}>{fmtNum(proLabore.contratos)}</span>
                <span className="text-[9px] text-muted-foreground/50">contratos</span>
              </div>
              <div>
                <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/50 uppercase tracking-wider")}>Faturado</p>
                <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[12px] font-semibold tabular-nums text-success/80")}>
                  {fmtMoeda(proLabore.faturado)}
                </p>
              </div>
            </div>
          </div>

          {/* Pro Êxito */}
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; p-3 → usar <Inset> */ "flex flex-col gap-2 p-3 rounded-xl bg-warning/[0.04] border border-warning/10")}>
            <p className={cn(/* design-system-escape: tracking-wider sem token DS; font-medium → className de <Text>/<Heading> */ "text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium")}>
              Pro Êxito
            </p>
            <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-col gap-1")}>
              <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-baseline gap-1")}>
                <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "font-display text-body-lg font-bold")}>{fmtNum(proExito.contratos)}</span>
                <span className="text-[9px] text-muted-foreground/50">contratos</span>
              </div>
              <div>
                <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/50 uppercase tracking-wider")}>Potencial</p>
                <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[12px] font-semibold tabular-nums text-primary/80")}>
                  {fmtMoeda(proExito.potencial)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Taxa de Realização */}
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default">; pt-3 padding direcional sem Inset equiv. */ "flex items-center gap-4 pt-3 border-t border-border/10")}>
          <ProgressRing
            percent={proExito.taxaRealizacao}
            size={48}
            color="var(--success)"
          />
          <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex flex-col gap-0.5")}>
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[10px] font-medium")}>Taxa de Realização</p>
            <p className="text-[9px] text-muted-foreground/60">
              Percentual de êxito convertido em receita efetiva
            </p>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
