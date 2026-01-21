/**
 * Partes Components - Main barrel export
 *
 * Re-exporta todos os componentes do modulo de partes
 * organizados por entidade.
 */

// Shared components
export { ProcessosRelacionadosCell, CopyButton } from "./shared";

// Clientes components
export {
  CLIENTES_FILTER_CONFIGS,
  buildClientesFilterOptions,
  buildClientesFilterGroups,
  parseClientesFilters,
  ClientesTableWrapper,
  ClienteForm,
} from "./clientes";

// Partes Contrarias components
export {
  PARTES_CONTRARIAS_FILTER_CONFIGS,
  buildPartesContrariasFilterOptions,
  buildPartesContrariasFilterGroups,
  parsePartesContrariasFilters,
  PartesContrariasTableWrapper,
} from "./partes-contrarias";

// Terceiros components
export {
  TERCEIROS_FILTER_CONFIGS,
  buildTerceirosFilterOptions,
  buildTerceirosFilterGroups,
  parseTerceirosFilters,
  TerceirosTableWrapper,
} from "./terceiros";

// Representantes components
export {
  REPRESENTANTES_FILTER_CONFIGS,
  buildRepresentantesFilterOptions,
  buildRepresentantesFilterGroups,
  parseRepresentantesFilters,
  RepresentantesTableWrapper,
} from "./representantes";
