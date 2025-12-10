'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFluxoCaixa } from '@/app/_lib/hooks/use-dashboard-financeiro';

const formatarValor = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export function WidgetFluxoCaixa() {
  const { data, isLoading, error } = useFluxoCaixa(6);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="h-48">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4" />
          <span className="truncate">Fluxo de Caixa (6 meses)</span>
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
          <Link href="/financeiro/fluxo-caixa">Ver mais</Link>
        </Button>
      </CardHeader>
      <CardContent className="h-56 sm:h-64 overflow-x-auto">
        <ResponsiveContainer width="100%" height="100%" minWidth={300}>
          <BarChart data={data || []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 10 }}
              className="text-xs sm:text-sm"
            />
            <YAxis
              tickFormatter={(value) => formatarValor(value as number)}
              tick={{ fontSize: 10 }}
              className="text-xs sm:text-sm"
              width={60}
            />
            <Tooltip
              formatter={(value: number) => formatarValor(value)}
              contentStyle={{ fontSize: '12px' }}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
