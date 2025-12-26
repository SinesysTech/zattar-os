'use client';

/**
 * PartesTabsContent - Componente principal com tabs para navegação entre tipos de partes
 *
 * Implementa navegação por tabs seguindo o padrão de ExpedientesContent:
 * - Tabs: Clientes | Partes Contrárias | Terceiros | Representantes
 * - URL com query param: /partes?tab=clientes
 * - Experiência de página única
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Tabs02, TabsList02, TabsTrigger02, TabsContent02 } from '@/components/ui/tabs-02';
// ExpedientesTab type is not exported from barrel, using inline type
type ExpedientesTab = 'clientes' | 'partes-contrarias' | 'terceiros' | 'representantes';
import { ClientesTableWrapper } from './clientes';
import { PartesContrariasTableWrapper } from './partes-contrarias';
import { TerceirosTableWrapper } from './terceiros';
import { RepresentantesTableWrapper } from './representantes';

// =============================================================================
// TIPOS
// =============================================================================

type PartesView = 'clientes' | 'partes-contrarias' | 'terceiros' | 'representantes';

// =============================================================================
// CONFIGURAÇÃO DAS TABS
// =============================================================================

const TABS: { value: ExpedientesTab; label: string }[] = [
  { value: 'clientes', label: 'Clientes' },
  { value: 'partes-contrarias', label: 'Partes Contrárias' },
  { value: 'terceiros', label: 'Terceiros' },
  { value: 'representantes', label: 'Representantes' },
];

const VALID_TABS = new Set(TABS.map(t => t.value));

// =============================================================================
// PROPS
// =============================================================================

interface PartesTabsContentProps {
  /** Tab inicial (padrão: 'clientes') */
  initialTab?: PartesView;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function PartesTabsContent({ initialTab = 'clientes' }: PartesTabsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Deriva a tab ativa da URL com validação
  const rawTab = searchParams.get('tab');
  const activeTab = (rawTab && VALID_TABS.has(rawTab as ExpedientesTab)) 
    ? (rawTab as ExpedientesTab) 
    : initialTab;

  // Handler para mudança de tab - atualiza URL
  const handleTabChange = React.useCallback(
    (value: string) => {
      router.push(`/partes?tab=${value}`, { scroll: false });
    },
    [router]
  );

  // =============================================================================
  // RENDERIZAÇÃO DO CONTEÚDO
  // =============================================================================

  const renderContent = () => {
    switch (activeTab) {
      case 'clientes':
        return <ClientesTableWrapper />;
      case 'partes-contrarias':
        return <PartesContrariasTableWrapper />;
      case 'terceiros':
        return <TerceirosTableWrapper />;
      case 'representantes':
        return <RepresentantesTableWrapper />;
      default:
        return <ClientesTableWrapper />;
    }
  };

  return (
    <Tabs02 value={activeTab} onValueChange={handleTabChange}>
      <TabsList02>
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

export default PartesTabsContent;
