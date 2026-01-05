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
      const resultado = await documentosService.createDocumentoFromUploadedPdf(
        input
      );

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
      await documentosService.setDocumentoAnchors(
        input.documento_uuid,
        input.ancoras
      );

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
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 20,
        status: input.status,
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
