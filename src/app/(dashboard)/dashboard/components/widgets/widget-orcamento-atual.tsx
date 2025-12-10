'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrcamentoAtual } from '@/core/app/_lib/hooks/use-dashboard-financeiro';

const formatarValor = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export function WidgetOrcamentoAtual() {
  const { orcamentoAtual, isLoading, error } = useOrcamentoAtual();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Orçamento em Execução</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  if (!orcamentoAtual) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Orçamento em Execução</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum orçamento ativo.</p>
        </CardContent>
      </Card>
    );
  }

  const statusVariant: 'destructive' | 'secondary' | 'default' =
    orcamentoAtual.percentualRealizacao > 100
      ? 'destructive'
      : orcamentoAtual.percentualRealizacao > 90
        ? 'secondary'
        : 'default';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Orçamento em Execução</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/financeiro/orcamentos/${orcamentoAtual.id || ''}`}>Detalhes</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{orcamentoAtual.nome}</p>
            <p className="text-xs text-muted-foreground">
              Realizado {orcamentoAtual.percentualRealizacao}% | Status {orcamentoAtual.status}
            </p>
          </div>
          <Badge variant={statusVariant}>{orcamentoAtual.status}</Badge>
        </div>
        <Progress value={orcamentoAtual.percentualRealizacao} />
        {orcamentoAtual.valorOrcado != null && orcamentoAtual.valorRealizado != null && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Orçado: {formatarValor(orcamentoAtual.valorOrcado)}</span>
            <span>Realizado: {formatarValor(orcamentoAtual.valorRealizado)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
