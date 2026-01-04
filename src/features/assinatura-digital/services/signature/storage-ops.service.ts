/**
 * Serviço de Operações de Storage para Assinatura Digital
 *
 * Operações de download de PDFs do Backblaze B2 para auditoria
 * e verificação de integridade.
 *
 * @module signature/storage-ops.service
 */

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { logger, LogServices, LogOperations } from "../logger";

const SERVICE = LogServices.SIGNATURE;

/**
 * Baixa PDF do Backblaze B2 para auditoria.
 *
 * Usa cliente S3-compatible para acessar o Backblaze B2 e
 * baixar o PDF armazenado para verificação de integridade.
 *
 * @param pdfUrl - URL pública do PDF no storage
 * @returns Buffer do PDF baixado
 * @throws {Error} Se configuração do B2 estiver incompleta ou download falhar
 *
 * @example
 * const pdfBuffer = await downloadPdfFromStorage(
 *   "https://endpoint/bucket/assinaturas/FS-20250110143022-84721.pdf"
 * );
 * const hash = calculateHash(pdfBuffer);
 */
export async function downloadPdfFromStorage(pdfUrl: string): Promise<Buffer> {
  const context = {
    service: SERVICE,
    operation: LogOperations.DOWNLOAD,
  };

  try {
    const buffer = await downloadFromStorageUrl(pdfUrl, context);
    return buffer;
  } catch (error) {
    logger.error("Erro ao baixar PDF do storage", error, context);
    throw new Error(
      `Falha ao baixar PDF: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Baixa qualquer arquivo do storage (Backblaze B2 / S3 compatível) a partir de uma URL.
 *
 * Mantém a mesma lógica de extração bucket+key usada por downloadPdfFromStorage,
 * porém genérica para permitir reuso (ex.: baixar imagens de assinatura/selfie).
 */
export async function downloadFromStorageUrl(
  fileUrl: string,
  baseContext: Record<string, unknown> = {}
): Promise<Buffer> {
  // Extrair bucket e key da URL - suporte a múltiplos formatos
  // Formato 1 (S3-style virtual-hosted): https://bucket.endpoint/key
  // Formato 2 (Backblaze /file/): https://endpoint/file/bucket/key
  // Formato 3 (path-style): https://endpoint/bucket/key
  const urlObj = new URL(fileUrl);
  const pathParts = urlObj.pathname.split("/").filter(Boolean);

  let bucket: string;
  let key: string;

  // Verificar se é virtual-hosted style (bucket no hostname)
  const hostParts = urlObj.hostname.split(".");
  if (hostParts.length > 2 && !hostParts[0].includes("s3")) {
    // Formato: bucket.s3.region.amazonaws.com ou bucket.endpoint.com
    bucket = hostParts[0];
    key = pathParts.join("/");
  } else if (pathParts[0] === "file" && pathParts.length >= 2) {
    // Formato Backblaze: /file/bucket/key
    bucket = pathParts[1];
    key = pathParts.slice(2).join("/");
  } else {
    // Formato path-style: /bucket/key
    bucket = pathParts[0];
    key = pathParts.slice(1).join("/");
  }

  logger.debug("Baixando arquivo do storage", {
    ...baseContext,
    bucket,
    key,
    url_format: pathParts[0] === "file" ? "backblaze" : "path-style",
  });

  // Configurar cliente S3 para Backblaze
  const endpoint = process.env.B2_ENDPOINT;
  const region = process.env.B2_REGION;
  const keyId = process.env.B2_ACCESS_KEY_ID;
  const applicationKey = process.env.B2_SECRET_ACCESS_KEY;

  if (!endpoint || !region || !keyId || !applicationKey) {
    throw new Error(
      "Configuração do Backblaze B2 incompleta. Verifique as variáveis de ambiente B2_ENDPOINT, B2_REGION, B2_ACCESS_KEY_ID, e B2_SECRET_ACCESS_KEY."
    );
  }

  const client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: applicationKey,
    },
  });

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);
  if (!response.Body) {
    throw new Error("Resposta do storage sem corpo");
  }

  // Converter stream para buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  logger.debug("Arquivo baixado com sucesso", { ...baseContext, size: buffer.length });
  return buffer;
}
