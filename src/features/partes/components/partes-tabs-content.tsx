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
import { Users, UserX, UserCog, Scale } from 'lucide-react';

import { Tabs02, TabsList02, TabsTrigger02, TabsContent02 } from '@/components/shadcn-studio/tabs/tabs-02';
import { type ExpedientesTab } from '@/components/shared';
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

const TABS: ExpedientesTab[] = [
  { value: 'clientes', label: 'Clientes', icon: <Users className="h-4 w-4" /> },
  { value: 'partes-contrarias', label: 'Partes Contrárias', icon: <UserX className="h-4 w-4" /> },
  { value: 'terceiros', label: 'Terceiros', icon: <UserCog className="h-4 w-4" /> },
  { value: 'representantes', label: 'Representantes', icon: <Scale className="h-4 w-4" /> },
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
  const activeTab = (rawTab && VALID_TABS.has(rawTab)) 
    ? (rawTab as PartesView) 
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
    <Tabs02 value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList02>
        {TABS.map((tab) => (
          <TabsTrigger02
            key={tab.value}
            value={tab.value}
          >
            {tab.icon}
            {tab.label}
          </TabsTrigger02>
        ))}
      </TabsList02>
      <div className="mt-4 flex-1 overflow-auto">
        <TabsContent02 value={activeTab} className="m-0 border-none p-0 outline-none data-[state=inactive]:hidden">
          {renderContent()}
        </TabsContent02>
      </div>
    </Tabs02>
  );
}

export default PartesTabsContent;
