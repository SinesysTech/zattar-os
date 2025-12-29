'use client';

/**
 * Componente de Tabs para navegação do módulo Financeiro
 * Centraliza todas as 8 páginas do módulo em um único local com navegação por tabs
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Wallet,
  FolderTree,
  Handshake,
  GitCompare,
  TrendingUp,
} from 'lucide-react';

import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';
import { Skeleton } from '@/components/ui/skeleton';

import { useUsuarioId } from './usuario-id-provider';

// Importação lazy dos componentes de cada tab
const FinanceiroDashboard = React.lazy(() =>
  import('./dashboard/financeiro-dashboard').then((mod) => ({ default: mod.FinanceiroDashboard }))
);
const OrcamentosClientPage = React.lazy(() =>
  import('@/app/(dashboard)/financeiro/orcamentos/client-page')
);
const ContasPagarPage = React.lazy(() =>
  import('@/app/(dashboard)/financeiro/contas-pagar/page')
);
const ContasReceberPage = React.lazy(() =>
  import('@/app/(dashboard)/financeiro/contas-receber/page-client')
);
const PlanoContasPage = React.lazy(() =>
  import('@/app/(dashboard)/financeiro/plano-contas/page-client')
);
const ObrigacoesContent = React.lazy(() =>
  import('@/features/obrigacoes').then((mod) => ({ default: mod.ObrigacoesContent }))
);
const ConciliacaoBancariaPage = React.lazy(() =>
  import('@/app/(dashboard)/financeiro/conciliacao-bancaria/page-client')
);
const DREPage = React.lazy(() =>
  import('@/app/(dashboard)/financeiro/dre/page')
);

// ============================================================================
// Tipos e Constantes
// ============================================================================

type FinanceiroView =
  | 'dashboard'
  | 'orcamentos'
  | 'contas-pagar'
  | 'contas-receber'
  | 'plano-contas'
  | 'obrigacoes'
  | 'conciliacao'
  | 'dre';

const VALID_TABS = new Set<FinanceiroView>([
  'dashboard',
  'orcamentos',
  'contas-pagar',
  'contas-receber',
  'plano-contas',
  'obrigacoes',
  'conciliacao',
  'dre',
]);

const TABS: { value: FinanceiroView; label: string; icon: React.ReactNode }[] = [
  { value: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { value: 'orcamentos', label: 'Orçamentos', icon: <FileText className="h-4 w-4" /> },
  { value: 'contas-pagar', label: 'Contas a Pagar', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'contas-receber', label: 'Contas a Receber', icon: <Wallet className="h-4 w-4" /> },
  { value: 'plano-contas', label: 'Plano de Contas', icon: <FolderTree className="h-4 w-4" /> },
  { value: 'obrigacoes', label: 'Obrigações', icon: <Handshake className="h-4 w-4" /> },
  { value: 'conciliacao', label: 'Conciliação', icon: <GitCompare className="h-4 w-4" /> },
  { value: 'dre', label: 'DRE', icon: <TrendingUp className="h-4 w-4" /> },
];

// ============================================================================
// Componente de Loading
// ============================================================================

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

// ============================================================================
// Componente Principal
// ============================================================================

export function FinanceiroTabsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuarioId, isLoading } = useUsuarioId();

  // Ler tab ativa da URL
  const tabParam = searchParams.get('tab');
  const activeTab: FinanceiroView =
    tabParam && VALID_TABS.has(tabParam as FinanceiroView)
      ? (tabParam as FinanceiroView)
      : 'dashboard';

  // Handler para mudança de tab - usa router.push para consistência com outros módulos
  const handleTabChange = React.useCallback((value: string) => {
    router.push(`/financeiro?tab=${value}`, { scroll: false });
  }, [router]);

  // Renderizar conteúdo da tab ativa
  const renderContent = () => {
    if (isLoading || !usuarioId) {
      return <TabSkeleton />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <FinanceiroDashboard />;
      case 'orcamentos':
        return <OrcamentosClientPage usuarioId={usuarioId} />;
      case 'contas-pagar':
        return <ContasPagarPage />;
      case 'contas-receber':
        return <ContasReceberPage />;
      case 'plano-contas':
        return <PlanoContasPage />;
      case 'obrigacoes':
        return <ObrigacoesContent />;
      case 'conciliacao':
        return <ConciliacaoBancariaPage />;
      case 'dre':
        return <DREPage />;
      default:
        return <FinanceiroDashboard />;
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <AnimatedIconTabs
          tabs={TABS}
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
          listClassName="w-full flex-wrap"
        />
      </div>

      <div className="mt-6 flex-1">
        <React.Suspense fallback={<TabSkeleton />}>{renderContent()}</React.Suspense>
      </div>
    </div>
  );
}