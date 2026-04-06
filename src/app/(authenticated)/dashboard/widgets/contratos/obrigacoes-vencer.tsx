'use client';

/**
 * Widget: Obrigações a Vencer — Lista com urgência
 * ============================================================================
 * Conectado via useDashboard() → data.contratos.obrigacoesVencer
 * Mostra obrigações próximas do vencimento com dot de urgência, badge de tipo,
 * data de vencimento e valor.
 *
 * Uso:
 *   import { WidgetObrigacoesVencer } from '@/app/(authenticated)/dashboard/widgets/contratos/obrigacoes-vencer'
 * ============================================================================
 */

import { Wallet } from 'lucide-react';
import {
  WidgetContainer,
  UrgencyDot,
  ListItem,
  fmtMoeda,
  fmtData,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario, isDashboardAdmin } from '../../hooks';

type UrgencyLevel = 'critico' | 'alto' | 'medio' | 'baixo' | 'ok';

function mapUrgencia(urgencia: string): UrgencyLevel {
  const map: Record<string, UrgencyLevel> = {
    critico: 'critico',
    alto: 'alto',
    medio: 'medio',
    baixo: 'baixo',
    ok: 'ok',
  };
  return map[urgencia] ?? 'baixo';
}

const TIPO_BADGE_COLORS: Record<string, string> = {
  acordo: 'bg-primary/10 text-primary/80',
  condenacao: 'bg-destructive/10 text-destructive/80',
  custas: 'bg-warning/10 text-warning/80',
};

function TipoBadge({ tipo }: { tipo: string }) {
  const colorClass = TIPO_BADGE_COLORS[tipo.toLowerCase()] ?? 'bg-border/10 text-muted-foreground/70';
  const label = tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

export function WidgetObrigacoesVencer() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (!data) {
    return (
      <WidgetContainer title="Obrigações a Vencer" icon={Wallet} subtitle="Próximos 30 dias" depth={1}>
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
      <WidgetContainer title="Obrigações a Vencer" icon={Wallet} subtitle="Próximos 30 dias" depth={1}>
        <p className="text-[11px] text-muted-foreground/60 py-4 text-center">
          Dados indisponíveis
        </p>
      </WidgetContainer>
    );
  }

  const { obrigacoesVencer } = contratos;

  if (obrigacoesVencer.length === 0) {
    return (
      <WidgetContainer title="Obrigações a Vencer" icon={Wallet} subtitle="Próximos 30 dias" depth={1}>
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Wallet className="size-8 text-muted-foreground/45" />
          <p className="text-[11px] text-muted-foreground/60 text-center">
            Nenhuma obrigação a vencer no período
          </p>
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Obrigações a Vencer"
      icon={Wallet}
      subtitle="Próximos 30 dias"
      depth={1}
    >
      <div className="space-y-0.5">
        {obrigacoesVencer.map((ob, i) => (
          <ListItem key={`${ob.descricao}-${i}`} className="items-start">
            <UrgencyDot level={mapUrgencia(ob.urgencia)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[12px] font-medium leading-tight truncate">
                  {ob.descricao}
                </p>
                <TipoBadge tipo={ob.tipo} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground/60">
                  {fmtData(ob.vencimento)}
                </span>
                <span className="text-[10px] font-medium tabular-nums">
                  {fmtMoeda(ob.valor)}
                </span>
              </div>
            </div>
          </ListItem>
        ))}
      </div>
    </WidgetContainer>
  );
}
