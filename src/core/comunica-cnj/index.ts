/**
 * COMUNICA CNJ MODULE - Barrel Export
 * Integração com API pública do CNJ para captura de comunicações processuais
 */

// =============================================================================
// DOMAIN
// =============================================================================

export * from './domain';

// =============================================================================
// CLIENT (Infrastructure)
// =============================================================================

export { ComunicaCNJClient, getComunicaCNJClient, createComunicaCNJClientFromEnv } from './cnj-client';

// =============================================================================
// REPOSITORY (Raramente usado diretamente)
// =============================================================================

export type { ComunicacaoCNJ } from './repository';

// =============================================================================
// SERVICES
// =============================================================================

export {
  buscarComunicacoes,
  sincronizarComunicacoes,
  listarComunicacoesCapturadas,
  listarTribunaisDisponiveis,
  vincularComunicacaoAExpediente,
  obterStatusRateLimit,
  obterCertidao,
} from './service';
