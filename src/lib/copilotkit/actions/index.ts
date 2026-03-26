/**
 * CopilotKit Actions - Index
 *
 * Re-exporta hooks de ações frontend (operam no DOM/router).
 * Ações de dados (processos, audiências, expedientes, workflow) foram
 * removidas — agora são servidas via MCP tools backend no BuiltInAgent v2.
 */

// Tipos
export * from './types';

// Hooks de ações frontend (navegação + visualização)
export { useNavegacaoActions } from './navegacao.actions';
export { useVisualizacaoActions } from './visualizacao.actions';
