'use client';

/**
 * CopilotProviderWrapper
 *
 * Wrapper client-side que combina o CopilotKit provider com as ações globais.
 * Necessário porque o layout.tsx é um Server Component.
 *
 * @example
 * // No layout.tsx (Server Component)
 * import { CopilotProviderWrapper } from '@/lib/copilotkit/components';
 *
 * <CopilotProviderWrapper>
 *   {children}
 * </CopilotProviderWrapper>
 */

import { CopilotKit } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';

import { SYSTEM_PROMPT, COPILOTKIT_CONFIG } from '../index';
import { CopilotGlobalActions } from './copilot-global-actions';

interface CopilotProviderWrapperProps {
  children: React.ReactNode;
}

export function CopilotProviderWrapper({ children }: CopilotProviderWrapperProps) {
  return (
    <CopilotKit
      runtimeUrl={COPILOTKIT_CONFIG.runtimeUrl}
      publicApiKey="ck_pub_b5b202514d1736f9e6f6675a87238818"
    >
      {/* Registra ações globais (navegação, visualização) */}
      <CopilotGlobalActions />

      <CopilotSidebar
        defaultOpen={COPILOTKIT_CONFIG.sidebar.defaultOpen}
        instructions={SYSTEM_PROMPT}
        labels={COPILOTKIT_CONFIG.labels}
      >
        <div className="flex flex-1 flex-col gap-4 p-6 overflow-x-hidden">
          {children}
        </div>
      </CopilotSidebar>
    </CopilotKit>
  );
}
