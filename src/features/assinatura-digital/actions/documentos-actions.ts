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
    try {
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
        assinantes: input.assinantes,
      });

      // Revalidar listagem de documentos
      revalidatePath("/assinatura-digital/documentos");

      return {
        success: true,
        data: resultado,
        message: "Documento criado com sucesso",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao criar documento",
      };
    }
  }
);

/**
 * Busca um documento completo por UUID, incluindo assinantes e âncoras.
 */
export const actionGetDocumento = authenticatedAction(
  documentoUuidSchema,
  async (input) => {
    try {
      const documento = await documentosService.getDocumentoByUuid(input.uuid);

      if (!documento) {
        return {
          success: false,
          error: "Documento não encontrado",
        };
      }

      return {
        success: true,
        data: documento,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao buscar documento",
      };
    }
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
    try {
      await documentosService.setDocumentoAnchors({
        documentoUuid: input.documento_uuid,
        anchors: input.ancoras,
      });

      // Revalidar documento específico
      revalidatePath(`/assinatura-digital/documentos/${input.documento_uuid}`);
      revalidatePath("/assinatura-digital/documentos");

      return {
        success: true,
        message: "Âncoras salvas com sucesso",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao salvar âncoras",
      };
    }
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
    try {
      const params = {
        limit: input.pageSize ?? 20,
      };

      const resultado = await documentosService.listDocumentos(params);

      return {
        success: true,
        data: resultado,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao listar documentos",
      };
    }
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
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      return null;
    }
    // Remove o primeiro segmento (bucket name) e junta o resto
    return pathParts.slice(1).join('/');
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
    try {
      const key = extractKeyFromBackblazeUrl(input.url);

      if (!key) {
        return {
          success: false,
          error: "URL inválida - não foi possível extrair a chave do arquivo",
        };
      }

      // Gerar URL presigned com 1 hora de validade
      const presignedUrl = await generatePresignedUrl(key, 3600);

      return {
        success: true,
        data: { presignedUrl },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao gerar URL de acesso",
      };
    }
  }
);
