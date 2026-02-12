/**
 * 2FAuth Icons Module
 *
 * Upload e gerenciamento de ícones
 */

import { request, uploadFile } from "./client";
import { TwoFAuthConfig, IconUploadResponse } from "./types";

// =============================================================================
// UPLOAD DE ÍCONE
// =============================================================================

/**
 * Faz upload de um ícone
 *
 * @param file - Arquivo de imagem
 * @param config - Configuração opcional
 * @returns Nome do arquivo no servidor
 */
export async function uploadIcon(
  file: File | Blob,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<IconUploadResponse> {
  return uploadFile("/icons", file, "icon", config);
}

// =============================================================================
// EXCLUIR ÍCONE
// =============================================================================

/**
 * Exclui um ícone
 *
 * @param filename - Nome do arquivo
 * @param config - Configuração opcional
 */
export async function deleteIcon(
  filename: string,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<void> {
  await request<void>(`/icons/${filename}`, { method: "DELETE" }, config);
}

// =============================================================================
// BUSCAR ÍCONE OFICIAL
// =============================================================================

/**
 * Busca ícones oficiais de serviços conhecidos
 *
 * @param service - Nome do serviço (ex: "google", "github")
 * @param config - Configuração opcional
 * @returns URL do ícone ou null se não encontrado
 */
export async function fetchOfficialIcon(
  service: string,
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<{ filename: string } | null> {
  try {
    return await request<{ filename: string }>(
      `/icons/default/${encodeURIComponent(service)}`,
      { method: "GET" },
      config
    );
  } catch {
    return null;
  }
}
