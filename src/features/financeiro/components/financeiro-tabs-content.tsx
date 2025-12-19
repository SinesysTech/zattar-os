'use client';

/**
 * Componente de Tabs para navegação do módulo Financeiro
 * Centraliza todas as 8 páginas do módulo em um único local com navegação por tabs
 */

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
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
import {
  Tabs02Responsive,
  TabsList02Responsive,
  TabsTrigger02Responsive,
  TabsContent02Responsive,
} from '@/components/shadcn-studio/tabs/tabs-02-responsive';
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
const ObrigacoesTableWrapper = React.lazy(() =>
  import('./obrigacoes/obrigacoes-table-wrapper').then((mod) => ({ default: mod.ObrigacoesTableWrapper }))
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
  const searchParams = useSearchParams();
  const { usuarioId, isLoading } = useUsuarioId();

  // Ler tab ativa da URL
  const tabParam = searchParams.get('tab');
  const activeTab: FinanceiroView =
    tabParam && VALID_TABS.has(tabParam as FinanceiroView)
      ? (tabParam as FinanceiroView)
      : 'dashboard';

  // Estado local para sincronizar com mudanças de URL via window.history.replaceState
  const [currentTab, setCurrentTab] = React.useState<FinanceiroView>(activeTab);

  // Atualizar estado local quando activeTab mudar (via searchParams)
  React.useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  // Handler para mudança de tab - usa window.history.replaceState para evitar recarregar server component
  const handleTabChange = React.useCallback((value: string) => {
    const newTab = value as FinanceiroView;
    
    // Atualizar estado imediatamente para resposta rápida
    setCurrentTab(newTab);
    
    // Atualizar URL sem recarregar a página
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Renderizar conteúdo da tab ativa
  const renderContent = () => {
    if (isLoading || !usuarioId) {
      return <TabSkeleton />;
    }

    switch (currentTab) {
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
        return <ObrigacoesTableWrapper />;
      case 'conciliacao':
        return <ConciliacaoBancariaPage />;
      case 'dre':
        return <DREPage />;
      default:
        return <FinanceiroDashboard />;
    }
  };

  return (
    <Tabs02Responsive value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList02Responsive>
        {TABS.map((tab) => (
          <TabsTrigger02Responsive key={tab.value} value={tab.value} className="gap-2">
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </TabsTrigger02Responsive>
        ))}
      </TabsList02Responsive>
      <div className="mt-6 flex-1">
        <TabsContent02Responsive value={currentTab} className="m-0 border-none p-0">
          <React.Suspense fallback={<TabSkeleton />}>
            {renderContent()}
          </React.Suspense>
        </TabsContent02Responsive>
      </div>
    </Tabs02Responsive>
  );
}
