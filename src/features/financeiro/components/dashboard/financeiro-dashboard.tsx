'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, Upload, FileText, Wallet, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MetricCard,
  WidgetFluxoCaixa,
  WidgetDespesasCategoria,
  useSaldoContas,
  useContasPagarReceber,
  useAlertasFinanceiros
} from '@/features/dashboard';
import { ResumoCards as ObrigacoesWidget } from '@/features/obrigacoes';
import { ResumoCards as OrcamentosWidget } from '../orcamentos/resumo-cards';
import { useResumoObrigacoes } from '../../hooks/use-obrigacoes';
import { useOrcamentos } from '../../hooks/use-orcamentos';
import type { ResumoObrigacoes } from '@/features/obrigacoes/domain';

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard / Financeiro</p>
          <h1 className="text-2xl font-bold">Visão Financeira</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/financeiro/contas-pagar/novo">
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta a Pagar
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/financeiro/contas-receber/novo">
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta a Receber
            </Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/financeiro/conciliacao-bancaria/importar">
              <Upload className="mr-2 h-4 w-4" />
              Importar Extrato
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/financeiro/dre">
              <FileText className="mr-2 h-4 w-4" />
              Gerar DRE
            </Link>
          </Button>
        </div>
      </div>

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

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
         <Card>
            <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Obrigações e Prazos</h3>
                <ObrigacoesWidget resumo={resumoObrigacoes as ResumoObrigacoes} isLoading={isLoadingObrigacoes} />
            </CardContent>
         </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
         <Card>
            <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Orçamentos</h3>
                <OrcamentosWidget totais={totaisOrcamentos} isLoading={isLoadingOrcamentos} />
            </CardContent>
         </Card>
      </div>

      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Acompanhe métricas, alertas e ações rápidas do financeiro em um único painel.
        </CardContent>
      </Card>
    </div>
  );
}
