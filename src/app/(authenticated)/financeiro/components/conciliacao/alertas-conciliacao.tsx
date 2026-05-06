'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Text } from '@/components/ui/typography';

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

interface CardConfig {
  key: 'pendentes' | 'conciliadas' | 'divergentes' | 'ignoradas';
  title: string;
  icon: React.ReactNode;
  corFundo: string;
  corIcone: string;
}

const cardsConfig: CardConfig[] = [
  {
    key: 'pendentes',
    title: 'Pendentes',
    icon: <Clock className="h-5 w-5" />,
    corFundo: 'bg-warning/10',
    corIcone: 'text-warning',
  },
  {
    key: 'conciliadas',
    title: 'Conciliadas',
    icon: <CheckCircle2 className="h-5 w-5" />,
    corFundo: 'bg-success/10',
    corIcone: 'text-success',
  },
  {
    key: 'divergentes',
    title: 'Divergentes',
    icon: <AlertTriangle className="h-5 w-5" />,
    corFundo: 'bg-destructive/10',
    corIcone: 'text-destructive',
  },
  {
    key: 'ignoradas',
    title: 'Ignoradas',
    icon: <XCircle className="h-5 w-5" />,
    corFundo: 'bg-muted',
    corIcone: 'text-muted-foreground',
  },
];

export function AlertasConciliacao({ resumo, isLoading, onFiltrarPendentes, onFiltrarDivergentes }: Props) {
  const getValor = (key: CardConfig['key']): number => {
    if (!resumo) return 0;
    switch (key) {
      case 'pendentes': return resumo.totalPendentes;
      case 'conciliadas': return resumo.totalConciliadas;
      case 'divergentes': return resumo.totalDivergentes;
      case 'ignoradas': return resumo.totalIgnoradas;
    }
  };

  const getOnClick = (key: CardConfig['key']) => {
    if (key === 'pendentes') return onFiltrarPendentes;
    if (key === 'divergentes') return onFiltrarDivergentes;
    return undefined;
  };

  if (isLoading) {
    return (
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-2 md:grid-cols-4 gap-4")}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "p-4")}>
              <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3")}>
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-2 md:grid-cols-4 gap-4")}>
      {cardsConfig.map((card) => {
        const onClick = getOnClick(card.key);
        const valor = getValor(card.key);

        return (
          <Card
            key={card.key}
            className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : undefined}
            onClick={onClick}
          >
            <CardContent className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "p-4")}>
              <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3")}>
                <div className={`p-2 rounded-lg ${card.corFundo}`}>
                  <span className={card.corIcone}>{card.icon}</span>
                </div>
                <div>
                  <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground")}>{card.title}</p>
                  <Text variant="kpi-value">{valor}</Text>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
