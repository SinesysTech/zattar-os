/**
 * Tags Feature - Barrel Export
 *
 * Exporta todas as funcionalidades do módulo de tags.
 */

// Domain
export * from "./domain";

// Service
export {
  listarTags,
  buscarTag,
  criarTag,
  atualizarTag,
  excluirTag,
  listarTagsDoProcesso,
  listarTagsDosProcessos,
  vincularTag,
  desvincularTag,
  atualizarTagsProcesso,
} from "./service";

// Actions
export {
  actionListarTags,
  actionBuscarTag,
  actionCriarTag,
  actionAtualizarTag,
  actionExcluirTag,
  actionListarTagsDoProcesso,
  actionListarTagsDosProcessos,
  actionVincularTag,
  actionDesvincularTag,
  actionAtualizarTagsDoProcesso,
} from "./actions";

// Components
export * from "./components";
