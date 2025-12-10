/**
 * Comunica CNJ Module
 * Integração com API pública do CNJ para captura de comunicações processuais
 * 
 * ⚠️ MÓDULO LEGADO - DEPRECATED ⚠️
 * 
 * Este módulo está sendo gradualmente substituído por `src/core/comunica-cnj`.
 * 
 * **NOVAS INTEGRAÇÕES DEVEM USAR `src/core/comunica-cnj`:**
 * - Use `@/core/comunica-cnj` para novas funcionalidades
 * - Este módulo será removido assim que todas as referências forem migradas
 * 
 * **Migração em andamento:**
 * - Verifique scripts e jobs que ainda usam este módulo
 * - Migre para os serviços equivalentes em `src/core/comunica-cnj`
 * 
 * @deprecated Use `src/core/comunica-cnj` para novas integrações
 */

// =============================================================================
// TYPES
// =============================================================================

export * from './types/types';

// =============================================================================
// CLIENT
// =============================================================================

export {
  ComunicaCNJClient,
  createComunicaCNJClientFromEnv,
  getComunicaCNJClient,
} from './client/comunica-cnj-client';

// =============================================================================
// SERVICES - BUSINESS LOGIC
// =============================================================================

// Busca de comunicações (API)
export {
  buscarComunicacoes,
  buscarComunicacoesPorOab,
  buscarComunicacoesPorProcesso,
  buscarComunicacoesPorTribunalData,
  obterStatusRateLimit,
} from './services/comunica-cnj/buscar-comunicacoes.service';

// Certidão e tribunais
export {
  obterCertidao,
  listarTribunais,
  obterCaderno,
} from './services/comunica-cnj/obter-certidao.service';

// Captura e processamento
export {
  executarCaptura,
  executarCapturaPorAdvogado,
  executarCapturaPorAgendamento,
} from './services/comunica-cnj/capturar-comunicacoes.service';

// =============================================================================
// SERVICES - PERSISTENCE
// =============================================================================

export {
  inserirComunicacao,
  inserirComunicacoesBatch,
  buscarPorHash,
  buscarPorIdCnj,
  existeComunicacao,
  listarComunicacoes,
  vincularExpediente,
  desvincularExpediente,
  atualizarAdvogado,
  buscarExpedienteCorrespondente,
} from './services/persistence/comunica-cnj-persistence.service';

// =============================================================================
// UTILITIES
// =============================================================================

export {
  inferirGrau,
  extrairPartes,
  obterNomeParteAutora,
  obterNomeParteRe,
  contarPartes,
  normalizarNumeroProcesso,
  mesmProcesso,
  extrairTRTDoNumeroProcesso,
  formatarData,
  calcularDataLimiteMatch,
} from './services/comunica-cnj/utils';
