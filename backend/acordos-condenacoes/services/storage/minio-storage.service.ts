// Implementação de storage usando Minio
// Compatível com S3 API

import type {
  IStorageService,
  UploadResult,
  DeleteResult,
  GetUrlResult,
  StorageConfig,
} from './storage.interface';

interface MinioClient {
  bucketExists(bucket: string): Promise<boolean>;
  makeBucket(bucket: string, region: string): Promise<void>;
  putObject(bucket: string, path: string, file: Buffer | ReadableStream, ...args: (number | Record<string, string>)[]): Promise<void>;
  presignedGetObject(bucket: string, path: string, expires: number): Promise<string>;
  removeObject(bucket: string, path: string): Promise<void>;
  statObject(bucket: string, path: string): Promise<void>;
}

/**
 * Serviço de storage usando Minio
 *
 * Variáveis de ambiente necessárias:
 * - STORAGE_ENDPOINT: URL do servidor Minio (ex: "localhost")
 * - STORAGE_PORT: Porta do servidor (ex: "9000")
 * - STORAGE_BUCKET: Nome do bucket
 * - STORAGE_ACCESS_KEY: Access key
 * - STORAGE_SECRET_KEY: Secret key
 * - STORAGE_USE_SSL: "true" ou "false" (padrão: "false")
 */
export class MinioStorageService implements IStorageService {
  private client: MinioClient | undefined; // MinioClient será tipado quando biblioteca for instalada
  private bucket: string;
  private config: StorageConfig;

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      provider: 'minio',
      endpoint: config?.endpoint || process.env.STORAGE_ENDPOINT || 'localhost',
      port: config?.port || parseInt(process.env.STORAGE_PORT || '9000'),
      bucket: config?.bucket || process.env.STORAGE_BUCKET || 'acordos-condenacoes',
      accessKey: config?.accessKey || process.env.STORAGE_ACCESS_KEY || '',
      secretKey: config?.secretKey || process.env.STORAGE_SECRET_KEY || '',
      useSSL: config?.useSSL !== undefined
        ? config.useSSL
        : process.env.STORAGE_USE_SSL === 'true',
    };

    if (!this.config.accessKey || !this.config.secretKey) {
      console.warn('⚠️ Storage credentials não configuradas. Uploads não funcionarão.');
    }

    this.bucket = this.config.bucket;

    // Inicializar client Minio (quando biblioteca for instalada)
    this.initializeClient();
  }

  private initializeClient() {
    try {
      // TODO: Descomentar quando biblioteca minio for instalada
      // const Minio = require('minio');
      // this.client = new Minio.Client({
      //   endPoint: this.config.endpoint!,
      //   port: this.config.port,
      //   useSSL: this.config.useSSL,
      //   accessKey: this.config.accessKey,
      //   secretKey: this.config.secretKey,
      // });
      console.log('✅ MinioStorageService initialized (mock mode)');
    } catch (error) {
      console.error('❌ Erro ao inicializar Minio client:', error);
    }
  }

  async upload(
    file: Buffer | ReadableStream,
    path: string,
    contentType: string
  ): Promise<UploadResult> {
    try {
      if (!this.client) {
        return {
          success: false,
          error: 'Minio client não inicializado. Instale a biblioteca "minio".',
        };
      }

      // Garantir que bucket existe
      const bucketExists = await this.client.bucketExists(this.bucket);
      if (!bucketExists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
      }

      // Upload do arquivo
      const metadata = {
        'Content-Type': contentType,
      };

      if (file instanceof Buffer) {
        await this.client.putObject(this.bucket, path, file, file.length, metadata);
      } else {
        // Para ReadableStream
        await this.client.putObject(this.bucket, path, file, metadata);
      }

      // Obter URL
      const url = await this.client.presignedGetObject(this.bucket, path, 24 * 60 * 60);

      console.log(`✅ Arquivo enviado para Minio: ${path}`);

      return {
        success: true,
        path,
        url,
      };
    } catch (error) {
      const erroMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Erro ao fazer upload no Minio:', error);
      return {
        success: false,
        error: `Erro ao fazer upload: ${erroMsg}`,
      };
    }
  }

  async delete(path: string): Promise<DeleteResult> {
    try {
      if (!this.client) {
        return {
          success: false,
          error: 'Minio client não inicializado.',
        };
      }

      await this.client.removeObject(this.bucket, path);

      console.log(`✅ Arquivo deletado do Minio: ${path}`);

      return { success: true };
    } catch (error) {
      const erroMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Erro ao deletar do Minio:', error);
      return {
        success: false,
        error: `Erro ao deletar: ${erroMsg}`,
      };
    }
  }

  async getUrl(path: string, expiresIn: number = 3600): Promise<GetUrlResult> {
    try {
      if (!this.client) {
        return {
          success: false,
          error: 'Minio client não inicializado.',
        };
      }

      // Gerar URL assinada com tempo de expiração
      const url = await this.client.presignedGetObject(this.bucket, path, expiresIn);

      return {
        success: true,
        url,
      };
    } catch (error) {
      const erroMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Erro ao obter URL do Minio:', error);
      return {
        success: false,
        error: `Erro ao obter URL: ${erroMsg}`,
      };
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      await this.client.statObject(this.bucket, path);
      return true;
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'NotFound') {
        return false;
      }
      console.error('❌ Erro ao verificar existência do arquivo:', error);
      return false;
    }
  }
}
