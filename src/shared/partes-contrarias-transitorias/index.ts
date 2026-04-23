export type {
  ParteContrariaTransitoria,
  ParteContrariaTransitoriaStatus,
  ParteContrariaTransitoriaCriadoVia,
  TipoPessoa,
  CreateTransitoriaInput,
  UpdateTransitoriaInput,
  PromoverTransitoriaInput,
  SugestaoMerge,
} from "./domain";

export {
  createTransitoriaSchema,
  updateTransitoriaSchema,
  promoverTransitoriaSchema,
} from "./domain";

export {
  createTransitoria,
  findTransitoriaById,
  listTransitoriasPendentesByContrato,
  listTodasPendentes,
  contarPendentes,
  sugerirMerge,
  marcarTransitoriaComoPromovida,
  promoverTransitoria,
  atualizarTransitoria,
  type PromoverResult,
} from "./service";

export {
  actionPromoverTransitoria,
  actionAtualizarTransitoria,
  actionListarTransitoriasPendentes,
  actionContarTransitoriasPendentes,
  actionBuscarSugestoesMerge,
  actionBuscarTransitoriaPorId,
  actionListarTransitoriasPorContrato,
} from "./actions";
