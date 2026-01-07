/**
 * Serviço de Preview para Assinatura Digital
 *
 * Gera PDFs de preview para visualização do cliente antes
 * da assinatura final.
 *
 * @module signature/preview.service
 */

import { generatePdfFromTemplate } from "../template-pdf.service";
import { storePdf } from "../storage.service";
import { getClienteBasico, getTemplateBasico } from "../data.service";
import { logger, createTimer, LogServices, LogOperations } from "../logger";
import type { PreviewPayload, PreviewResult } from "../../types/types";

const SERVICE = LogServices.SIGNATURE;

/**
 * Gera preview de assinatura digital para visualização do cliente.
 *
 * Cria um PDF preenchido com dados reais do cliente mas com
 * protocolo "PREVIEW" e segmento/formulário dummy. O PDF é
 * armazenado temporariamente no storage para visualização.
 *
 * @param payload - Dados para geração do preview
 * @returns URL do PDF de preview gerado
 * @throws {Error} Se cliente ou template não encontrados
 *
 * @example
 * const result = await generatePreview({
 *   cliente_id: 123,
 *   template_id: "uuid-do-template",
 *   contrato_id: 456,
 *   foto_base64: "data:image/jpeg;base64,..."
 * });
 * console.log(result.pdf_url); // URL para visualização
 */
export async function generatePreview(
  payload: PreviewPayload
): Promise<PreviewResult> {
  const timer = createTimer();
  const context = {
    service: SERVICE,
    operation: LogOperations.PREVIEW,
    cliente_id: payload.cliente_id,
    template_id: payload.template_id,
  };

  logger.info("Gerando preview de assinatura", context);

  const [cliente, template] = await Promise.all([
    getClienteBasico(payload.cliente_id),
    getTemplateBasico(payload.template_id),
  ]);

  if (!cliente) {
    logger.warn("Cliente não encontrado para preview", context);
    throw new Error("Cliente não encontrado");
  }
  if (!template || !template.ativo) {
    logger.warn("Template não encontrado ou inativo para preview", {
      ...context,
      template_ativo: template?.ativo,
    });
    throw new Error("Template não encontrado ou inativo");
  }

  const dummySegmento = {
    id: 0,
    nome: "Preview",
    slug: "preview",
    ativo: true,
  };
  const dummyFormulario = {
    id: 0,
    formulario_uuid: "preview",
    nome: "Preview",
    slug: "preview",
    segmento_id: 0,
    ativo: true,
  };

  // Extrair dados de parte contrária se disponível (only in FinalizePayload)
  const isFinalizePayload = "parte_contraria_dados" in payload;
  const parteContrariaNome =
    isFinalizePayload &&
    payload.parte_contraria_dados &&
    payload.parte_contraria_dados.length > 0
      ? payload.parte_contraria_dados[0].nome
      : undefined;

  logger.debug("Gerando PDF de preview", context);
  const pdfBuffer = await generatePdfFromTemplate(
    template,
    {
      cliente,
      segmento: dummySegmento,
      formulario: dummyFormulario,
      protocolo: "PREVIEW",
      parte_contraria: parteContrariaNome
        ? { nome: parteContrariaNome }
        : undefined,
    },
    { contrato_id: payload.contrato_id },
    { fotoBase64: payload.foto_base64 || undefined }
  );

  logger.debug("Armazenando PDF de preview", context);
  const stored = await storePdf(pdfBuffer);

  timer.log("Preview gerado com sucesso", context, {
    pdf_size: pdfBuffer.length,
  });
  return { pdf_url: stored.url };
}
