'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Wallet,
  FileSignature,
  FileText,
  Inbox,
  CalendarDays,
} from 'lucide-react';

import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';
import { Skeleton } from '@/components/ui/skeleton';

const FinanceiroDashboard = React.lazy(() =>
  import('./dashboard/financeiro-dashboard').then((mod) => ({
    default: mod.FinanceiroDashboard,
  }))
);

const ContratosDashboard = React.lazy(
  () =>
    import('@/app/app/dashboard/contratos/contratos-dashboard-content')
);

const ProcessosDashboard = React.lazy(
  () => import('@/app/app/dashboard/processos/page')
);

const ExpedientesDashboard = React.lazy(
  () => import('@/app/app/dashboard/expedientes/page')
);

const AudienciasDashboard = React.lazy(
  () => import('@/app/app/dashboard/audiencias/page')
);

type GestaoDashboardView =
  | 'financeiro'
  | 'contratos'
  | 'processos'
  | 'expedientes'
  | 'audiencias';

const VALID_TABS = new Set<GestaoDashboardView>([
  'financeiro',
  'contratos',
  'processos',
  'expedientes',
  'audiencias',
]);

const TABS = [
  {
    value: 'financeiro',
    label: 'Financeiro',
    icon: <Wallet className="h-4 w-4" />,
  },
  {
    value: 'contratos',
    label: 'Contratos',
    icon: <FileSignature className="h-4 w-4" />,
  },
  {
    value: 'processos',
    label: 'Processos',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    value: 'expedientes',
    label: 'Expedientes',
    icon: <Inbox className="h-4 w-4" />,
  },
  {
    value: 'audiencias',
    label: 'Audiências',
    icon: <CalendarDays className="h-4 w-4" />,
  },
];

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function GestaoDashboardsTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab: GestaoDashboardView =
    tabParam && VALID_TABS.has(tabParam as GestaoDashboardView)
      ? (tabParam as GestaoDashboardView)
      : 'financeiro';

  const handleTabChange = React.useCallback(
    (value: string) => {
      router.push(`/app/financeiro?tab=${value}`, { scroll: false });
    },
    [router]
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'financeiro':
        return <FinanceiroDashboard />;
      case 'contratos':
        return <ContratosDashboard />;
      case 'processos':
        return <ProcessosDashboard />;
      case 'expedientes':
        return <ExpedientesDashboard />;
      case 'audiencias':
        return <AudienciasDashboard />;
      default:
        return <FinanceiroDashboard />;
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
        <React.Suspense fallback={<TabSkeleton />}>
          {renderContent()}
        </React.Suspense>
      </div>
    </div>
  );
}
