'use client';

import { Card, CardContent } from '@/components/ui/card';
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
    corFundo: 'bg-amber-100 dark:bg-amber-950/50',
    corIcone: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'conciliadas',
    title: 'Conciliadas',
    icon: <CheckCircle2 className="h-5 w-5" />,
    corFundo: 'bg-emerald-100 dark:bg-emerald-950/50',
    corIcone: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'divergentes',
    title: 'Divergentes',
    icon: <AlertTriangle className="h-5 w-5" />,
    corFundo: 'bg-red-100 dark:bg-red-950/50',
    corIcone: 'text-red-600 dark:text-red-400',
  },
  {
    key: 'ignoradas',
    title: 'Ignoradas',
    icon: <XCircle className="h-5 w-5" />,
    corFundo: 'bg-slate-100 dark:bg-slate-800/50',
    corIcone: 'text-slate-600 dark:text-slate-400',
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1.5">
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cardsConfig.map((card) => {
        const onClick = getOnClick(card.key);
        const valor = getValor(card.key);

        return (
          <Card
            key={card.key}
            className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : undefined}
            onClick={onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.corFundo}`}>
                  <span className={card.corIcone}>{card.icon}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold">{valor}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
