'use client';

/**
 * ConfiguracoesTabsContent - Componente principal com tabs para navegação entre configurações
 *
 * Implementa navegação por tabs seguindo o padrão do projeto:
 * - Tabs: Métricas | Segurança | Autenticador
 * - URL com query param: /app/configuracoes?tab=metricas
 * - Experiência de página única
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Database, Shield, KeyRound } from 'lucide-react';

import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';
import { MetricasDBContent } from '@/app/app/admin/metricas-db/components/metricas-db-content';
import { BlockedIpsContent } from '@/app/app/admin/security/blocked-ips/components/blocked-ips-content';
import { TwoFAuthConfigContent } from '@/features/twofauth';
import type { MetricasDB } from '@/features/admin';

// =============================================================================
// TIPOS
// =============================================================================

type ConfiguracoesTab = 'metricas' | 'seguranca' | 'autenticador';

// =============================================================================
// CONFIGURAÇÃO DAS TABS
// =============================================================================

const TABS_UI = [
  { value: 'metricas' as const, label: 'Métricas', icon: <Database /> },
  { value: 'seguranca' as const, label: 'Segurança', icon: <Shield /> },
  { value: 'autenticador' as const, label: 'Autenticador', icon: <KeyRound /> },
];

const VALID_TABS = new Set<ConfiguracoesTab>(['metricas', 'seguranca', 'autenticador']);

// =============================================================================
// PROPS
// =============================================================================

interface ConfiguracoesTabsContentProps {
  /** Tab inicial (padrão: 'metricas') */
  initialTab?: ConfiguracoesTab;
  /** Dados de métricas do banco de dados */
  metricas?: MetricasDB;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ConfiguracoesTabsContent({
  initialTab = 'metricas',
  metricas,
}: ConfiguracoesTabsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Deriva a tab ativa da URL com validação
  const rawTab = searchParams.get('tab');
  const activeTab = (rawTab && VALID_TABS.has(rawTab as ConfiguracoesTab))
    ? (rawTab as ConfiguracoesTab)
    : initialTab;

  // Handler para mudança de tab - atualiza URL
  const handleTabChange = React.useCallback(
    (value: string) => {
      router.push(`/app/configuracoes?tab=${value}`, { scroll: false });
    },
    [router]
  );

  // =============================================================================
  // RENDERIZAÇÃO DO CONTEÚDO
  // =============================================================================

  const renderContent = () => {
    switch (activeTab) {
      case 'metricas':
        return metricas ? <MetricasDBContent metricas={metricas} /> : null;
      case 'seguranca':
        return <BlockedIpsContent />;
      case 'autenticador':
        return <TwoFAuthConfigContent />;
      default:
        return metricas ? <MetricasDBContent metricas={metricas} /> : null;
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

export default ConfiguracoesTabsContent;
