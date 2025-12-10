/**
 * CopilotKit Actions - Index
 *
 * Re-exporta todos os hooks de ações e tipos
 *
 * @example
 * import { useNavegacaoActions, useProcessosActions } from '@/lib/copilotkit/actions';
 */

// Tipos
export * from './types';

// Hooks de ações
export { useNavegacaoActions } from './navegacao.actions';
export { useProcessosActions } from './processos.actions';
export { useAudienciasActions } from './audiencias.actions';
export { useExpedientesActions } from './expedientes.actions';
export { useWorkflowActions } from './workflow.actions';
export { useVisualizacaoActions } from './visualizacao.actions';
