/**
 * Barrel exports para serviços de captura de partes
 */

// Fetch service
export {
  buscarPartesPJE,
  isRespostaPJEValida,
  extrairErroPJE,
  type BuscarPartesPJEResult,
} from "./fetch.service";

// Processing service
export {
  processarPartesEmLote,
  type ProcessamentoParteResult,
} from "./processing.service";

// Persistence service
export {
  processarParte,
  registrarRepresentanteCadastroPJE,
  type ProcessarParteResult,
} from "./persistence.service";

// Representatives service
export {
  processarRepresentantes,
  buscarRepresentante,
  representanteExiste,
} from "./representatives.service";

// Addresses service
export {
  processarEndereco,
  processarEnderecoRepresentante,
  vincularEnderecoNaEntidade,
} from "./addresses.service";

// Linking service
export {
  criarVinculoProcessoParte,
  vinculoExiste,
  removerVinculoProcessoParte,
  atualizarOrdemParte,
} from "./linking.service";
