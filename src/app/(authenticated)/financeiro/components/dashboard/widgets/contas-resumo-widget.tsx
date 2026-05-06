'use client';

import Link from 'next/link';
import { ArrowUpFromLine, ArrowDownToLine, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ProgressBarChart } from '@/components/ui/charts/mini-chart';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/typography';

// ============================================================================
// Helpers
// ============================================================================

const formatarMoeda = (valor: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: Math.abs(valor) >= 1_000_000 ? 'compact' : 'standard',
  }).format(valor);

// ============================================================================
// Types
// ============================================================================

interface ContasResumoWidgetProps {
  contasPagar: {
    quantidade: number;
    valor: number;
  };
  contasReceber: {
    quantidade: number;
    valor: number;
  };
  isLoading: boolean;
}

// ============================================================================
// Sub-component
// ============================================================================

function ContaSection({
  title,
  icon: Icon,
  valor,
  quantidade,
  href,
  colorClass,
  iconColorClass,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  valor: number;
  quantidade: number;
  href: string;
  colorClass: string;
  iconColorClass: string;
}) {
  return (
    <div className={cn("stack-tight-plus")}>
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center inline-tight")}>
          <div className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ 'rounded-md p-1.5', colorClass)}>
            <Icon className={cn('h-3.5 w-3.5', iconColorClass)} />
          </div>
          <Text variant="caption" className="font-medium">{title}</Text>
        </div>
        <Button variant="ghost" size="sm" asChild className={cn("h-6 px-2 text-caption")}>
          <Link href={href}>
            Ver <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>
      <div>
        <p className={cn( "text-body-lg font-bold font-heading tabular-nums")}>{formatarMoeda(valor)}</p>
        <Text variant="caption">
          {quantidade} conta{quantidade !== 1 ? 's' : ''} pendente{quantidade !== 1 ? 's' : ''}
        </Text>
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function ContasResumoWidget({ contasPagar, contasReceber, isLoading }: ContasResumoWidgetProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className={cn("pb-2")}>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className={cn("stack-default")}>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = contasPagar.valor + contasReceber.valor;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className={cn("pb-2")}>
        <CardTitle className={cn( "text-body-sm font-medium")}>
          Contas a Pagar / Receber
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("flex-1 stack-default")}>
        <ContaSection
          title="A Pagar"
          icon={ArrowUpFromLine}
          valor={contasPagar.valor}
          quantidade={contasPagar.quantidade}
          href="/app/financeiro/contas-pagar"
          colorClass="bg-warning/10"
          iconColorClass="text-warning"
        />

        {/* Barra de proporção */}
        {total > 0 && (
          <ProgressBarChart
            data={[
              { name: 'A Pagar', value: contasPagar.valor, color: 'var(--warning)' },
              { name: 'A Receber', value: contasReceber.valor, color: 'var(--info)' },
            ]}
            height={6}
            showLabels
          />
        )}

        <ContaSection
          title="A Receber"
          icon={ArrowDownToLine}
          valor={contasReceber.valor}
          quantidade={contasReceber.quantidade}
          href="/app/financeiro/contas-receber"
          colorClass="bg-info/10"
          iconColorClass="text-info"
        />
      </CardContent>
    </Card>
  );
}
