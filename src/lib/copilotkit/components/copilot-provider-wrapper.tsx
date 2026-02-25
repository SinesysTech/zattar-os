'use client';

/**
 * CopilotProviderWrapper
 *
 * Wrapper client-side que combina o CopilotKit provider com as ações globais.
 * Necessário porque o layout.tsx é um Server Component.
 *
 * O CopilotSidebar envolve o conteúdo para que useChatContext funcione no AppHeader.
 * Usamos className="copilot-sidebar-wrapper" com CSS display:contents para
 * neutralizar o wrapper div interno que quebra layouts flexbox.
 *
 * @see https://github.com/CopilotKit/CopilotKit/issues/273
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
      publicApiKey={process.env.NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY}
    >
      {/* Registra ações globais (navegação, visualização) */}
      <CopilotGlobalActions />

      {/*
        CopilotSidebar como WRAPPER para que useChatContext funcione no AppHeader.
        className="copilot-sidebar-wrapper" aplica display:contents para neutralizar
        o div interno que quebra layouts flexbox.
        Button={() => null} remove o botão padrão - usamos AI Sphere no AppHeader.
      */}
      <CopilotSidebar
        defaultOpen={COPILOTKIT_CONFIG.sidebar.defaultOpen}
        instructions={SYSTEM_PROMPT}
        labels={COPILOTKIT_CONFIG.labels}
        clickOutsideToClose={true}
        Button={() => null}
        className="copilot-sidebar-wrapper"
      >
        {children}
      </CopilotSidebar>
    </CopilotKit>
  );
}
