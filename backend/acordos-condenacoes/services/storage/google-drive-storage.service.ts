/**
 * Serviço de Storage para Google Drive via n8n webhook
 *
 * Este serviço faz upload de arquivos enviando para um webhook do n8n,
 * que por sua vez processa e armazena os arquivos no Google Drive.
 *
 * Todas as operações usam POST com body JSON contendo o campo "operation".
 */

import {
  IStorageService,
  UploadResult,
  DeleteResult,
  GetUrlResult,
} from './storage.interface';

interface WebhookResponse {
  path?: string;
  url?: string;
  fileId?: string;
  id?: string;
  expiresAt?: string;
  exists?: boolean;
}

export class GoogleDriveStorageService implements IStorageService {
  private webhookUrl: string;
  private webhookToken?: string;

  constructor() {
    this.webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL || '';
    this.webhookToken = process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN || '';

    if (!this.webhookUrl) {
      throw new Error('GOOGLE_DRIVE_WEBHOOK_URL não está configurada');
    }
  }

  /**
   * Faz requisição POST para o webhook com a operação especificada
   */
  private async callWebhook(body: Record<string, unknown>): Promise<WebhookResponse> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.webhookToken) {
      headers['Authorization'] = `Bearer ${this.webhookToken}`;
    }

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro na requisição ao webhook: ${response.status} - ${errorText}`
      );
    }

    return await response.json();
  }

  /**
   * Faz upload de arquivo enviando para o webhook do n8n
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

      // Converter arquivo para base64
      const fileBase64 = fileBuffer.toString('base64');
      const fileName = path.split('/').pop() || 'file';

      // Enviar para webhook com operação "upload"
      const result = await this.callWebhook({
        operation: 'upload',
        path,
        fileName,
        fileContent: fileBase64,
        contentType,
      });

      return {
        success: true,
        path: result.path || path,
        url: result.url || '',
        fileId: result.fileId || result.id,
      };
    } catch (error) {
      console.error('Erro no upload para Google Drive via n8n:', error);
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
   * Deleta arquivo enviando requisição para o webhook do n8n
   */
  async delete(path: string): Promise<DeleteResult> {
    try {
      await this.callWebhook({
        operation: 'delete',
        path,
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('Erro ao deletar arquivo do Google Drive via n8n:', error);
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
   * Obtém URL do arquivo via webhook do n8n
   */
  async getUrl(path: string, expiresIn?: number): Promise<GetUrlResult> {
    try {
      const result = await this.callWebhook({
        operation: 'get-url',
        path,
        expiresIn,
      });

      return {
        success: true,
        url: result.url,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      console.error('Erro ao obter URL do Google Drive via n8n:', error);
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
   * Verifica se arquivo existe via webhook do n8n
   */
  async exists(path: string): Promise<boolean> {
    try {
      const result = await this.callWebhook({
        operation: 'exists',
        path,
      });

      return result.exists === true;
    } catch (error) {
      console.error('Erro ao verificar existência no Google Drive via n8n:', error);
      return false;
    }
  }
}
