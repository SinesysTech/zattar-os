'use client';

/**
 * Cards de resumo para a página de Orçamentos
 */

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  CheckCircle2,
  PlayCircle,
  Archive,
} from 'lucide-react';
import { Text } from '@/components/ui/typography';

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
      corFundo: 'bg-muted',
      corIcone: 'text-muted-foreground',
      onClick: onFiltrarRascunho,
    },
    {
      titulo: 'Aprovados',
      valor: totais.aprovado,
      icone: <CheckCircle2 className="h-5 w-5" />,
      corFundo: 'bg-info/10',
      corIcone: 'text-info',
      onClick: onFiltrarAprovado,
    },
    {
      titulo: 'Em Execução',
      valor: totais.emExecucao,
      icone: <PlayCircle className="h-5 w-5" />,
      corFundo: 'bg-success/10',
      corIcone: 'text-success',
      onClick: onFiltrarEmExecucao,
    },
    {
      titulo: 'Encerrados',
      valor: totais.encerrado,
      icone: <Archive className="h-5 w-5" />,
      corFundo: 'bg-warning/10',
      corIcone: 'text-warning',
      onClick: onFiltrarEncerrado,
    },
  ];

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-4 inline-default")}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className={cn("inset-card-compact")}>
              <div className={cn("flex items-center inline-medium")}>
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className={cn("stack-snug")}>
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
    <div className={cn("grid grid-cols-2 md:grid-cols-4 inline-default")}>
      {items.map((item) => (
        <Card
          key={item.titulo}
          className={item.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : undefined}
          onClick={item.onClick}
        >
          <CardContent className={cn("inset-card-compact")}>
            <div className={cn("flex items-center inline-medium")}>
              <div className={`p-2 rounded-lg ${item.corFundo}`}>
                <span className={item.corIcone}>{item.icone}</span>
              </div>
              <div>
                <p className={cn("text-body-sm text-muted-foreground")}>{item.titulo}</p>
                <Text variant="kpi-value">{item.valor}</Text>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
