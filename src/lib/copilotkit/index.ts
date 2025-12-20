/**
 * CopilotKit - Configurações, Prompts, Actions e Components
 *
 * @example
 * // Configurações
 * import { SYSTEM_PROMPT } from '@/lib/copilotkit';
 *
 * // Actions (hooks)
 * import { useNavegacaoActions, useProcessosActions } from '@/lib/copilotkit/actions';
 *
 * // Componentes
 * import { CopilotGlobalActions } from '@/lib/copilotkit/components';
 */

// Configurações e Prompts
export { SYSTEM_PROMPT } from "./system-prompt";

// Re-export de actions (para imports diretos)
export * from "./actions";

// Re-export de components
export * from "./components";
