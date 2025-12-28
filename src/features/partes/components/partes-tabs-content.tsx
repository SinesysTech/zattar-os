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

import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';
import { Briefcase, User, UserRound, Users } from 'lucide-react';
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

const TABS_UI = [
  { value: 'clientes' as const, label: 'Clientes', icon: <User /> },
  { value: 'partes-contrarias' as const, label: 'Partes Contrárias', icon: <Users /> },
  { value: 'terceiros' as const, label: 'Terceiros', icon: <Briefcase /> },
  { value: 'representantes' as const, label: 'Representantes', icon: <UserRound /> },
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
    <div className="flex flex-col min-h-0">
      <AnimatedIconTabs
        tabs={TABS_UI}
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-fit"
      />
      <div className="mt-4 flex-1 min-h-0">{renderContent()}</div>
    </div>
  );
}

export default PartesTabsContent;
