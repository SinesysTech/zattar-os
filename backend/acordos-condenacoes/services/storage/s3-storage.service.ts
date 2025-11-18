// Implementação de storage usando AWS S3
// Compatível com S3-compatible services

import type {
  IStorageService,
  UploadResult,
  DeleteResult,
  GetUrlResult,
  StorageConfig,
} from './storage.interface';

/**
 * Serviço de storage usando AWS S3
 *
 * Variáveis de ambiente necessárias:
 * - STORAGE_BUCKET: Nome do bucket S3
 * - STORAGE_ACCESS_KEY: AWS Access Key ID
 * - STORAGE_SECRET_KEY: AWS Secret Access Key
 * - STORAGE_REGION: Região AWS (ex: "us-east-1")
 * - STORAGE_ENDPOINT: (Opcional) Endpoint customizado para S3-compatible services
 */
export class S3StorageService implements IStorageService {
  private client: any; // S3Client será tipado quando biblioteca for instalada
  private bucket: string;
  private config: StorageConfig;

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      provider: 's3',
      bucket: config?.bucket || process.env.STORAGE_BUCKET || 'acordos-condenacoes',
      accessKey: config?.accessKey || process.env.STORAGE_ACCESS_KEY || '',
      secretKey: config?.secretKey || process.env.STORAGE_SECRET_KEY || '',
      region: config?.region || process.env.STORAGE_REGION || 'us-east-1',
      endpoint: config?.endpoint || process.env.STORAGE_ENDPOINT, // Para S3-compatible services
    };

    if (!this.config.accessKey || !this.config.secretKey) {
      console.warn('⚠️ Storage credentials não configuradas. Uploads não funcionarão.');
    }

    this.bucket = this.config.bucket;

    // Inicializar client S3 (quando biblioteca for instalada)
    this.initializeClient();
  }

  private initializeClient() {
    try {
      // TODO: Descomentar quando biblioteca @aws-sdk/client-s3 for instalada
      // const { S3Client } = require('@aws-sdk/client-s3');
      // this.client = new S3Client({
      //   region: this.config.region,
      //   credentials: {
      //     accessKeyId: this.config.accessKey,
      //     secretAccessKey: this.config.secretKey,
      //   },
      //   endpoint: this.config.endpoint, // Para S3-compatible services
      // });
      console.log('✅ S3StorageService initialized (mock mode)');
    } catch (error) {
      console.error('❌ Erro ao inicializar S3 client:', error);
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
          error: 'S3 client não inicializado. Instale a biblioteca "@aws-sdk/client-s3".',
        };
      }

      // TODO: Descomentar quando biblioteca for instalada
      // const { PutObjectCommand } = require('@aws-sdk/client-s3');
      // const command = new PutObjectCommand({
      //   Bucket: this.bucket,
      //   Key: path,
      //   Body: file,
      //   ContentType: contentType,
      // });
      //
      // await this.client.send(command);

      // Construir URL do objeto
      const url = this.config.endpoint
        ? `${this.config.endpoint}/${this.bucket}/${path}`
        : `https://${this.bucket}.s3.${this.config.region}.amazonaws.com/${path}`;

      console.log(`✅ Arquivo enviado para S3: ${path}`);

      return {
        success: true,
        path,
        url,
      };
    } catch (error) {
      const erroMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Erro ao fazer upload no S3:', error);
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
          error: 'S3 client não inicializado.',
        };
      }

      // TODO: Descomentar quando biblioteca for instalada
      // const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      // const command = new DeleteObjectCommand({
      //   Bucket: this.bucket,
      //   Key: path,
      // });
      //
      // await this.client.send(command);

      console.log(`✅ Arquivo deletado do S3: ${path}`);

      return { success: true };
    } catch (error) {
      const erroMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Erro ao deletar do S3:', error);
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
          error: 'S3 client não inicializado.',
        };
      }

      // TODO: Descomentar quando biblioteca for instalada
      // const { GetObjectCommand } = require('@aws-sdk/client-s3');
      // const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      //
      // const command = new GetObjectCommand({
      //   Bucket: this.bucket,
      //   Key: path,
      // });
      //
      // const url = await getSignedUrl(this.client, command, { expiresIn });

      // Mock URL (remover quando biblioteca for instalada)
      const url = `https://${this.bucket}.s3.${this.config.region}.amazonaws.com/${path}`;

      return {
        success: true,
        url,
      };
    } catch (error) {
      const erroMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Erro ao obter URL do S3:', error);
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

      // TODO: Descomentar quando biblioteca for instalada
      // const { HeadObjectCommand } = require('@aws-sdk/client-s3');
      // const command = new HeadObjectCommand({
      //   Bucket: this.bucket,
      //   Key: path,
      // });
      //
      // await this.client.send(command);

      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      console.error('❌ Erro ao verificar existência do arquivo:', error);
      return false;
    }
  }
}
