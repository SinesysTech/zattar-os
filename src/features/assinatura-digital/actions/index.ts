"use server";

/**
 * ASSINATURA DIGITAL ACTIONS - Export Central
 * 
 * Re-exporta todas as server actions do módulo de assinatura digital.
 */

// Documentos (Novo Fluxo)
export {
  actionCreateDocumento,
  actionGetDocumento,
  actionSetDocumentoAnchors,
  actionListDocumentos,
} from "./documentos-actions";

// Templates
export {
  actionCreateTemplate,
  actionUpdateTemplate,
  actionDeleteTemplate,
  actionListTemplates,
  actionGetTemplateById,
  actionGetTemplateByUuid,
} from "./templates-actions";
