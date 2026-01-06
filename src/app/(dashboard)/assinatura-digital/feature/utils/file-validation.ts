/**
 * ASSINATURA DIGITAL - File Validation Utilities
 *
 * Implementa validação de arquivos por magic bytes para prevenir
 * uploads de arquivos maliciosos com MIME type spoofado.
 */

/**
 * PDF Magic Bytes: %PDF- (hex: 25 50 44 46 2D)
 * Alguns PDFs podem ter bytes BOM antes do header, então verificamos os primeiros 1024 bytes
 */
const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-

/**
 * Resultado da validação de arquivo
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Opções para validação de PDF
 */
export interface PdfValidationOptions {
  /** Tamanho máximo em bytes (default: 50MB) */
  maxSize?: number;
  /** Verificar marcador EOF (default: false - alguns PDFs válidos não têm) */
  checkEof?: boolean;
}

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Valida se um buffer contém um arquivo PDF válido baseado em magic bytes.
 *
 * Verifica:
 * 1. Magic bytes: %PDF- nos primeiros 1024 bytes (permite BOM e whitespace)
 * 2. Tamanho máximo do arquivo
 * 3. Opcionalmente, marcador %%EOF no final
 *
 * @param buffer - Buffer do arquivo
 * @param options - Opções de validação
 * @returns Resultado da validação
 */
export function validatePdfBuffer(
  buffer: Buffer,
  options: PdfValidationOptions = {}
): FileValidationResult {
  const { maxSize = DEFAULT_MAX_SIZE, checkEof = false } = options;

  // Validar tamanho
  if (buffer.length > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo permitido: ${maxSizeMB}MB`,
    };
  }

  // Validar tamanho mínimo (pelo menos os magic bytes)
  if (buffer.length < PDF_MAGIC_BYTES.length) {
    return {
      valid: false,
      error: "Arquivo muito pequeno para ser um PDF válido",
    };
  }

  // Procurar magic bytes nos primeiros 1024 bytes
  // Isso permite arquivos com BOM (Byte Order Mark) ou whitespace inicial
  const searchRange = Math.min(1024, buffer.length);
  const headerBytes = buffer.subarray(0, searchRange);

  let foundMagicBytes = false;
  for (let i = 0; i <= searchRange - PDF_MAGIC_BYTES.length; i++) {
    if (headerBytes.subarray(i, i + PDF_MAGIC_BYTES.length).equals(PDF_MAGIC_BYTES)) {
      foundMagicBytes = true;
      break;
    }
  }

  if (!foundMagicBytes) {
    return {
      valid: false,
      error: "Arquivo inválido. O conteúdo não corresponde a um PDF válido.",
    };
  }

  // Verificar marcador EOF (opcional, pois alguns PDFs válidos podem não ter)
  if (checkEof) {
    const tailBytes = buffer.subarray(-1024);
    const eofMarker = Buffer.from("%%EOF");
    if (!tailBytes.includes(eofMarker)) {
      return {
        valid: false,
        error: "Arquivo PDF malformado. Marcador de fim não encontrado.",
      };
    }
  }

  return { valid: true };
}

/**
 * Valida um arquivo File do FormData como PDF.
 *
 * Esta função converte o File para Buffer e valida os magic bytes.
 *
 * @param file - Arquivo do FormData
 * @param options - Opções de validação
 * @returns Resultado da validação e o buffer do arquivo se válido
 */
export async function validatePdfFile(
  file: File,
  options: PdfValidationOptions = {}
): Promise<FileValidationResult & { buffer?: Buffer }> {
  // Validação básica do tipo MIME (primeira linha de defesa)
  if (file.type && file.type !== "application/pdf") {
    return {
      valid: false,
      error: "Tipo de arquivo inválido. Apenas PDFs são permitidos.",
    };
  }

  // Converter para buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validar magic bytes
  const result = validatePdfBuffer(buffer, options);

  if (!result.valid) {
    return result;
  }

  return { valid: true, buffer };
}

/**
 * Tipos de arquivo suportados para validação futura
 */
export const SUPPORTED_MAGIC_BYTES = {
  PDF: { bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], extension: ".pdf" }, // %PDF-
  PNG: { bytes: [0x89, 0x50, 0x4e, 0x47], extension: ".png" }, // .PNG
  JPEG: { bytes: [0xff, 0xd8, 0xff], extension: ".jpg" }, // JPEG SOI
  GIF: { bytes: [0x47, 0x49, 0x46, 0x38], extension: ".gif" }, // GIF8
  WEBP: { bytes: [0x52, 0x49, 0x46, 0x46], extension: ".webp" }, // RIFF (+ WEBP check)
} as const;

/**
 * Detecta o tipo real do arquivo baseado em magic bytes.
 *
 * @param buffer - Buffer do arquivo
 * @returns Tipo detectado ou null se não reconhecido
 */
export function detectFileType(buffer: Buffer): keyof typeof SUPPORTED_MAGIC_BYTES | null {
  if (buffer.length < 4) return null;

  for (const [type, { bytes }] of Object.entries(SUPPORTED_MAGIC_BYTES)) {
    const magic = Buffer.from(bytes);
    if (buffer.subarray(0, magic.length).equals(magic)) {
      // Verificação adicional para WEBP (RIFF é usado por vários formatos)
      if (type === "WEBP" && buffer.length >= 12) {
        const webpMarker = buffer.subarray(8, 12).toString("ascii");
        if (webpMarker !== "WEBP") continue;
      }
      return type as keyof typeof SUPPORTED_MAGIC_BYTES;
    }
  }

  return null;
}
