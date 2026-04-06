'use client';

/**
 * Widget: Tipos de Contrato — Barras Horizontais
 * ============================================================================
 * Conectado via useDashboard() → data.contratos.porTipo
 * Mostra distribuição de contratos por tipo com barras horizontais.
 *
 * Uso:
 *   import { WidgetTiposContrato } from '@/app/(authenticated)/dashboard/widgets/contratos/tipos-contrato'
 * ============================================================================
 */

import { Scale } from 'lucide-react';
import {
  WidgetContainer,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario, isDashboardAdmin } from '../../hooks';

export function WidgetTiposContrato() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (!data) {
    return (
      <WidgetContainer title="Tipos de Contrato" icon={Scale} subtitle="Distribuição por natureza" depth={1}>
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
      <WidgetContainer title="Tipos de Contrato" icon={Scale} subtitle="Distribuição por natureza" depth={1}>
        <p className="text-[11px] text-muted-foreground/60 py-4 text-center">
          Dados indisponíveis
        </p>
      </WidgetContainer>
    );
  }

  const { porTipo } = contratos;
  const maxCount = Math.max(...porTipo.map((t) => t.count), 1);

  if (porTipo.length === 0) {
    return (
      <WidgetContainer title="Tipos de Contrato" icon={Scale} subtitle="Distribuição por natureza" depth={1}>
        <p className="text-[11px] text-muted-foreground/60 py-6 text-center italic">
          Nenhum contrato cadastrado.
        </p>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Tipos de Contrato"
      icon={Scale}
      subtitle="Distribuição por natureza"
      depth={1}
    >
      <div className="flex flex-col gap-2.5">
        {porTipo.map((t) => {
          const pct = (t.count / maxCount) * 100;
          return (
            <div key={t.tipo} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/70 capitalize truncate">
                  {t.tipo.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-medium tabular-nums shrink-0 ml-2">
                  {fmtNum(t.count)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-border/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/50 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </WidgetContainer>
  );
}
