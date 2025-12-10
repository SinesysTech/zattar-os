'use client';

import Link from 'next/link';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useContasPagarReceber } from '@/core/app/_lib/hooks/use-dashboard-financeiro';

const formatarValor = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export function WidgetContasPagarReceber() {
  const { contasPagar, contasReceber, isLoading, error } = useContasPagarReceber();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Contas a Pagar / Receber</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Contas a Pagar / Receber</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/financeiro/contas-pagar">Pagar</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/financeiro/contas-receber">Receber</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-red-200/70 bg-red-50/60 p-3">
          <div className="flex items-center justify-between text-sm font-medium text-red-700">
            <span>Contas a Pagar</span>
            <ArrowDownCircle className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-red-700">
            {formatarValor(contasPagar.valor || 0)}
          </p>
          <p className="text-xs text-red-600/80">{contasPagar.quantidade || 0} pendente(s)</p>
        </div>
        <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/60 p-3">
          <div className="flex items-center justify-between text-sm font-medium text-emerald-700">
            <span>Contas a Receber</span>
            <ArrowUpCircle className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {formatarValor(contasReceber.valor || 0)}
          </p>
          <p className="text-xs text-emerald-600/80">{contasReceber.quantidade || 0} aguardando</p>
        </div>
      </CardContent>
    </Card>
  );
}
