'use client';

/**
 * Componente de Tabs para navegação do módulo RH
 * Centraliza Salários e Folhas de Pagamento em um único local com navegação por tabs
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, FileText } from 'lucide-react';

import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Importação lazy dos componentes de cada tab
const SalariosList = React.lazy(() =>
  import('./salarios/salarios-list').then((mod) => ({ default: mod.SalariosList }))
);
const FolhasPagamentoList = React.lazy(() =>
  import('./folhas-pagamento/folhas-list').then((mod) => ({ default: mod.FolhasPagamentoList }))
);

// ============================================================================
// Tipos e Constantes
// ============================================================================

type RHView = 'salarios' | 'folhas-pagamento';

const VALID_TABS = new Set<RHView>(['salarios', 'folhas-pagamento']);

const TABS: { value: RHView; label: string; icon: React.ReactNode }[] = [
  { value: 'salarios', label: 'Salários', icon: <Users className="h-4 w-4" /> },
  { value: 'folhas-pagamento', label: 'Folhas de Pagamento', icon: <FileText className="h-4 w-4" /> },
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

export function RHTabsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ler tab ativa da URL
  const tabParam = searchParams.get('tab');
  const activeTab: RHView =
    tabParam && VALID_TABS.has(tabParam as RHView) ? (tabParam as RHView) : 'salarios';

  // Handler para mudança de tab
  const handleTabChange = React.useCallback(
    (value: string) => {
      router.push(`/rh?tab=${value}`, { scroll: false });
    },
    [router]
  );

  // Renderizar conteúdo da tab ativa
  const renderContent = () => {
    switch (activeTab) {
      case 'salarios':
        return <SalariosList />;
      case 'folhas-pagamento':
        return <FolhasPagamentoList />;
      default:
        return <SalariosList />;
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <AnimatedIconTabs
        tabs={TABS}
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
        listClassName="flex-wrap"
      />

      <div className="flex-1 min-h-0">
        <React.Suspense fallback={<TabSkeleton />}>{renderContent()}</React.Suspense>
      </div>
    </div>
  );
}
