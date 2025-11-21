/**
 * Serviço de Upload para Backblaze B2
 * 
 * Responsável por fazer upload de arquivos para o Backblaze B2 usando a API S3-Compatible.
 * Utiliza AWS SDK v3 para compatibilidade com a API S3 do Backblaze.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

/**
 * Parâmetros para upload de arquivo no Backblaze B2
 */
export interface BackblazeUploadParams {
    /** Buffer do arquivo a ser enviado */
    buffer: Buffer;
    /** Caminho completo do arquivo no bucket (ex: processos/0010702-80.2025.5.03.0111/timeline/doc_123.pdf) */
    key: string;
    /** MIME type do arquivo (ex: application/pdf) */
    contentType: string;
}

/**
 * Resultado do upload no Backblaze B2
 */
export interface BackblazeUploadResult {
    /** URL pública do arquivo (formato: https://endpoint/bucket/key) */
    url: string;
    /** Chave (path) do arquivo no bucket */
    key: string;
    /** Nome do bucket */
    bucket: string;
    /** Data/hora do upload */
    uploadedAt: Date;
}

/**
 * Cliente S3 singleton para Backblaze B2
 */
let s3Client: S3Client | null = null;

/**
 * Obtém ou cria o cliente S3 para Backblaze B2
 */
function getS3Client(): S3Client {
    if (!s3Client) {
        const endpoint = process.env.B2_ENDPOINT;
        const region = process.env.B2_REGION;
        const keyId = process.env.B2_KEY_ID;
        const applicationKey = process.env.B2_APPLICATION_KEY;

        if (!endpoint || !region || !keyId || !applicationKey) {
            throw new Error(
                'Configuração do Backblaze B2 incompleta. Verifique as variáveis de ambiente: ' +
                'B2_ENDPOINT, B2_REGION, B2_KEY_ID, B2_APPLICATION_KEY'
            );
        }

        s3Client = new S3Client({
            endpoint,
            region,
            credentials: {
                accessKeyId: keyId,
                secretAccessKey: applicationKey,
            },
        });
    }

    return s3Client;
}

/**
 * Faz upload de um arquivo para o Backblaze B2
 * 
 * @param params - Parâmetros do upload (buffer, key, contentType)
 * @returns Resultado com URL e metadados do arquivo
 */
export async function uploadToBackblaze(
    params: BackblazeUploadParams
): Promise<BackblazeUploadResult> {
    const { buffer, key, contentType } = params;

    console.log(`📤 [Backblaze] Iniciando upload: ${key}`);
    console.log(`   Tamanho: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log(`   Content-Type: ${contentType}`);

    const bucket = process.env.B2_BUCKET;
    if (!bucket) {
        throw new Error('B2_BUCKET não configurado nas variáveis de ambiente');
    }

    const client = getS3Client();

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    try {
        await client.send(command);

        // Construir URL pública do arquivo
        const endpoint = process.env.B2_ENDPOINT!;
        const url = `${endpoint}/${bucket}/${key}`;

        console.log(`✅ [Backblaze] Upload concluído: ${url}`);

        return {
            url,
            key,
            bucket,
            uploadedAt: new Date(),
        };
    } catch (error) {
        console.error(`❌ [Backblaze] Erro ao fazer upload: ${key}`, error);
        throw new Error(
            `Falha ao fazer upload para Backblaze B2: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Deleta um arquivo do Backblaze B2
 * 
 * @param key - Chave (path) do arquivo no bucket
 */
export async function deleteFromBackblaze(key: string): Promise<void> {
    console.log(`🗑️ [Backblaze] Deletando arquivo: ${key}`);

    const bucket = process.env.B2_BUCKET;
    if (!bucket) {
        throw new Error('B2_BUCKET não configurado nas variáveis de ambiente');
    }

    const client = getS3Client();

    const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    try {
        await client.send(command);
        console.log(`✅ [Backblaze] Arquivo deletado: ${key}`);
    } catch (error) {
        console.error(`❌ [Backblaze] Erro ao deletar: ${key}`, error);
        throw new Error(
            `Falha ao deletar arquivo do Backblaze B2: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
