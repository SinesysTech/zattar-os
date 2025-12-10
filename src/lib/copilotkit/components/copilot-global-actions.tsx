'use client';

/**
 * CopilotGlobalActions
 *
 * Componente que registra as ações globais do CopilotKit.
 * Deve ser usado dentro do CopilotKit provider.
 *
 * Ações globais são aquelas disponíveis em todas as páginas:
 * - Navegação entre módulos
 * - Toggle de sidebar
 * - Atualização de dados
 *
 * @example
 * // No layout.tsx
 * <CopilotKit>
 *   <CopilotGlobalActions />
 *   {children}
 * </CopilotKit>
 */

import { useNavegacaoActions } from '../actions/navegacao.actions';
import { useVisualizacaoActions } from '../actions/visualizacao.actions';

interface CopilotGlobalActionsProps {
  /** Função para toggle da sidebar (opcional) */
  onToggleSidebar?: () => void;
}

export function CopilotGlobalActions({ onToggleSidebar }: CopilotGlobalActionsProps) {
  // Registra ações de navegação (sempre disponíveis)
  useNavegacaoActions();

  // Registra ações de visualização globais
  useVisualizacaoActions({
    onToggleSidebar,
  });

  // Componente não renderiza nada visualmente
  return null;
}
