'use client';

/**
 * CapturaTabsContent - Componente principal com tabs para navegação no módulo de Captura
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Tabs02, TabsList02, TabsTrigger02, TabsContent02 } from '@/components/shadcn-studio/tabs/tabs-02';
import AgendamentosClient from '@/app/(dashboard)/captura/agendamentos/page-client';
import CredenciaisClient from '@/app/(dashboard)/captura/credenciais/page-client';
import HistoricoClient from '@/app/(dashboard)/captura/historico/page-client';
import TribunaisClient from '@/app/(dashboard)/captura/tribunais/page-client';

// =============================================================================
// TIPOS
// =============================================================================

type CapturaView = 'historico' | 'agendamentos' | 'credenciais' | 'tribunais';

interface CapturaTab {
  value: CapturaView;
  label: string;
}

// =============================================================================
// CONFIGURAÇÃO DAS TABS
// =============================================================================

const TABS: CapturaTab[] = [
  { value: 'historico', label: 'Histórico' },
  { value: 'agendamentos', label: 'Agendamentos' },
  { value: 'credenciais', label: 'Credenciais' },
  { value: 'tribunais', label: 'Tribunais' },
];

const VALID_TABS = new Set(TABS.map(t => t.value));

// =============================================================================
// PROPS
// =============================================================================

interface CapturaTabsContentProps {
  /** Tab inicial (padrão: 'historico') */
  initialTab?: CapturaView;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function CapturaTabsContent({ initialTab = 'historico' }: CapturaTabsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Deriva a tab ativa da URL com validação
  const rawTab = searchParams.get('tab');
  const activeTab = (rawTab && VALID_TABS.has(rawTab as CapturaView)) 
    ? (rawTab as CapturaView) 
    : initialTab;

  // Handler para mudança de tab - atualiza URL
  const handleTabChange = React.useCallback(
    (value: string) => {
      router.push(`/captura?tab=${value}`, { scroll: false });
    },
    [router]
  );

  // =============================================================================
  // RENDERIZAÇÃO DO CONTEÚDO
  // =============================================================================

  const renderContent = () => {
    switch (activeTab) {
      case 'historico':
        return <HistoricoClient />;
      case 'agendamentos':
        return <AgendamentosClient />;
      case 'credenciais':
        return <CredenciaisClient />;
      case 'tribunais':
        return <TribunaisClient />;
      default:
        return <HistoricoClient />;
    }
  };

  return (
    <Tabs02 value={activeTab} onValueChange={handleTabChange}>
      <TabsList02 className="bg-white">
        {TABS.map((tab) => (
          <TabsTrigger02
            key={tab.value}
            value={tab.value}
          >
            {tab.label}
          </TabsTrigger02>
        ))}
      </TabsList02>
      <div className="mt-4 flex-1 min-h-0">
        <TabsContent02 value={activeTab} className="m-0 border-none p-0 outline-none data-[state=inactive]:hidden">
          {renderContent()}
        </TabsContent02>
      </div>
    </Tabs02>
  );
}

export default CapturaTabsContent;
