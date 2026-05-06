'use client';

import { AlertTriangle, Clock, Banknote, Scale } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ResumoObrigacoesFinanceiro } from '@/app/(authenticated)/financeiro/actions/types';
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

interface ObrigacoesWidgetProps {
  resumo: ResumoObrigacoesFinanceiro;
  isLoading: boolean;
}

// ============================================================================
// Mini stat item
// ============================================================================

function ObrigacaoItem({
  label,
  valor,
  quantidade,
  icon: Icon,
  colorClass,
}: {
  label: string;
  valor: number;
  quantidade: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}) {
  return (
    <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "flex items-start inline-medium rounded-lg border p-3")}>
      <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ 'rounded-md p-2 shrink-0', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <Text variant="caption">{label}</Text>
        <p className={cn( "text-body-lg font-bold font-heading tabular-nums")}>{formatarMoeda(valor)}</p>
        <Text variant="caption">
          {quantidade} parcela{quantidade !== 1 ? 's' : ''}
        </Text>
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function ObrigacoesWidget({ resumo, isLoading }: ObrigacoesWidgetProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className={cn("pb-2")}>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className={cn("flex flex-col stack-medium")}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn(/* design-system-escape: p-3 → usar <Inset> */ "flex inline-medium rounded-lg border p-3")}>
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className={cn("flex flex-col stack-snug flex-1")}>
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = resumo.totalVencidas > 0 || resumo.totalPendentes > 0 || resumo.totalRepassesPendentes > 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className={cn("pb-2")}>
        <CardTitle className={cn( "flex items-center inline-tight text-body-sm font-medium")}>
          <Scale className="h-4 w-4 text-muted-foreground" />
          Obrigações e Prazos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {!hasData ? (
          <div className="flex items-center justify-center h-full min-h-32">
            <div className={cn("flex flex-col text-center stack-tight")}>
              <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "rounded-full bg-muted p-3 mx-auto w-fit")}>
                <Scale className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className={cn("text-body-sm text-muted-foreground")}>Sem obrigações pendentes</p>
            </div>
          </div>
        ) : (
          <div className={cn("flex flex-col stack-medium")}>
            <ObrigacaoItem
              label="Vencidas"
              valor={resumo.valorTotalVencido}
              quantidade={resumo.totalVencidas}
              icon={AlertTriangle}
              colorClass="bg-destructive/10 text-destructive"
            />
            <ObrigacaoItem
              label="Pendentes"
              valor={resumo.valorTotalPendente}
              quantidade={resumo.totalPendentes}
              icon={Clock}
              colorClass="bg-warning/10 text-warning"
            />
            <ObrigacaoItem
              label="Repasses Pendentes"
              valor={resumo.valorRepassesPendentes}
              quantidade={resumo.totalRepassesPendentes}
              icon={Banknote}
              colorClass="bg-info/10 text-info"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
