'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFolhaDoPeriodo } from '@/app/_lib/hooks/use-folhas-pagamento';
import { MESES_LABELS, STATUS_FOLHA_LABELS, STATUS_FOLHA_CORES } from '@/backend/types/financeiro/salarios.types';

const formatCurrency = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor ?? 0);

export function WidgetFolhaPagamento() {
  const router = useRouter();
  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const ano = hoje.getFullYear();

  const { folha, isLoading, error, refetch } = useFolhaDoPeriodo(ano, mes);

  const cores = folha ? STATUS_FOLHA_CORES[folha.status] : undefined;

  const handleIrParaFolha = () => {
    if (folha) {
      router.push(`/rh/folhas-pagamento/${folha.id}`);
    } else {
      router.push('/rh/folhas-pagamento');
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Folha do Mês</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Período: {MESES_LABELS[mes]}/{ano}
        </p>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!isLoading && !folha && !error && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Nenhuma folha gerada para este período.
            </p>
            <Button size="sm" onClick={handleIrParaFolha}>
              Gerar Folha
            </Button>
          </div>
        )}

        {folha && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge
                className={`${cores?.bg} ${cores?.text} border ${cores?.border}`}
                variant="outline"
              >
                {STATUS_FOLHA_LABELS[folha.status]}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Funcionários: {folha.totalFuncionarios}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-xl font-semibold text-green-700">
                {formatCurrency(folha.valorTotal ?? 0)}
              </p>
            </div>
            <div className="flex gap-2">
              {folha.status === 'rascunho' && (
                <Button size="sm" onClick={handleIrParaFolha}>
                  Aprovar Folha
                </Button>
              )}
              {folha.status === 'aprovada' && (
                <Button size="sm" onClick={handleIrParaFolha}>
                  Pagar Folha
                </Button>
              )}
              {folha.status === 'paga' && (
                <Button size="sm" variant="outline" onClick={handleIrParaFolha}>
                  Ver Detalhes
                </Button>
              )}
              {folha.status === 'cancelada' && (
                <Button size="sm" variant="outline" onClick={handleIrParaFolha}>
                  Ver Detalhes
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
