'use client';

import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { cn } from '@/lib/utils';
import type { AnaliseOrcamentariaUI } from '@/app/(authenticated)/financeiro/actions/types';
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

interface OrcamentoRealizadoWidgetProps {
  data: AnaliseOrcamentariaUI | null;
  isLoading: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function OrcamentoRealizadoWidget({ data, isLoading }: OrcamentoRealizadoWidgetProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className={cn(/* design-system-escape: pb-2 padding direcional sem Inset equiv. */ "pb-2")}>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent>
          <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sem orçamento ativo
  if (!data || !data.resumo) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className={cn(/* design-system-escape: pb-2 padding direcional sem Inset equiv. */ "pb-2")}>
          <CardTitle className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "flex items-center gap-2 text-sm font-medium")}>
            <Target className="h-4 w-4 text-muted-foreground" />
            Orçamento vs Realizado
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "text-center space-y-2")}>
            <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "rounded-full bg-muted p-3 mx-auto w-fit")}>
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground")}>Nenhum orçamento em execução</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { resumo, itens } = data;
  const percentualExec = Math.min(resumo.percentualExecutado, 100);
  const isOverBudget = resumo.totalRealizado > resumo.totalPrevisto;

  // Top 5 itens com maior desvio (ordenados por valor absoluto de variação)
  const topItens = [...(itens || [])]
    .sort((a, b) => Math.abs(b.valorRealizado - b.valorPrevisto) - Math.abs(a.valorRealizado - a.valorPrevisto))
    .slice(0, 5);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className={cn(/* design-system-escape: pb-2 padding direcional sem Inset equiv. */ "pb-2")}>
        <CardTitle className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "flex items-center gap-2 text-sm font-medium")}>
          <Target className="h-4 w-4 text-muted-foreground" />
          Orçamento vs Realizado
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "flex-1 space-y-4")}>
        {/* Resumo geral */}
        <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
          <div className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "flex items-center justify-between text-sm")}>
            <span className="text-muted-foreground">Execução Geral</span>
            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
              <SemanticBadge category="status" value={Math.round(resumo.percentualExecutado)} variantOverride={isOverBudget ? 'destructive' : 'secondary'} className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs")}>
                {Math.round(resumo.percentualExecutado)}%
              </SemanticBadge>
            </div>
          </div>
          <Progress value={percentualExec} className="h-2.5" />
          <Text variant="caption" className="flex justify-between">
            <span>Realizado: {formatarMoeda(resumo.totalRealizado)}</span>
            <span>Previsto: {formatarMoeda(resumo.totalPrevisto)}</span>
          </Text>
        </div>

        {/* Status badges */}
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex gap-2 flex-wrap")}>
          <SemanticBadge category="status" value="acima" variantOverride="outline" className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; gap-1 gap sem token DS */ "text-xs gap-1")}>
            <TrendingUp className="h-3 w-3 text-destructive" />
            {resumo.itensAcimaMeta} acima
          </SemanticBadge>
          <SemanticBadge category="status" value="alvo" variantOverride="outline" className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; gap-1 gap sem token DS */ "text-xs gap-1")}>
            <Minus className="h-3 w-3 text-success" />
            {resumo.itensDentroMeta} no alvo
          </SemanticBadge>
          <SemanticBadge category="status" value="abaixo" variantOverride="outline" className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; gap-1 gap sem token DS */ "text-xs gap-1")}>
            <TrendingDown className="h-3 w-3 text-info" />
            {resumo.itensAbaixoMeta} abaixo
          </SemanticBadge>
        </div>

        {/* Top itens com maior desvio */}
        {topItens.length > 0 && (
          <div className={cn(/* design-system-escape: space-y-2.5 sem token DS */ "space-y-2.5")}>
            <Text variant="caption" className="font-medium">Maiores Desvios</Text>
            {topItens.map((item) => {
              const percentExec = item.valorPrevisto > 0
                ? Math.min((item.valorRealizado / item.valorPrevisto) * 100, 150)
                : 0;
              const isOver = item.valorRealizado > item.valorPrevisto;
              const descricao = typeof item.contaContabil === 'object'
                ? item.contaContabil.nome
                : item.descricao || String(item.contaContabil);

              return (
                <div key={item.id} className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1")}>
                  <Text variant="caption" className="flex items-center justify-between">
                    <span className="truncate max-w-[60%] text-muted-foreground">{descricao}</span>
                    <span className={cn(
                      /* design-system-escape: font-medium → className de <Text>/<Heading> */ 'font-medium tabular-nums',
                      isOver ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {Math.round(percentExec)}%
                    </span>
                  </Text>
                  <Progress
                    value={Math.min(percentExec, 100)}
                    className={cn('h-1.5', isOver && '[&>div]:bg-destructive')}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
