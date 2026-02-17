/**
 * Feature: Integrações
 * Barrel exports
 */

// Domain
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

// Service
export {
  listar,
  listarPorTipo,
  buscarPorId,
  buscarConfig2FAuth,
  criar,
  atualizar,
  deletar,
  toggleAtivo,
  atualizarConfig2FAuth,
} from "./service";

// Actions
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

// Components
export { TwoFAuthIntegrationCard } from "./components/twofauth-integration-card";
export { TwoFAuthConfigForm } from "./components/twofauth-config-form";
