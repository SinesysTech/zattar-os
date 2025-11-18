// Factory para criar instâncias de storage
// Determina qual provider usar baseado em variáveis de ambiente

import type { IStorageService, StorageProvider } from './storage.interface';
import { MinioStorageService } from './minio-storage.service';
import { S3StorageService } from './s3-storage.service';

/**
 * Cria instância de storage service baseado no provider configurado
 *
 * Variável de ambiente:
 * - STORAGE_PROVIDER: "minio" | "s3" | "aws" (padrão: "minio")
 *
 * @returns Instância do storage service configurado
 */
export function createStorageService(): IStorageService {
  const provider = (process.env.STORAGE_PROVIDER || 'minio') as StorageProvider;

  console.log(`📦 Criando storage service com provider: ${provider}`);

  switch (provider) {
    case 'minio':
      return new MinioStorageService();

    case 's3':
    case 'aws':
      return new S3StorageService();

    case 'local':
      // TODO: Implementar LocalStorageService se necessário
      console.warn('⚠️ Local storage ainda não implementado, usando Minio como fallback');
      return new MinioStorageService();

    default:
      console.warn(`⚠️ Provider desconhecido: ${provider}, usando Minio como fallback`);
      return new MinioStorageService();
  }
}

/**
 * Instância singleton do storage service
 */
let storageServiceInstance: IStorageService | null = null;

/**
 * Obtém instância singleton do storage service
 *
 * @returns Instância do storage service
 */
export function getStorageService(): IStorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = createStorageService();
  }
  return storageServiceInstance;
}

/**
 * Reseta instância singleton (útil para testes)
 */
export function resetStorageService(): void {
  storageServiceInstance = null;
}

/**
 * Gera path único para arquivo
 *
 * @param acordoId ID do acordo/condenação
 * @param parcelaId ID da parcela
 * @param tipo Tipo do arquivo ("declaracao" ou "comprovante")
 * @param filename Nome original do arquivo
 * @returns Path no formato: repasses/{acordoId}/{parcelaId}/{tipo}_{timestamp}_{filename}
 */
export function generateFilePath(
  acordoId: number,
  parcelaId: number,
  tipo: 'declaracao' | 'comprovante',
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `repasses/${acordoId}/${parcelaId}/${tipo}_${timestamp}_${sanitizedFilename}`;
}

/**
 * Valida formato de arquivo
 *
 * @param filename Nome do arquivo
 * @param allowedExtensions Extensões permitidas (padrão: PDF, JPG, JPEG, PNG)
 * @returns true se arquivo é válido
 */
export function validateFileFormat(
  filename: string,
  allowedExtensions: string[] = ['pdf', 'jpg', 'jpeg', 'png']
): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  return allowedExtensions.includes(ext);
}

/**
 * Valida tamanho de arquivo
 *
 * @param sizeInBytes Tamanho do arquivo em bytes
 * @param maxSizeMB Tamanho máximo em MB (padrão: 5MB)
 * @returns true se arquivo está dentro do limite
 */
export function validateFileSize(
  sizeInBytes: number,
  maxSizeMB: number = 5
): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return sizeInBytes <= maxSizeBytes;
}

/**
 * Obtém content type baseado na extensão do arquivo
 *
 * @param filename Nome do arquivo
 * @returns MIME type
 */
export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}
