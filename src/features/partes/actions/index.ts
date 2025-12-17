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
// CLIENTES - Safe Actions
// =============================================================================
export {
  actionListarClientesSafe,
  actionBuscarClienteSafe,
  actionListarClientesSugestoesSafe,
  actionCriarClienteSafe,
  actionAtualizarClienteSafe,
  actionDesativarClienteSafe,
} from './clientes-actions';

// =============================================================================
// PARTES CONTRARIAS - Safe Actions
// =============================================================================
export {
  actionListarPartesContrariasSafe,
  actionBuscarParteContrariaSafe,
  actionCriarParteContrariaSafe,
  actionAtualizarParteContrariaSafe,
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
// FORM ACTIONS (useActionState)
// =============================================================================
export {
  type ActionResult,
  actionCriarCliente,
  actionAtualizarCliente,
  actionListarClientes,
  actionDesativarCliente,
  actionCriarParteContraria,
  actionAtualizarParteContraria,
  actionListarPartesContrarias,
  actionCriarTerceiro,
  actionAtualizarTerceiro,
  actionListarTerceiros,
} from './partes-form-actions';
