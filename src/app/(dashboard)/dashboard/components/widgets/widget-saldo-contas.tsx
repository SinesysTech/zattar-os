'use client';

import Link from 'next/link';
import { Wallet, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSaldoContas } from '@/app/_lib/hooks/use-dashboard-financeiro';

const formatarValor = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export function WidgetSaldoContas() {
  const { saldoAtual, isLoading, error } = useSaldoContas();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Saldo das Contas</CardTitle>
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
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Wallet className="h-4 w-4" />
          Saldo das Contas
        </CardTitle>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/financeiro/contas-bancarias">
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-3xl font-bold">{formatarValor(saldoAtual)}</p>
        <p className="text-xs text-muted-foreground">Total em todas as contas bancárias</p>
      </CardContent>
    </Card>
  );
}
