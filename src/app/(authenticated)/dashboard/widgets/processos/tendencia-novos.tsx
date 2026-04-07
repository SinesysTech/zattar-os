'use client';

/**
 * WidgetTendenciaNovos -- Widget conectado
 * Fonte: useDashboard()
 *   - data.processos.tendenciaMensal (mes/novos/resolvidos)
 */

import { TrendingUp } from 'lucide-react';
import {
  WidgetContainer,
  Stat,
  MiniArea,
  fmtNum,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario } from '../../hooks';

export function WidgetTendenciaNovos() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer
        title="Novos Processos"
        icon={TrendingUp}
        subtitle="Tendencia -- ultimos 8 meses"
        depth={1}
      >
        <p className="text-xs text-muted-foreground">
          Nao foi possivel carregar os dados processuais.
        </p>
      </WidgetContainer>
    );
  }

  let tendencia: { mes: string; novos: number; resolvidos: number }[] | undefined;

  if (isDashboardUsuario(data)) {
    tendencia = data.processos.tendenciaMensal;
  } else {
    return null;
  }

  if (!tendencia || tendencia.length === 0) {
    return (
      <WidgetContainer
        title="Novos Processos"
        icon={TrendingUp}
        subtitle="Tendencia -- ultimos 8 meses"
        depth={1}
      >
        <p className="text-[10px] text-muted-foreground/60">
          Dados insuficientes para exibir tendencia.
        </p>
      </WidgetContainer>
    );
  }

  const novosData = tendencia.map((t) => t.novos);
  const labels = tendencia.map((t) => t.mes);
  const current = novosData[novosData.length - 1];
  const prev = novosData.length >= 2 ? novosData[novosData.length - 2] : current;
  const delta = current - prev;
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta} vs. mes anterior`;

  return (
    <WidgetContainer
      title="Novos Processos"
      icon={TrendingUp}
      subtitle="Tendencia -- ultimos 8 meses"
      depth={1}
    >
      <div className="flex items-end justify-between gap-3 mb-3">
        <Stat
          label="Este mes"
          value={fmtNum(current)}
          delta={deltaLabel}
          deltaType={delta > 0 ? 'negative' : 'positive'}
        />
        <MiniArea
          data={novosData}
          width={110}
          height={44}
          color="var(--primary)"
        />
      </div>
      <div className="flex items-end justify-between pt-2 border-t border-border/10">
        {tendencia.map((t, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground/60 tabular-nums">{t.novos}</span>
            <span className="text-[8px] text-muted-foreground/55">{labels[i]}</span>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
}
