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
  // Types - Partes
  type TipoEntidadeChatwoot,
  type PartesChatwoot,
  type CreatePartesChatwootInput,
  type UpdatePartesChatwootInput,
  type ListarMapeamentosParams,
  type DadosSincronizados,
  type SincronizacaoResult,

  // Types - Conversas
  type ConversaChatwoot,
  type CreateConversaChatwootInput,
  type UpdateConversaChatwootInput,
  type ListarConversasParams,
  type StatusConversa,

  // Types - Usuários
  type UsuarioChatwoot,
  type CreateUsuarioChatwootInput,
  type UpdateUsuarioChatwootInput,
  type ListarUsuariosParams,
  type RoleUsuario,

  // Schemas
  tipoEntidadeChatwootSchema,
  createPartesChatwootSchema,
  updatePartesChatwootSchema,
  listarMapeamentosSchema,
  statusConversaSchema,
  roleUsuarioSchema,

  // Utils
  formatarTelefoneInternacional,
  normalizarDocumentoParaIdentifier,
  obterPrimeiroEmail,
  dadosModificados,
} from './domain';

// Repository
export {
  // Partes Chatwoot
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

  // Conversas Chatwoot
  findConversaById,
  findConversaPorChatwootId,
  listarConversas,
  criarConversa,
  atualizarConversa,
  removerConversa,

  // Usuários Chatwoot
  findUsuarioById,
  findUsuarioPorUUID,
  findUsuarioPorChatwootId,
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  atualizarUsuarioPorUUID,
  listarAgentesDisponíveis,
  removerUsuario,
} from './repository';

// Service
export {
  // Partes sync (existing)
  parteParaChatwootContact,
  parteParaChatwootUpdate,
  sincronizarParteComChatwoot,
  vincularParteAContato,
  desvincularParte,
  excluirContatoEMapeamento,
  buscarContatoVinculado,
  parteEstaVinculada,
  // Phone-based sync (Chatwoot -> App)
  extrairTelefone,
  buscarPartePorTelefone,
  sincronizarChatwootParaApp,
  type ParteEncontrada,
  type SincronizarChatwootParaAppResult,
  // Conversations
  buscarConversasDaParte,
  buscarHistoricoConversa,
  buscarHistoricoConversaFormatado,
  buscarMetricasConversas,
  // Conversas table sync (NEW)
  sincronizarConversaChatwoot,
  atribuirConversaInteligente,
  atualizarStatusConversa,
  // Usuários table sync (NEW)
  sincronizarAgenteChatwoot,
  atualizarDisponibilidadeAgente,
  // Webhook handling (NEW)
  processarWebhookConversa,
  processarWebhookAgente,
  processarWebhook,
  // Types (NEW)
  type SincronizarConversaParams,
  type AtribuirConversaInteligentParams,
  type SincronizarAgenteParams,
  type WebhookEventType,
  type WebhookPayload,
} from './service';

// Sync Hooks (wrapper functions com auto-sync)
export {
  saveClienteComSync,
  updateClienteComSync,
  sincronizarClienteManual,
} from './sync-hooks';

// Actions (server actions para batch sync)
export {
  // Generic actions (for all tipos de partes)
  sincronizarTodasPartes,
  sincronizarParte,
  type SincronizarPartesParams,
  type SincronizarPartesResult,
  // Two-phase sync (Chatwoot <-> App)
  sincronizarCompletoComChatwoot,
  type SincronizarCompletoParams,
  type SincronizarCompletoResult,
  // Webhook & API endpoints (NEW)
  processarWebhookChatwoot,
  sincronizarConversaManual,
  atualizarStatusConversaAPI,
  // Legacy actions (for clientes only - retrocompatibilidade)
  sincronizarTodosClientes,
  sincronizarCliente,
  sincronizarClientesPorIds,
  type SincronizarClientesParams,
  type SincronizarClientesResult,
} from './actions';

// Components
export { ChatwootSyncButton } from './components';

// Hooks (React hooks para UI)
export {
  useChatwootConversations,
  type UseChatwootConversationsOptions,
  type UseChatwootConversationsState,
  useChatwootAgents,
  useChatwootAgentAvailability,
  type UseChatwootAgentsOptions,
  type UseChatwootAgentsState,
  useChatwootRealtime,
  useChatwootConversationChanges,
  useChatwootUserChanges,
  type RealtimeEventType,
  type RealtimeEvent,
  type UseChatwootRealtimeOptions,
  type UseChatwootRealtimeState,
} from './hooks';
