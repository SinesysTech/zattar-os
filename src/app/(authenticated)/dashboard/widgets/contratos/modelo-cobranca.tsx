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

import { Activity } from 'lucide-react';
import {
  WidgetContainer,
  ProgressRing,
  fmtMoeda,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario, isDashboardAdmin } from '../../hooks';

export function WidgetModeloCobranca() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (!data) {
    return (
      <WidgetContainer title="Modelo de Cobrança" icon={Activity} subtitle="Pro Labore vs Pro Êxito" depth={1}>
        <p className="text-[11px] text-muted-foreground/60 py-4 text-center">
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
        <p className="text-[11px] text-muted-foreground/60 py-4 text-center">
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
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Pro Labore */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-primary/[0.04] border border-primary/10">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">
              Pro Labore
            </p>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-lg font-bold">{fmtNum(proLabore.contratos)}</span>
                <span className="text-[9px] text-muted-foreground/50">contratos</span>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Faturado</p>
                <p className="text-[12px] font-semibold tabular-nums text-success/80">
                  {fmtMoeda(proLabore.faturado)}
                </p>
              </div>
            </div>
          </div>

          {/* Pro Êxito */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-warning/[0.04] border border-warning/10">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">
              Pro Êxito
            </p>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-lg font-bold">{fmtNum(proExito.contratos)}</span>
                <span className="text-[9px] text-muted-foreground/50">contratos</span>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Potencial</p>
                <p className="text-[12px] font-semibold tabular-nums text-primary/80">
                  {fmtMoeda(proExito.potencial)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Taxa de Realização */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/10">
          <ProgressRing
            percent={proExito.taxaRealizacao}
            size={48}
            color="var(--success)"
          />
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-medium">Taxa de Realização</p>
            <p className="text-[9px] text-muted-foreground/60">
              Percentual de êxito convertido em receita efetiva
            </p>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
