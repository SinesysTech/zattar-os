/**
 * Barrel export para Server Actions da feature Partes
 *
 * Organiza todas as actions de:
 * - Clientes
 * - Partes Contrarias
 * - Terceiros
 * - Processo Partes
 */

// =============================================================================
// CLIENTES - Safe Actions & Direct Actions
// =============================================================================
export {
  // Safe Actions (com validação next-safe-action)
  actionListarClientesSafe,
  actionBuscarClienteSafe,
  actionListarClientesSugestoesSafe,
  actionCriarClienteSafe,
  actionAtualizarClienteSafe,
  actionDesativarClienteSafe,
  // Direct Actions (para MCP e uso interno)
  actionListarClientes,
  actionBuscarCliente,
  actionAtualizarCliente,
  actionListarClientesSugestoes,
  actionBuscarClientePorCPF,
  actionBuscarClientePorCNPJ,
  actionContarClientes,
  actionContarClientesComEstatisticas,
  actionContarClientesPorEstado,
} from './clientes-actions';

// =============================================================================
// PARTES CONTRARIAS - Safe Actions
// =============================================================================
export {
  actionListarPartesContrariasSafe,
  actionBuscarParteContrariaSafe,
  actionCriarParteContrariaSafe,
  actionAtualizarParteContrariaSafe,
  actionContarPartesContrariasComEstatisticas,
} from './partes-contrarias-actions';

// =============================================================================
// TERCEIROS - Safe Actions
// =============================================================================
export {
  actionListarTerceirosSafe,
  actionBuscarTerceiroSafe,
  actionCriarTerceiroSafe,
  actionAtualizarTerceiroSafe,
} from './terceiros-actions';

// =============================================================================
// PROCESSO PARTES
// =============================================================================
export { actionBuscarPartesPorProcessoEPolo } from './processo-partes-actions';

// =============================================================================
// REPRESENTANTES
// =============================================================================
export {
  actionListarRepresentantes,
  actionBuscarRepresentantePorId,
  actionCriarRepresentante,
  actionAtualizarRepresentante,
  actionDeletarRepresentante,
  actionUpsertRepresentantePorCPF,
  actionBuscarRepresentantePorNome,
  actionBuscarRepresentantesPorOAB,
} from './representantes-actions';

// =============================================================================
// FORM ACTIONS (useActionState)
// Nota: actionListarClientes e actionAtualizarCliente exportados de clientes-actions.ts
// =============================================================================
export {
  type ActionResult,
  actionCriarCliente,
  actionAtualizarClienteForm,
  actionDesativarCliente,
  actionCriarParteContraria,
  actionAtualizarParteContraria,
  actionListarPartesContrarias,
  actionCriarTerceiro,
  actionAtualizarTerceiro,
  actionListarTerceiros,
} from './partes-form-actions';
