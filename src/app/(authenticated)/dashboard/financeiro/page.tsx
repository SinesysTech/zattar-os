import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { obterDashboardUsuario, obterDashboardAdmin } from '../service';
import { DashboardProvider } from '../hooks';
import { Heading } from '@/components/ui/typography';

// Widgets financeiros
import { WidgetSaúdeFinanceira } from '../widgets/financeiro/saude-financeira';
import { WidgetFluxoComTabs } from '../widgets/financeiro/fluxo-tabs';
import { WidgetFluxoCaixa } from '../widgets/financeiro/fluxo-caixa';
import { WidgetSaldoTrend } from '../widgets/financeiro/saldo-trend';
import { WidgetContasReceber } from '../widgets/financeiro/contas-receber';
import { WidgetContasPagar } from '../widgets/financeiro/contas-pagar';
import { WidgetDespesasCategoria } from '../widgets/financeiro/despesas-categoria';
import { WidgetDREComparativo } from '../widgets/financeiro/dre-comparativo';
import { WidgetInadimplencia } from '../widgets/financeiro/inadimplencia';
import { WidgetDespesasTreemap } from '../widgets/financeiro/despesas-treemap';

export const metadata: Metadata = {
  title: 'Dashboard — Financeiro',
  description: 'Visão financeira consolidada: fluxo de caixa, contas, despesas e DRE.',
};

export const dynamic = 'force-dynamic';

async function prefetchData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, is_super_admin')
    .eq('auth_uid', user.id)
    .single();

  if (!usuario) return null;

  return usuario.is_super_admin
    ? obterDashboardAdmin(usuario.id)
    : obterDashboardUsuario(usuario.id);
}

export default async function FinanceiroPage() {
  const initialData = await prefetchData().catch(() => null);

  return (
    <DashboardProvider initialData={initialData}>
      <div className="space-y-4">
        <Heading level="page">Financeiro</Heading>

        {/* Row 1: Saúde Financeira (col-span-2) + Inadimplência */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <WidgetSaúdeFinanceira />
          </div>
          <WidgetInadimplencia />
        </div>

        {/* Row 2: Fluxo de Caixa (col-span-2) + Saldo Trend */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <WidgetFluxoCaixa />
          </div>
          <WidgetSaldoTrend />
        </div>

        {/* Row 3: Contas Receber + Contas Pagar + Despesas Categoria */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <WidgetContasReceber />
          <WidgetContasPagar />
          <WidgetDespesasCategoria />
        </div>

        {/* Row 4: DRE + Fluxo Tabs + Despesas Treemap */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <WidgetDREComparativo />
          <WidgetFluxoComTabs />
          <WidgetDespesasTreemap />
        </div>
      </div>
    </DashboardProvider>
  );
}
