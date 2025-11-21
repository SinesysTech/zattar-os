/**
 * Serviço de Storage para Backblaze B2
 * 
 * Implementa IStorageService usando Backblaze B2 como backend de armazenamento.
 * Utiliza AWS SDK v3 para compatibilidade com a API S3 do Backblaze.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import {
  IStorageService,
  UploadResult,
  DeleteResult,
  GetUrlResult,
} from './storage.interface';

export class BackblazeB2StorageService implements IStorageService {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor() {
    const endpoint = process.env.B2_ENDPOINT;
    const region = process.env.B2_REGION;
    const keyId = process.env.B2_KEY_ID;
    const applicationKey = process.env.B2_APPLICATION_KEY;
    const bucket = process.env.B2_BUCKET;

    if (!endpoint || !region || !keyId || !applicationKey || !bucket) {
      throw new Error(
        'Configuração do Backblaze B2 incompleta. Verifique as variáveis de ambiente: ' +
        'B2_ENDPOINT, B2_REGION, B2_BUCKET, B2_KEY_ID, B2_APPLICATION_KEY'
      );
    }

    this.endpoint = endpoint;
    this.bucket = bucket;

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: applicationKey,
      },
    });

    console.log(`��� [Backblaze B2] Storage service inicializado com bucket: ${this.bucket}`);
  }

  /**
   * Faz upload de arquivo para o Backblaze B2
   */
  async upload(
    file: Buffer | ReadableStream,
    path: string,
    contentType: string
  ): Promise<UploadResult> {
    try {
      // Converter ReadableStream para Buffer se necessário
      let fileBuffer: Buffer;
      if (file instanceof ReadableStream) {
        const reader = file.getReader();
        const chunks: Uint8Array[] = [];
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          if (value) chunks.push(value);
          done = streamDone;
        }

        fileBuffer = Buffer.concat(chunks);
      } else {
        fileBuffer = file;
      }

      console.log(`��� [Backblaze B2] Iniciando upload: ${path}`);
      console.log(`   Tamanho: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
      console.log(`   Content-Type: ${contentType}`);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.client.send(command);

      // Construir URL pública do arquivo
      const url = `${this.endpoint}/${this.bucket}/${path}`;

      console.log(`✅ [Backblaze B2] Upload concluído: ${url}`);

      return {
        success: true,
        path,
        url,
        fileId: path, // No Backblaze B2, usamos o path como identificador
      };
    } catch (error) {
      console.error(`❌ [Backblaze B2] Erro ao fazer upload: ${path}`, error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao fazer upload',
      };
    }
  }

  /**
   * Deleta arquivo do Backblaze B2
   */
  async delete(path: string): Promise<DeleteResult> {
    try {
      console.log(`���️ [Backblaze B2] Deletando arquivo: ${path}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.client.send(command);

      console.log(`✅ [Backblaze B2] Arquivo deletado: ${path}`);

      return {
        success: true,
      };
    } catch (error) {
      console.error(`❌ [Backblaze B2] Erro ao deletar: ${path}`, error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao deletar arquivo',
      };
    }
  }

  /**
   * Obtém URL do arquivo
   * 
   * No Backblaze B2, as URLs são públicas por padrão se o bucket tiver acesso público.
   * Para buckets privados, seria necessário gerar URLs assinadas.
   */
  async getUrl(path: string, expiresIn?: number): Promise<GetUrlResult> {
    try {
      // Construir URL pública
      const url = `${this.endpoint}/${this.bucket}/${path}`;

      console.log(`��� [Backblaze B2] URL gerada: ${url}`);

      return {
        success: true,
        url,
        // Backblaze B2 public URLs não expiram
        // Para URLs assinadas, seria necessário implementar getSignedUrl
        expiresAt: undefined,
      };
    } catch (error) {
      console.error(`❌ [Backblaze B2] Erro ao obter URL: ${path}`, error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao obter URL',
      };
    }
  }

  /**
   * Verifica se arquivo existe
   */
  async exists(path: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.client.send(command);

      console.log(`✅ [Backblaze B2] Arquivo existe: ${path}`);
      return true;
    } catch (error: any) {
      // Se o erro for 404 (NoSuchKey), o arquivo não existe
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        console.log(`ℹ️ [Backblaze B2] Arquivo não existe: ${path}`);
        return false;
      }

      // Outros erros são propagados como false
      console.error(`❌ [Backblaze B2] Erro ao verificar existência: ${path}`, error);
      return false;
    }
  }
}
