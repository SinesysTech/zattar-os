/**
 * Tags Feature - Barrel Export
 *
 * Exporta todas as funcionalidades do módulo de tags.
 */

// Domain
export * from "./domain";

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
