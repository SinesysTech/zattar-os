'use client';

/**
 * Componente de Alertas de Vencimento
 * Exibe resumo de contas vencidas e a vencer
 */

import { AlertCircle, AlertTriangle, Clock, CalendarClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ResumoVencimentos } from '@/backend/types/financeiro/contas-pagar.types';

interface AlertasVencimentoProps {
  resumo: ResumoVencimentos | null;
  isLoading?: boolean;
  onFiltrarVencidas?: () => void;
  onFiltrarHoje?: () => void;
  onFiltrar7Dias?: () => void;
  onFiltrar30Dias?: () => void;
}

/**
 * Formata valor em reais
 */
const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

/**
 * Card individual de alerta
 */
function AlertaCard({
  titulo,
  quantidade,
  valorTotal,
  variant,
  icon: Icon,
  onClick,
}: {
  titulo: string;
  quantidade: number;
  valorTotal: number;
  variant: 'danger' | 'warning' | 'info' | 'muted';
  icon: React.ElementType;
  onClick?: () => void;
}) {
  const variantStyles = {
    danger: {
      bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      text: 'text-red-900 dark:text-red-100',
      value: 'text-red-700 dark:text-red-300',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
      icon: 'text-amber-600 dark:text-amber-400',
      text: 'text-amber-900 dark:text-amber-100',
      value: 'text-amber-700 dark:text-amber-300',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-900 dark:text-blue-100',
      value: 'text-blue-700 dark:text-blue-300',
    },
    muted: {
      bg: 'bg-muted/50 border-border',
      icon: 'text-muted-foreground',
      text: 'text-foreground',
      value: 'text-muted-foreground',
    },
  };

  const styles = variantStyles[variant];

  if (quantidade === 0) {
    return null;
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        styles.bg
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-full p-2', styles.bg)}>
            <Icon className={cn('h-5 w-5', styles.icon)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', styles.text)}>{titulo}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {quantidade} {quantidade === 1 ? 'conta' : 'contas'}
              </Badge>
              <span className={cn('text-sm font-semibold', styles.value)}>
                {formatarValor(valorTotal)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AlertasVencimento({
  resumo,
  isLoading = false,
  onFiltrarVencidas,
  onFiltrarHoje,
  onFiltrar7Dias,
  onFiltrar30Dias,
}: AlertasVencimentoProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!resumo) {
    return null;
  }

  const { vencidas, vencendoHoje, vencendoEm7Dias, vencendoEm30Dias } = resumo;

  // Não mostrar se não houver alertas
  const temAlertas =
    vencidas.quantidade > 0 ||
    vencendoHoje.quantidade > 0 ||
    vencendoEm7Dias.quantidade > 0 ||
    vencendoEm30Dias.quantidade > 0;

  if (!temAlertas) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <AlertaCard
        titulo="Contas Vencidas"
        quantidade={vencidas.quantidade}
        valorTotal={vencidas.valorTotal}
        variant="danger"
        icon={AlertCircle}
        onClick={onFiltrarVencidas}
      />
      <AlertaCard
        titulo="Vencem Hoje"
        quantidade={vencendoHoje.quantidade}
        valorTotal={vencendoHoje.valorTotal}
        variant="warning"
        icon={AlertTriangle}
        onClick={onFiltrarHoje}
      />
      <AlertaCard
        titulo="Próximos 7 Dias"
        quantidade={vencendoEm7Dias.quantidade}
        valorTotal={vencendoEm7Dias.valorTotal}
        variant="info"
        icon={Clock}
        onClick={onFiltrar7Dias}
      />
      <AlertaCard
        titulo="Próximos 30 Dias"
        quantidade={vencendoEm30Dias.quantidade}
        valorTotal={vencendoEm30Dias.valorTotal}
        variant="muted"
        icon={CalendarClock}
        onClick={onFiltrar30Dias}
      />
    </div>
  );
}
