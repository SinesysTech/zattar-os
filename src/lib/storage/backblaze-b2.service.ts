/**
 * Serviço de Upload para Backblaze B2
 * 
 * Responsável por fazer upload de arquivos para o Backblaze B2 usando a API S3-Compatible.
 * Utiliza AWS SDK v3 para compatibilidade com a API S3 do Backblaze.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
        // Support both naming conventions (BACKBLAZE_* priority, fallback to B2_*)
        const endpoint = process.env.BACKBLAZE_ENDPOINT || process.env.B2_ENDPOINT;
        const region = process.env.BACKBLAZE_REGION || process.env.B2_REGION;
        const keyId = process.env.BACKBLAZE_ACCESS_KEY_ID || process.env.B2_KEY_ID;
        const applicationKey = process.env.BACKBLAZE_SECRET_ACCESS_KEY || process.env.B2_APPLICATION_KEY;

        if (!endpoint || !region || !keyId || !applicationKey) {
            throw new Error(
                'Configuração do Backblaze B2 incompleta. Verifique as variáveis de ambiente: ' +
                'BACKBLAZE_ENDPOINT (ou B2_ENDPOINT), BACKBLAZE_REGION (ou B2_REGION), ' + 
                'BACKBLAZE_ACCESS_KEY_ID (ou B2_KEY_ID), BACKBLAZE_SECRET_ACCESS_KEY (ou B2_APPLICATION_KEY)'
            );
        }

        s3Client = new S3Client({
            endpoint: endpoint.startsWith('http') ? endpoint : `https://${endpoint}`,
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

    const bucket = process.env.BACKBLAZE_BUCKET_NAME || process.env.B2_BUCKET;
    if (!bucket) {
        throw new Error('BACKBLAZE_BUCKET_NAME (ou B2_BUCKET) não configurado nas variáveis de ambiente');
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
        const endpoint = process.env.BACKBLAZE_ENDPOINT || process.env.B2_ENDPOINT!;
        // Ensure endpoint doesn't have protocol for cleaner URL construction if desired, 
        // but typically S3 URL is https://<bucket>.<endpoint>/<key> OR <endpoint>/<bucket>/<key> depending on path style.
        // B2 supports S3 path style: https://s3.us-west-004.backblazeb2.com/bucket-name/key
        
        // Remove protocol if present for cleaner concatenation if needed, but endpoint var usually has it? 
        // Example in .env.example: https://s3.us-east-005.backblazeb2.com
        
        let url = '';
        if (endpoint.startsWith('http')) {
             url = `${endpoint}/${bucket}/${key}`;
        } else {
             url = `https://${endpoint}/${bucket}/${key}`;
        }

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

    const bucket = process.env.BACKBLAZE_BUCKET_NAME || process.env.B2_BUCKET;
    if (!bucket) {
        throw new Error('BACKBLAZE_BUCKET_NAME (ou B2_BUCKET) não configurado nas variáveis de ambiente');
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

/**
 * Gera uma URL assinada (presigned URL) para acesso temporário a um arquivo privado
 * 
 * Esta função permite que buckets privados compartilhem arquivos de forma segura
 * sem tornar o bucket público. A URL expira após o tempo especificado.
 * 
 * @param key - Chave (path) do arquivo no bucket
 * @param expiresIn - Tempo em segundos até a URL expirar (padrão: 3600 = 1 hora)
 * @returns URL assinada que permite acesso temporário ao arquivo
 */
export async function generatePresignedUrl(
    key: string,
    expiresIn: number = 3600
): Promise<string> {
    console.log(`🔐 [Backblaze] Gerando URL assinada: ${key}`);
    console.log(`   Expira em: ${expiresIn} segundos (${Math.floor(expiresIn / 60)} minutos)`);

    const bucket = process.env.BACKBLAZE_BUCKET_NAME || process.env.B2_BUCKET;
    if (!bucket) {
        throw new Error('BACKBLAZE_BUCKET_NAME (ou B2_BUCKET) não configurado nas variáveis de ambiente');
    }

    const client = getS3Client();

    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    try {
        const signedUrl = await getSignedUrl(client, command, { expiresIn });
        console.log(`✅ [Backblaze] URL assinada gerada com sucesso`);
        return signedUrl;
    } catch (error) {
        console.error(`❌ [Backblaze] Erro ao gerar URL assinada: ${key}`, error);
        throw new Error(
            `Falha ao gerar URL assinada: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}