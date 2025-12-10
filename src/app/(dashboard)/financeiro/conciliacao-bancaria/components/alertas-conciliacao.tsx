'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ResumoProps {
  totalPendentes: number;
  totalConciliadas: number;
  totalDivergentes: number;
  totalIgnoradas: number;
}

interface Props {
  resumo: ResumoProps | undefined;
  isLoading?: boolean;
  onFiltrarPendentes?: () => void;
  onFiltrarDivergentes?: () => void;
}

const cards = [
  {
    key: 'pendentes',
    title: 'Pendentes',
    icon: Clock,
    tone: 'warning' as const,
    actionLabel: 'Ver Pendentes',
  },
  {
    key: 'conciliadas',
    title: 'Conciliadas',
    icon: CheckCircle2,
    tone: 'success' as const,
  },
  {
    key: 'divergentes',
    title: 'Divergentes',
    icon: AlertTriangle,
    tone: 'danger' as const,
    actionLabel: 'Revisar',
  },
  {
    key: 'ignoradas',
    title: 'Ignoradas',
    icon: XCircle,
    tone: 'neutral' as const,
  },
];

export function AlertasConciliacao({ resumo, isLoading, onFiltrarPendentes, onFiltrarDivergentes }: Props) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value =
          card.key === 'pendentes'
            ? resumo?.totalPendentes ?? 0
            : card.key === 'conciliadas'
              ? resumo?.totalConciliadas ?? 0
              : card.key === 'divergentes'
                ? resumo?.totalDivergentes ?? 0
                : resumo?.totalIgnoradas ?? 0;

        return (
          <Card key={card.key} className="p-4 space-y-2 border">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <p className="text-sm font-medium">{card.title}</p>
                </div>
                <div className="text-3xl font-bold">{value}</div>
                {card.actionLabel && card.key === 'pendentes' && onFiltrarPendentes && (
                  <Button size="sm" variant="outline" onClick={onFiltrarPendentes}>
                    {card.actionLabel}
                  </Button>
                )}
                {card.actionLabel && card.key === 'divergentes' && onFiltrarDivergentes && (
                  <Button size="sm" variant="outline" onClick={onFiltrarDivergentes}>
                    {card.actionLabel}
                  </Button>
                )}
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
