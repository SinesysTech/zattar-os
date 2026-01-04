'use client';

import * as React from 'react';
import { Wallet, AlertTriangle, ArrowDown, ArrowUp, Clock, Banknote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MetricCard,
  WidgetFluxoCaixa,
  WidgetDespesasCategoria,
  useSaldoContas,
  useContasPagarReceber,
  useAlertasFinanceiros
} from '@/app/(dashboard)/dashboard';
import { ResumoCards as OrcamentosWidget } from '../orcamentos/resumo-cards';
import { useResumoObrigacoes } from '../../hooks/use-obrigacoes';
import { useOrcamentos } from '../../hooks/use-orcamentos';
import type { ResumoObrigacoesFinanceiro } from '../../actions/obrigacoes';

// ============================================================================
// ObrigacoesResumoWidget - Widget para exibir resumo de obrigações financeiras
// ============================================================================

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: valor >= 1000000 ? 'compact' : 'standard',
  }).format(valor);
};

function ObrigacoesResumoWidget({
  resumo,
  isLoading
}: {
  resumo: ResumoObrigacoesFinanceiro;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Vencidas
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatarValor(resumo.valorTotalVencido)}</div>
          <p className="text-xs text-muted-foreground">{resumo.totalVencidas} parcelas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pendentes
          </CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatarValor(resumo.valorTotalPendente)}</div>
          <p className="text-xs text-muted-foreground">{resumo.totalPendentes} parcelas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Repasses Pendentes
          </CardTitle>
          <Banknote className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatarValor(resumo.valorRepassesPendentes)}</div>
          <p className="text-xs text-muted-foreground">{resumo.totalRepassesPendentes} repasses</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function FinanceiroDashboard() {
  const { saldoAtual, error: errorSaldo } = useSaldoContas();
  const { contasPagar, contasReceber, error: errorContas } = useContasPagarReceber();
  const { alertas, error: errorAlertas } = useAlertasFinanceiros();

  const { resumo: resumoObrigacoes, isLoading: isLoadingObrigacoes } = useResumoObrigacoes();
  const { orcamentos, isLoading: isLoadingOrcamentos } = useOrcamentos({ autoFetch: true, filters: { limite: 1000 } });

  const totaisOrcamentos = React.useMemo(() => {
    const t = {
      rascunho: 0,
      aprovado: 0,
      emExecucao: 0,
      encerrado: 0,
    };
    if (orcamentos) {
      orcamentos.forEach((o) => {
        if (o.status === 'rascunho') t.rascunho++;
        if (o.status === 'aprovado') t.aprovado++;
        if (o.status === 'em_execucao') t.emExecucao++;
        if (o.status === 'encerrado') t.encerrado++;
      });
    }
    return t;
  }, [orcamentos]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Saldo Total"
          value={errorSaldo ? 'Erro' : saldoAtual}
          icon={Wallet}
        />
        <MetricCard
          title="Contas a Pagar (Vencidas)"
          value={errorContas ? 'Erro' : (contasPagar?.valor || 0)}
          trend={`${contasPagar?.quantidade || 0} contas`}
          trendDirection="down"
          icon={ArrowUp}
        />
        <MetricCard
          title="Contas a Receber (Pendentes)"
          value={errorContas ? 'Erro' : (contasReceber?.valor || 0)}
          trend="Previsão"
          trendDirection="neutral"
          icon={ArrowDown}
        />
        <MetricCard
          title="Alertas"
          value={errorAlertas ? 'Erro' : (alertas?.length || 0)}
          icon={AlertTriangle}
          trendDirection="neutral"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WidgetFluxoCaixa />
        </div>
        <WidgetDespesasCategoria />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Obrigações e Prazos</h3>
        <ObrigacoesResumoWidget resumo={resumoObrigacoes} isLoading={isLoadingObrigacoes} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Orçamentos</h3>
        <OrcamentosWidget totais={totaisOrcamentos} isLoading={isLoadingOrcamentos} />
      </div>
    </div>
  );
}
