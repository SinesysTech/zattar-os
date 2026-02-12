/**
 * 2FAuth QR Code Module
 *
 * Geração e decodificação de QR Codes
 */

import { request } from "./client";
import { TwoFAuthConfig, QRCodeResponse, QRCodeDecodeResult } from "./types";

// =============================================================================
// GERAR QR CODE
// =============================================================================

/**
 * Gera um QR Code para uma conta
 *
 * @param accountId - ID da conta
 * @param config - Configuração opcional
 * @returns QR Code em base64
 */
export async function generateQRCode(
  accountId: number,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<QRCodeResponse> {
  return request<QRCodeResponse>(
    `/qrcode/${accountId}`,
    { method: "GET" },
    config
  );
}

// =============================================================================
// DECODIFICAR QR CODE
// =============================================================================

/**
 * Decodifica um QR Code de imagem
 *
 * @param imageBase64 - Imagem em base64
 * @param config - Configuração opcional
 * @returns URI otpauth:// extraída
 */
export async function decodeQRCode(
  imageBase64: string,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<QRCodeDecodeResult> {
  return request<QRCodeDecodeResult>(
    "/qrcode/decode",
    { method: "POST", body: { qrcode: imageBase64 } },
    config
  );
}

/**
 * Decodifica um QR Code de arquivo
 *
 * @param file - Arquivo de imagem
 * @param config - Configuração opcional
 * @returns URI otpauth:// extraída
 */
export async function decodeQRCodeFile(
  file: File,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<QRCodeDecodeResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const result = await decodeQRCode(base64, config);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Erro ao ler arquivo de imagem"));
    };

    reader.readAsDataURL(file);
  });
}
