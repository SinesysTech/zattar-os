// Interface para serviços de storage
// Define contrato para implementações de Minio, S3, AWS, etc.

/**
 * Resultado de upload
 */
export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

/**
 * Resultado de deleção
 */
export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Resultado de obtenção de URL
 */
export interface GetUrlResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Interface para serviços de storage
 */
export interface IStorageService {
  /**
   * Faz upload de um arquivo
   * @param file Buffer ou stream do arquivo
   * @param path Caminho no storage (ex: "repasses/123/456/declaracao_123456.pdf")
   * @param contentType MIME type do arquivo
   * @returns Resultado do upload com path e URL
   */
  upload(
    file: Buffer | ReadableStream,
    path: string,
    contentType: string
  ): Promise<UploadResult>;

  /**
   * Deleta um arquivo
   * @param path Caminho do arquivo no storage
   * @returns Resultado da deleção
   */
  delete(path: string): Promise<DeleteResult>;

  /**
   * Obtém URL do arquivo (assinada/temporária se provider suportar)
   * @param path Caminho do arquivo no storage
   * @param expiresIn Tempo de expiração em segundos (padrão: 3600)
   * @returns URL do arquivo
   */
  getUrl(path: string, expiresIn?: number): Promise<GetUrlResult>;

  /**
   * Verifica se arquivo existe
   * @param path Caminho do arquivo no storage
   * @returns true se arquivo existe
   */
  exists(path: string): Promise<boolean>;
}

/**
 * Provider de storage
 */
export type StorageProvider = 'minio' | 's3' | 'aws' | 'local';

/**
 * Configuração de storage
 */
export interface StorageConfig {
  provider: StorageProvider;
  endpoint?: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region?: string;
  useSSL?: boolean;
  port?: number;
}
