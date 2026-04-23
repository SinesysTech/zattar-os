export type {
  ParteContrariaTransitoria,
  ParteContrariaTransitoriaStatus,
  ParteContrariaTransitoriaCriadoVia,
  TipoPessoa,
  CreateTransitoriaInput,
  PromoverTransitoriaInput,
  SugestaoMerge,
} from "./domain";

export {
  createTransitoriaSchema,
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
} from "./service";
