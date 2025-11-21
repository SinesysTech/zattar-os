/**
 * Servi√ßo de Storage para Backblaze B2
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
        'Configura√ß√£o do Backblaze B2 incompleta. Verifique as vari√°veis de ambiente: ' +
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

    console.log(`Ì≥¶ [Backblaze B2] Storage service inicializado com bucket: ${this.bucket}`);
  }

  async upload(
    file: Buffer | ReadableStream,
    path: string,
    contentType: string
  ): Promise<UploadResult> {
    try {
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

      console.log(`ÔøΩÔøΩ [Backblaze B2] Iniciando upload: ${path}`);
      console.log(`   Tamanho: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.client.send(command);

      const url = `${this.endpoint}/${this.bucket}/${path}`;

      console.log(`‚úÖ [Backblaze B2] Upload conclu√≠do: ${url}`);

      return {
        success: true,
        path,
        url,
        fileId: path,
      };
    } catch (error) {
      console.error(`‚ùå [Backblaze B2] Erro ao fazer upload: ${path}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao fazer upload',
      };
    }
  }

  async delete(path: string): Promise<DeleteResult> {
    try {
      console.log(`Ì∑ëÔ∏è [Backblaze B2] Deletando arquivo: ${path}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.client.send(command);

      console.log(`‚úÖ [Backblaze B2] Arquivo deletado: ${path}`);

      return {
        success: true,
      };
    } catch (error) {
      console.error(`‚ùå [Backblaze B2] Erro ao deletar: ${path}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao deletar arquivo',
      };
    }
  }

  async getUrl(path: string, expiresIn?: number): Promise<GetUrlResult> {
    try {
      const url = `${this.endpoint}/${this.bucket}/${path}`;

      console.log(`Ì¥ó [Backblaze B2] URL gerada: ${url}`);

      return {
        success: true,
        url,
        expiresAt: undefined,
      };
    } catch (error) {
      console.error(`‚ùå [Backblaze B2] Erro ao obter URL: ${path}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao obter URL',
      };
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.client.send(command);

      console.log(`‚úÖ [Backblaze B2] Arquivo existe: ${path}`);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        console.log(`‚ÑπÔ∏è [Backblaze B2] Arquivo n√£o existe: ${path}`);
        return false;
      }

      console.error(`‚ùå [Backblaze B2] Erro ao verificar exist√™ncia: ${path}`, error);
      return false;
    }
  }
}
