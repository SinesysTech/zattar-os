'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFolhasPagamento } from '@/app/_lib/hooks/use-folhas-pagamento';
import { MESES_LABELS } from '@/backend/types/financeiro/salarios.types';

const formatCurrency = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor ?? 0);

export function WidgetCustoPessoal() {
  const { folhas, isLoading, error, refetch } = useFolhasPagamento({
    limite: 6,
    ordenarPor: 'periodo',
    ordem: 'desc',
  });

  const atual = folhas[0];
  const anterior = folhas[1];
  const variacao =
    atual && anterior
      ? ((Number(atual.valorTotal ?? 0) - Number(anterior.valorTotal ?? 0)) /
          Math.max(Number(anterior.valorTotal ?? 1), 1)) *
        100
      : 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Custo com Pessoal</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {atual && (
          <>
            <div>
              <p className="text-sm text-muted-foreground">
                {MESES_LABELS[atual.mesReferencia]}/{atual.anoReferencia}
              </p>
              <p className="text-2xl font-semibold text-green-700">
                {formatCurrency(atual.valorTotal ?? 0)}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Variação vs mês anterior:{' '}
              <span className={variacao >= 0 ? 'text-green-600' : 'text-red-600'}>
                {variacao.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Últimos meses</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {folhas.slice(0, 6).map((folha) => (
                  <div key={folha.id} className="rounded-md border p-2">
                    <p className="text-xs text-muted-foreground">
                      {MESES_LABELS[folha.mesReferencia].slice(0, 3)}/{folha.anoReferencia}
                    </p>
                    <p className="font-semibold">{formatCurrency(folha.valorTotal ?? 0)}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!isLoading && !error && !atual && (
          <p className="text-sm text-muted-foreground">Nenhuma folha encontrada.</p>
        )}
      </CardContent>
    </Card>
  );
}
