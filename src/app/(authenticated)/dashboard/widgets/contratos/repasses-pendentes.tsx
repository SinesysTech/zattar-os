'use client';

/**
 * Widget: Repasses Pendentes — Lista com divisão cliente/escritório
 * ============================================================================
 * Conectado via useDashboard() → data.contratos.repassesPendentes
 * Mostra cada repasse com nome do cliente, número do processo, badge de status
 * e divisão de valores.
 *
 * Uso:
 *   import { WidgetRepassesPendentes } from '@/app/(authenticated)/dashboard/widgets/contratos/repasses-pendentes'
 * ============================================================================
 */

import { ArrowLeftRight } from 'lucide-react';
import {
  WidgetContainer,
  ListItem,
  fmtMoeda,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario, isDashboardAdmin } from '../../hooks';

const STATUS_BADGE_COLORS: Record<string, string> = {
  pendente: 'bg-warning/10 text-warning/80',
  parcial: 'bg-primary/10 text-primary/80',
  atrasado: 'bg-destructive/10 text-destructive/80',
  concluido: 'bg-success/10 text-success/80',
};

function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_BADGE_COLORS[status.toLowerCase()] ?? 'bg-border/10 text-muted-foreground/70';
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

export function WidgetRepassesPendentes() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (!data) {
    return (
      <WidgetContainer title="Repasses Pendentes" icon={ArrowLeftRight} subtitle="Divisão cliente/escritório" depth={1}>
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
      <WidgetContainer title="Repasses Pendentes" icon={ArrowLeftRight} subtitle="Divisão cliente/escritório" depth={1}>
        <p className="text-[11px] text-muted-foreground/60 py-4 text-center">
          Dados indisponíveis
        </p>
      </WidgetContainer>
    );
  }

  const { repassesPendentes } = contratos;

  if (repassesPendentes.length === 0) {
    return (
      <WidgetContainer title="Repasses Pendentes" icon={ArrowLeftRight} subtitle="Divisão cliente/escritório" depth={1}>
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <ArrowLeftRight className="size-8 text-muted-foreground/45" />
          <p className="text-[11px] text-muted-foreground/60 text-center">
            Nenhum repasse pendente
          </p>
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Repasses Pendentes"
      icon={ArrowLeftRight}
      subtitle="Divisão cliente/escritório"
      depth={1}
    >
      <div className="space-y-0.5">
        {repassesPendentes.map((r, i) => {
          const valorCliente = r.total * (r.pctCliente / 100);
          const valorEscritorio = r.total - valorCliente;

          return (
            <ListItem key={`${r.processo}-${i}`} className="items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] font-medium leading-tight truncate">
                    {r.cliente}
                  </p>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-[10px] text-muted-foreground/60 font-mono break-all leading-relaxed mt-0.5">
                  {r.processo}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground/50">Cliente ({r.pctCliente}%):</span>
                    <span className="text-[10px] font-medium tabular-nums">
                      {fmtMoeda(valorCliente)}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-border/15" aria-hidden="true" />
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground/50">Escritório:</span>
                    <span className="text-[10px] font-medium tabular-nums">
                      {fmtMoeda(valorEscritorio)}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold tabular-nums shrink-0">
                {fmtMoeda(r.total)}
              </span>
            </ListItem>
          );
        })}
      </div>
    </WidgetContainer>
  );
}
