'use client';

import Link from 'next/link';
import { Plus, Upload, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WidgetSaldoContas } from '@/app/(dashboard)/dashboard/components/widgets/widget-saldo-contas';
import { WidgetContasPagarReceber } from '@/app/(dashboard)/dashboard/components/widgets/widget-contas-pagar-receber';
import { WidgetFluxoCaixa } from '@/app/(dashboard)/dashboard/components/widgets/widget-fluxo-caixa';
import { WidgetDespesasCategoria } from '@/app/(dashboard)/dashboard/components/widgets/widget-despesas-categoria';
import { WidgetOrcamentoAtual } from '@/app/(dashboard)/dashboard/components/widgets/widget-orcamento-atual';
import { WidgetAlertasFinanceiros } from '@/app/(dashboard)/dashboard/components/widgets/widget-alertas-financeiros';
import { ObrigacoesWidget } from '@/app/(dashboard)/dashboard/components/obrigacoes-widget';
import { WidgetFolhaPagamento } from '@/app/(dashboard)/dashboard/components/widgets/widget-folha-pagamento';

export default function FinanceiroDashboardPage() {
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <WidgetSaldoContas />
        <WidgetContasPagarReceber />
        <WidgetAlertasFinanceiros />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WidgetFluxoCaixa />
        </div>
        <WidgetDespesasCategoria />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <WidgetOrcamentoAtual />
        <ObrigacoesWidget />
        <WidgetFolhaPagamento />
      </div>

      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Acompanhe métricas, alertas e ações rápidas do financeiro em um único painel.
        </CardContent>
      </Card>
    </div>
  );
}
