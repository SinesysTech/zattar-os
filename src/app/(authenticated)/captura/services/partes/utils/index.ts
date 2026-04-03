/**
 * Barrel exports para utilitários de captura de partes
 */

// Document normalization utilities
export {
  normalizarCpf,
  normalizarCnpj,
  normalizarDocumento,
  validarFormatoCpf,
  validarFormatoCnpj,
  validarCpf,
  validarCnpj,
  temDocumentoValido,
} from "./document-normalizer";

// Polo mapping utilities
export {
  mapearPoloParaSistema,
  normalizarPolo,
  validarTipoParteProcesso,
  isPoloValido,
  inferirPoloDoTipoParte,
} from "./polo-mapper";

// Validation and extraction utilities
export {
  validarEnderecoPJE,
  temCamposMinimosEndereco,
  extrairCamposPJE,
  extrairCamposRepresentantePJE,
  validarFormatoCep,
  validarFormatoTelefone,
  validarFormatoEmail,
  type EnderecoPJE,
  type ValidacaoEnderecoResult,
  type CamposExtraidosPJE,
  type CamposRepresentanteExtraidos,
} from "./validators";
