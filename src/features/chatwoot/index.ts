/**
 * CHATWOOT FEATURE MODULE
 *
 * Módulo de integração com Chatwoot para sincronização de contatos
 * com o módulo de partes (clientes, partes contrárias, terceiros).
 *
 * @example
 * ```typescript
 * import {
 *   sincronizarParteComChatwoot,
 *   vincularParteAContato,
 *   buscarContatoVinculado,
 * } from '@/features/chatwoot';
 *
 * // Sincronizar cliente com Chatwoot
 * const result = await sincronizarParteComChatwoot(
 *   cliente,
 *   'cliente'
 * );
 *
 * // Vincular parte existente a contato
 * await vincularParteAContato('cliente', 123, 456);
 * ```
 */

// Domain
export {
  // Types
  type TipoEntidadeChatwoot,
  type PartesChatwoot,
  type CreatePartesChatwootInput,
  type UpdatePartesChatwootInput,
  type ListarMapeamentosParams,
  type DadosSincronizados,
  type SincronizacaoResult,

  // Schemas
  tipoEntidadeChatwootSchema,
  createPartesChatwootSchema,
  updatePartesChatwootSchema,
  listarMapeamentosSchema,

  // Utils
  formatarTelefoneInternacional,
  normalizarDocumentoParaIdentifier,
  obterPrimeiroEmail,
  dadosModificados,
} from './domain';

// Repository
export {
  findMapeamentoById,
  findMapeamentoPorEntidade,
  findMapeamentoPorChatwootId,
  listarMapeamentos,
  criarMapeamento,
  atualizarMapeamento,
  atualizarMapeamentoPorEntidade,
  removerMapeamento,
  removerMapeamentoPorEntidade,
  removerMapeamentoPorChatwootId,
  contarMapeamentos,
  upsertMapeamentoPorEntidade,
} from './repository';

// Service
export {
  parteParaChatwootContact,
  parteParaChatwootUpdate,
  sincronizarParteComChatwoot,
  vincularParteAContato,
  desvincularParte,
  excluirContatoEMapeamento,
  buscarContatoVinculado,
  parteEstaVinculada,
} from './service';

// Sync Hooks (wrapper functions com auto-sync)
export {
  saveClienteComSync,
  updateClienteComSync,
  sincronizarClienteManual,
} from './sync-hooks';

// Actions (server actions para batch sync)
export {
  sincronizarTodosClientes,
  sincronizarCliente,
  sincronizarClientesPorIds,
  type SincronizarClientesParams,
  type SincronizarClientesResult,
} from './actions';
