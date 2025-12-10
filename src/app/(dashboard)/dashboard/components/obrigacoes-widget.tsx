'use client';

/**
 * Widget de Obrigações Financeiras para o Dashboard
 * Exibe resumo de obrigações vencidas, vencendo hoje e próximas
 */

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResumoObrigacoes } from '@/core/app/_lib/hooks/use-obrigacoes';

// ============================================================================
// Helpers
// ============================================================================

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: valor >= 100000 ? 'compact' : 'standard',
  }).format(valor);
};

// ============================================================================
// Sub-components
// ============================================================================

function MetricCard({
  label,
  quantidade,
  valor,
  variant = 'default',
}: {
  label: string;
  quantidade: number;
  valor: number;
  variant?: 'default' | 'warning' | 'danger' | 'success';
}) {
  const variantStyles = {
    default: 'border-border',
    warning: 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20',
    danger: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20',
    success: 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20',
  };

  const textStyles = {
    default: 'text-foreground',
    warning: 'text-amber-700 dark:text-amber-300',
    danger: 'text-red-700 dark:text-red-300',
    success: 'text-green-700 dark:text-green-300',
  };

  return (
    <div className={cn('rounded-lg border p-3', variantStyles[variant])}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-bold', textStyles[variant])}>
        {quantidade}
      </p>
      <p className="text-xs text-muted-foreground">{formatarValor(valor)}</p>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ObrigacoesWidget() {
  const { resumo, alertas, isLoading, error } = useResumoObrigacoes({
    incluirAlertas: true,
  });

  if (isLoading) {
    return <WidgetSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4" />
            Obrigações Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  if (!resumo) {
    return null;
  }

  // Calcular totais
  const totalRecebimentos = resumo.porTipo
    .filter((t) => t.tipo === 'acordo_recebimento' || t.tipo === 'conta_receber')
    .reduce((acc, t) => acc + t.valorTotalPendente, 0);

  const totalPagamentos = resumo.porTipo
    .filter((t) => t.tipo === 'acordo_pagamento' || t.tipo === 'conta_pagar')
    .reduce((acc, t) => acc + t.valorTotalPendente, 0);

  const saldoPrevisto = totalRecebimentos - totalPagamentos;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4" />
            Obrigações Financeiras
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/financeiro/obrigacoes">
              <span className="text-xs">Ver Todas</span>
              <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alertas rápidos */}
        {alertas && (alertas.vencidas.quantidade > 0 || alertas.vencendoHoje.quantidade > 0) && (
          <div className="space-y-2">
            {alertas.vencidas.quantidade > 0 && (
              <Link
                href="/financeiro/obrigacoes?apenasVencidas=true"
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 p-2 text-sm hover:bg-red-100/50 transition-colors"
              >
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-red-700 dark:text-red-300 font-medium">
                  {alertas.vencidas.quantidade} vencida{alertas.vencidas.quantidade > 1 ? 's' : ''}
                </span>
                <span className="text-red-600/80 ml-auto text-xs">
                  {formatarValor(alertas.vencidas.valor)}
                </span>
              </Link>
            )}
            {alertas.vencendoHoje.quantidade > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 p-2 text-sm">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-amber-700 dark:text-amber-300 font-medium">
                  {alertas.vencendoHoje.quantidade} vence{alertas.vencendoHoje.quantidade > 1 ? 'm' : ''} hoje
                </span>
                <span className="text-amber-600/80 ml-auto text-xs">
                  {formatarValor(alertas.vencendoHoje.valor)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2">
          <MetricCard
            label="Pendentes"
            quantidade={resumo.pendentes.quantidade}
            valor={resumo.pendentes.valor}
            variant="warning"
          />
          <MetricCard
            label="Vencidas"
            quantidade={resumo.vencidas.quantidade}
            valor={resumo.vencidas.valor}
            variant="danger"
          />
          <MetricCard
            label="Efetivadas"
            quantidade={resumo.efetivadas.quantidade}
            valor={resumo.efetivadas.valor}
            variant="success"
          />
        </div>

        {/* Saldo previsto */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            {saldoPrevisto >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm text-muted-foreground">Saldo Previsto</span>
          </div>
          <span
            className={cn(
              'font-bold',
              saldoPrevisto >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {formatarValor(saldoPrevisto)}
          </span>
        </div>

        {/* Próximos 7 dias */}
        {resumo.vencendoEm7Dias.quantidade > 0 && (
          <div className="text-sm text-muted-foreground">
            <Clock className="h-3 w-3 inline mr-1" />
            Próximos 7 dias: {resumo.vencendoEm7Dias.quantidade} obrigação
            {resumo.vencendoEm7Dias.quantidade > 1 ? 'ões' : ''} (
            {formatarValor(resumo.vencendoEm7Dias.valor)})
          </div>
        )}
      </CardContent>
    </Card>
  );
}
