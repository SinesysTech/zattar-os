'use client';

/**
 * WidgetKpiPulse -- Widget conectado (col-span-2)
 * Fonte: useDashboard()
 *   - data.processos: total, ativos, tendenciaMensal
 *   - role=admin: data.metricas for taxaResolucao
 */

import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';
import {
  WidgetContainer,
  Stat,
  ProgressRing,
  Sparkline,
  
  
  fmtNum,
} from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario, isDashboardAdmin } from '../../hooks';
import { Text } from '@/components/ui/typography';

export function WidgetKpiPulse() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (!data) {
    return (
      <WidgetContainer
        title="Painel KPI"
        icon={Activity}
        subtitle="Resumo operacional"
        depth={2}
      >
        <Text variant="caption">
          Nao foi possivel carregar os dados processuais.
        </Text>
      </WidgetContainer>
    );
  }

  let total: number;
  let ativos: number;
  let novosMes: number;
  let resolvidosMes: number;
  let tendenciaData: number[];

  if (isDashboardUsuario(data)) {
    const p = data.processos;
    total = p.total;
    ativos = p.ativos;
    const tend = p.tendenciaMensal;
    if (tend && tend.length > 0) {
      novosMes = tend[tend.length - 1].novos;
      resolvidosMes = tend[tend.length - 1].resolvidos;
      tendenciaData = tend.map((t) => t.novos);
    } else {
      novosMes = 0;
      resolvidosMes = 0;
      tendenciaData = [];
    }
  } else if (isDashboardAdmin(data)) {
    const m = data.metricas;
    total = m.totalProcessos;
    ativos = m.processosAtivos;
    novosMes = 0;
    resolvidosMes = 0;
    tendenciaData = [];
  } else {
    return null;
  }

  const taxaResolucao =
    resolvidosMes + novosMes > 0
      ? Math.round((resolvidosMes / (resolvidosMes + novosMes)) * 100)
      : 0;

  return (
    <WidgetContainer
      title="Painel KPI"
      icon={Activity}
      subtitle="Resumo operacional"
      depth={2}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
        <Stat
          label="Total"
          value={fmtNum(total)}
          delta="carteira ativa"
          deltaType="neutral"
        />
        <Stat
          label="Ativos"
          value={fmtNum(ativos)}
          delta={total > 0 ? `${Math.round((ativos / total) * 100)}% do total` : '0% do total'}
          deltaType="neutral"
        />
        <Stat
          label="Novos / mes"
          value={fmtNum(novosMes)}
          deltaType="neutral"
          small
        />
        <Stat
          label="Resolvidos / mes"
          value={fmtNum(resolvidosMes)}
          deltaType="neutral"
          small
        />
      </div>

      <div className={cn("flex items-center inline-default pt-3 border-t border-border/10")}>
        <div className={cn("flex items-center inline-medium")}>
          <ProgressRing
            percent={taxaResolucao}
            size={48}
            color="hsl(142 60% 45%)"
          />
          <div>
            <p className={cn("text-overline text-muted-foreground/50")}>
              Taxa de Resolucao
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              encerrados / (enc. + novos)
            </p>
          </div>
        </div>
        {tendenciaData.length >= 2 && (
          <div className={cn("flex-1 flex flex-col items-end inline-micro")}>
            <p className={cn("text-[9px] text-muted-foreground/60 uppercase tracking-wider")}>
              Tendencia {tendenciaData.length}m
            </p>
            <Sparkline
              data={tendenciaData}
              width={72}
              height={24}
              color="hsl(142 60% 45%)"
            />
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
