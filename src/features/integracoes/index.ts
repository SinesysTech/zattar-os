/**
 * Feature: Integrações
 * Barrel exports
 * 
 * IMPORTANT: Only export types, schemas, actions, and components here.
 * DO NOT export service or repository functions to avoid client/server boundary violations.
 */

// Domain - Types and Schemas (safe for client)
export type {
  Integracao,
  TipoIntegracao,
  TwoFAuthConfig,
  CriarIntegracaoParams,
  AtualizarIntegracaoParams,
} from "./domain";

export {
  TIPOS_INTEGRACAO,
  LABELS_TIPO_INTEGRACAO,
  DESCRICOES_TIPO_INTEGRACAO,
  criarIntegracaoSchema,
  atualizarIntegracaoSchema,
  twofauthConfigSchema,
} from "./domain";

// Actions - Server Actions (safe for client)
export {
  actionListarIntegracoes,
  actionListarIntegracoesPorTipo,
  actionBuscarIntegracao,
  actionBuscarConfig2FAuth,
  actionCriarIntegracao,
  actionAtualizarIntegracao,
  actionDeletarIntegracao,
  actionToggleAtivoIntegracao,
  actionAtualizarConfig2FAuth,
} from "./actions/integracoes-actions";

// Components (safe for client)
export { TwoFAuthIntegrationCard } from "./components/twofauth-integration-card";
export { TwoFAuthConfigForm } from "./components/twofauth-config-form";

// Service - Server-only exports (use in Server Components and Actions only)
// Import directly from "./service" when needed in server context
