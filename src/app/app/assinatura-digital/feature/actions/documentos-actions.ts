"use server";

/**
 * DOCUMENTOS ACTIONS - Server Actions para Documentos de Assinatura
 *
 * Server actions para o fluxo novo de assinatura digital com upload de PDF.
 */

import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/lib/safe-action";
import { z } from "zod";
import {
  createAssinaturaDigitalDocumentoSchema,
  upsertAssinaturaDigitalDocumentoAncoraSchema,
  createAssinaturaDigitalDocumentoAssinanteSchema,
} from "../domain";
import * as documentosService from "../services/documentos.service";
import { downloadFromStorageUrl } from "../services/signature";
import { generatePresignedUrl } from "@/lib/storage/backblaze-b2.service";

// =============================================================================
// SCHEMAS
// =============================================================================

const documentoUuidSchema = z.object({
  uuid: z.string().uuid("UUID inválido"),
});

const setAncorasSchema = z.object({
  documento_uuid: z.string().uuid(),
  ancoras: z.array(upsertAssinaturaDigitalDocumentoAncoraSchema),
});

const addSignerSchema = z.object({
  documento_uuid: z.string().uuid(),
  signer: createAssinaturaDigitalDocumentoAssinanteSchema,
});

const removeSignerSchema = z.object({
  documento_uuid: z.string().uuid(),
  signer_id: z.number().int().positive(),
});

// =============================================================================
// ACTIONS - CRIAÇÃO E GESTÃO DE DOCUMENTOS
// =============================================================================

/**
 * Cria um novo documento de assinatura a partir de um PDF uploadado.
 *
 * Gera tokens opacos únicos por assinante e retorna os links públicos.
 */
export const actionCreateDocumento = authenticatedAction(
  createAssinaturaDigitalDocumentoSchema,
  async (input) => {
    // Download do PDF da URL fornecida
    const pdfBuffer = await downloadFromStorageUrl(input.pdf_original_url, {
      service: "documentos-action",
      operation: "download_pdf_for_create",
    });

    const resultado = await documentosService.createDocumentoFromUploadedPdf({
      titulo: input.titulo,
      selfie_habilitada: input.selfie_habilitada ?? false,
      pdfBuffer,
      created_by: input.created_by,
      assinantes: input.assinantes ?? [],
    });

    // Revalidar listagem de documentos
    revalidatePath("/assinatura-digital/documentos");

    // Retornar apenas os dados - o wrapper adiciona success: true automaticamente
    return resultado;
  }
);

/**
 * Busca um documento completo por UUID, incluindo assinantes e âncoras.
 */
export const actionGetDocumento = authenticatedAction(
  documentoUuidSchema,
  async (input) => {
    const documento = await documentosService.getDocumentoByUuid(input.uuid);

    if (!documento) {
      throw new Error("Documento não encontrado");
    }

    // Retornar apenas os dados - o wrapper adiciona success: true automaticamente
    return documento;
  }
);

/**
 * Define/atualiza as âncoras (coordenadas) de assinatura/rubrica no documento.
 *
 * Marca o documento como "pronto" após salvar âncoras.
 */
export const actionSetDocumentoAnchors = authenticatedAction(
  setAncorasSchema,
  async (input) => {
    const result = await documentosService.setDocumentoAnchors({
      documentoUuid: input.documento_uuid,
      anchors: input.ancoras,
    });

    // Revalidar documento específico
    revalidatePath(`/assinatura-digital/documentos/${input.documento_uuid}`);
    revalidatePath("/assinatura-digital/documentos");

    // Retornar os dados - o wrapper adiciona success: true automaticamente
    return result;
  }
);

/**
 * Adiciona um novo assinante ao documento.
 */
export const actionAddDocumentoSigner = authenticatedAction(
  addSignerSchema,
  async (input) => {
    const result = await documentosService.addSignerToDocument(
      input.documento_uuid,
      input.signer
    );
    revalidatePath(`/assinatura-digital/documentos/${input.documento_uuid}`);
    return result;
  }
);

/**
 * Remove um assinante do documento.
 */
export const actionRemoveDocumentoSigner = authenticatedAction(
  removeSignerSchema,
  async (input) => {
    await documentosService.removeSignerFromDocument(
      input.documento_uuid,
      input.signer_id
    );
    revalidatePath(`/assinatura-digital/documentos/${input.documento_uuid}`);
    return { success: true };
  }
);

/**
 * Deleta um documento de assinatura digital.
 *
 * Documentos concluídos ou com assinaturas concluídas não podem ser deletados.
 */
export const actionDeleteDocumento = authenticatedAction(
  documentoUuidSchema,
  async (input) => {
    const result = await documentosService.deleteDocumento(input.uuid);

    // Revalidar listagem de documentos
    revalidatePath("/assinatura-digital/documentos");

    return result;
  }
);

/**
 * Finaliza um documento para assinatura.
 *
 * Verifica se o documento tem âncoras definidas e marca como "pronto"
 * se ainda não estiver nesse status.
 */
export const actionFinalizeDocumento = authenticatedAction(
  documentoUuidSchema,
  async (input) => {
    const result = await documentosService.finalizeDocumento(input.uuid);

    // Revalidar documento específico e listagem
    revalidatePath(`/assinatura-digital/documentos/${input.uuid}`);
    revalidatePath("/assinatura-digital/documentos");

    return result;
  }
);

/**
 * Lista documentos com paginação e filtros.
 */
export const actionListDocumentos = authenticatedAction(
  z.object({
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().max(100).optional(),
    status: z.enum(["rascunho", "pronto", "concluido", "cancelado"]).optional(),
  }),
  async (input) => {
    // O authenticatedAction já trata erros e retorna { success, data }
    // O handler só precisa retornar os dados ou lançar um erro
    const params = {
      limit: input.pageSize ?? 20,
    };

    const resultado = await documentosService.listDocumentos(params);

    // Retornar apenas os dados - o wrapper adiciona success: true automaticamente
    return resultado;
  }
);

// =============================================================================
// ACTIONS - URL PRESIGNED PARA PREVIEW
// =============================================================================

/**
 * Extrai a key do arquivo a partir da URL completa do Backblaze.
 *
 * URL formato: https://s3.us-east-005.backblazeb2.com/bucket-name/path/to/file.pdf
 * Key extraída: path/to/file.pdf
 */
function extractKeyFromBackblazeUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    // O pathname começa com /bucket-name/key
    // Precisamos remover o primeiro segmento (bucket name)
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    if (pathParts.length < 2) {
      return null;
    }
    // Remove o primeiro segmento (bucket name) e junta o resto
    return pathParts.slice(1).join("/");
  } catch {
    return null;
  }
}

const presignedUrlSchema = z.object({
  url: z.string().url("URL inválida"),
});

/**
 * Gera uma URL presigned para acesso temporário a um PDF armazenado no Backblaze.
 *
 * Útil para exibir PDFs no browser quando o bucket é privado.
 */
export const actionGetPresignedPdfUrl = authenticatedAction(
  presignedUrlSchema,
  async (input) => {
    const key = extractKeyFromBackblazeUrl(input.url);

    if (!key) {
      throw new Error(
        "URL inválida - não foi possível extrair a chave do arquivo"
      );
    }

    // Gerar URL presigned com 1 hora de validade
    const presignedUrl = await generatePresignedUrl(key, 3600);

    // Retornar apenas os dados - o wrapper adiciona success: true automaticamente
    return { presignedUrl };
  }
);
