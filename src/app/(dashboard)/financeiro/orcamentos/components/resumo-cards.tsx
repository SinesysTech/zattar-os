'use client';

/**
 * Cards de resumo para a página de Orçamentos
 */

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  CheckCircle2,
  PlayCircle,
  Archive,
} from 'lucide-react';

// ============================================================================
// Tipos
// ============================================================================

interface ResumoItem {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
  corFundo: string;
  corIcone: string;
}

interface ResumoCardsProps {
  totais: {
    rascunho: number;
    aprovado: number;
    emExecucao: number;
    encerrado: number;
  };
  isLoading: boolean;
  onFiltrarRascunho?: () => void;
  onFiltrarAprovado?: () => void;
  onFiltrarEmExecucao?: () => void;
  onFiltrarEncerrado?: () => void;
}

// ============================================================================
// Componente
// ============================================================================

export function ResumoCards({
  totais,
  isLoading,
  onFiltrarRascunho,
  onFiltrarAprovado,
  onFiltrarEmExecucao,
  onFiltrarEncerrado,
}: ResumoCardsProps) {
  const items: (ResumoItem & { onClick?: () => void })[] = [
    {
      titulo: 'Em Rascunho',
      valor: totais.rascunho,
      icone: <FileText className="h-5 w-5" />,
      corFundo: 'bg-slate-100 dark:bg-slate-800',
      corIcone: 'text-slate-600 dark:text-slate-400',
      onClick: onFiltrarRascunho,
    },
    {
      titulo: 'Aprovados',
      valor: totais.aprovado,
      icone: <CheckCircle2 className="h-5 w-5" />,
      corFundo: 'bg-blue-100 dark:bg-blue-950',
      corIcone: 'text-blue-600 dark:text-blue-400',
      onClick: onFiltrarAprovado,
    },
    {
      titulo: 'Em Execução',
      valor: totais.emExecucao,
      icone: <PlayCircle className="h-5 w-5" />,
      corFundo: 'bg-green-100 dark:bg-green-950',
      corIcone: 'text-green-600 dark:text-green-400',
      onClick: onFiltrarEmExecucao,
    },
    {
      titulo: 'Encerrados',
      valor: totais.encerrado,
      icone: <Archive className="h-5 w-5" />,
      corFundo: 'bg-amber-100 dark:bg-amber-950',
      corIcone: 'text-amber-600 dark:text-amber-400',
      onClick: onFiltrarEncerrado,
    },
  ];

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
      {items.map((item) => (
        <Card
          key={item.titulo}
          className={item.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : undefined}
          onClick={item.onClick}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.corFundo}`}>
                <span className={item.corIcone}>{item.icone}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.titulo}</p>
                <p className="text-2xl font-bold">{item.valor}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
