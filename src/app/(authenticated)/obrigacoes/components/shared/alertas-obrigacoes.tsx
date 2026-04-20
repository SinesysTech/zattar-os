'use client';

import * as React from 'react';
import {
  AlertCircle,
  Clock,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { AlertasObrigacoesType } from '../../domain';

interface AlertasObrigacoesProps {
  alertas?: AlertasObrigacoesType | null;
  isLoading?: boolean;
  onFiltrarVencidas?: () => void;
  onFiltrarHoje?: () => void;
  onFiltrarInconsistentes?: () => void;
}

const CURRENCY = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

type Variant = 'destructive' | 'warning' | 'info';

interface AlertaItemProps {
  variant: Variant;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}

const ICON_TONE: Record<Variant, string> = {
  destructive: 'bg-destructive/10 text-destructive/70',
  warning: 'bg-warning/10 text-warning/70',
  info: 'bg-info/10 text-info/70',
};

const BORDER_TONE: Record<Variant, string> = {
  destructive: 'border-destructive/15',
  warning: 'border-warning/15',
  info: 'border-info/15',
};

function AlertaSkeleton() {
  return (
    <GlassPanel depth={1} className="px-4 py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-2.5 w-56" />
        </div>
        <Skeleton className="h-7 w-14" />
      </div>
    </GlassPanel>
  );
}

function AlertaItem({
  variant,
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: AlertaItemProps) {
  return (
    <GlassPanel depth={1} className={cn('px-4 py-3', BORDER_TONE[variant])}>
      <div className="flex items-center gap-3">
        <IconContainer size="md" className={cn(ICON_TONE[variant], 'shrink-0')}>
          <Icon className="size-4" />
        </IconContainer>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground/85 truncate">{title}</p>
          <p className="text-[11px] text-muted-foreground/60 truncate">{description}</p>
        </div>
        {onAction && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAction}
            className="h-7 px-2.5 text-[11px] font-medium shrink-0"
          >
            {actionLabel}
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>
    </GlassPanel>
  );
}

export function AlertasObrigacoes({
  alertas,
  isLoading = false,
  onFiltrarVencidas,
  onFiltrarHoje,
  onFiltrarInconsistentes,
}: AlertasObrigacoesProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <AlertaSkeleton />
      </div>
    );
  }

  if (!alertas) return null;

  const { vencidas, vencendoHoje, inconsistentes } = alertas;
  const hasAlerts =
    vencidas.quantidade > 0 ||
    vencendoHoje.quantidade > 0 ||
    inconsistentes.quantidade > 0;

  if (!hasAlerts) return null;

  return (
    <div className="space-y-2">
      {vencidas.quantidade > 0 && (
        <AlertaItem
          variant="destructive"
          icon={AlertCircle}
          title={`${vencidas.quantidade} obrigação${vencidas.quantidade > 1 ? 'ões' : ''} vencida${vencidas.quantidade > 1 ? 's' : ''}`}
          description={`Total vencido: ${CURRENCY.format(vencidas.valor)}`}
          actionLabel="Ver"
          onAction={onFiltrarVencidas}
        />
      )}

      {vencendoHoje.quantidade > 0 && (
        <AlertaItem
          variant="warning"
          icon={Clock}
          title={`${vencendoHoje.quantidade} obrigação${vencendoHoje.quantidade > 1 ? 'ões' : ''} vence${vencendoHoje.quantidade > 1 ? 'm' : ''} hoje`}
          description={`Total: ${CURRENCY.format(vencendoHoje.valor)}`}
          actionLabel="Ver"
          onAction={onFiltrarHoje}
        />
      )}

      {inconsistentes.quantidade > 0 && (
        <AlertaItem
          variant="info"
          icon={RefreshCw}
          title={`${inconsistentes.quantidade} obrigação${inconsistentes.quantidade > 1 ? 'ões' : ''} com inconsistência de sincronização`}
          description="Parcelas sem lançamento financeiro correspondente ou com valores divergentes"
          actionLabel="Ver"
          onAction={onFiltrarInconsistentes}
        />
      )}
    </div>
  );
}
