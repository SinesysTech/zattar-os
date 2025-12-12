'use client';

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import Link from 'next/link';
import { PieChart as PieIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDespesasPorCategoria } from '../../hooks';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6'];
const DOT_BG_CLASSES = [
  'bg-[#ef4444]',
  'bg-[#f97316]',
  'bg-[#f59e0b]',
  'bg-[#10b981]',
  'bg-[#3b82f6]',
];

const formatarValor = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export function WidgetDespesasCategoria() {
  const { despesasPorCategoria, isLoading, error } = useDespesasPorCategoria();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-52" />
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
          <CardTitle className="text-sm">Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
          <PieIcon className="h-4 w-4" />
          <span className="truncate">Despesas por Categoria</span>
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="w-full shrink-0 sm:w-auto">
          <Link href="/financeiro/dre">DRE</Link>
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-44 sm:h-48 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={despesasPorCategoria || []}
                dataKey="valor"
                nameKey="categoria"
                outerRadius={60}
                innerRadius={0}
              >
                {(despesasPorCategoria || []).map((entry, index) => (
                  <Cell key={entry.categoria + index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatarValor(value)}
                contentStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 text-xs sm:text-sm max-h-48 overflow-y-auto">
          {(despesasPorCategoria || []).map((item, idx) => (
            <div key={item.categoria} className="flex items-center justify-between rounded-md bg-muted/60 p-2 gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className={`h-3 w-3 rounded-full shrink-0 ${DOT_BG_CLASSES[idx % DOT_BG_CLASSES.length]}`}
                />
                <span className="truncate">{item.categoria}</span>
              </div>
              <span className="font-medium whitespace-nowrap">{formatarValor(item.valor)}</span>
            </div>
          ))}
          {!despesasPorCategoria?.length && (
            <p className="text-xs text-muted-foreground">Sem dados disponíveis.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
