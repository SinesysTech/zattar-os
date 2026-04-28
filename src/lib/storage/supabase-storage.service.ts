/**
 * Serviço de Upload para Supabase Storage
 * 
 * Responsável por fazer upload de arquivos para o Supabase Storage.
 * Substitui o antigo serviço do Backblaze B2.
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import getLogger from '@/lib/logger';

const logger = getLogger({ service: 'SupabaseStorage' });

/**
 * Parâmetros para upload de arquivo no Supabase Storage
 */
export interface SupabaseUploadParams {
    /** Buffer do arquivo a ser enviado */
    buffer: Buffer;
    /** Caminho completo do arquivo no bucket (ex: processos/0010702-80.2025.5.03.0111/timeline/doc_123.pdf) */
    key: string;
    /** MIME type do arquivo (ex: application/pdf) */
    contentType: string;
    /** Nome do bucket (opcional, padrão: valor de SUPABASE_STORAGE_BUCKET ou 'zattar-advogados') */
    bucket?: string;
    /** Opções de cache e upsert */
    upsert?: boolean;
}

/**
 * Resultado do upload no Supabase Storage
 */
export interface SupabaseUploadResult {
    /** URL pública do arquivo */
    url: string;
    /** Chave (path) do arquivo no bucket */
    key: string;
    /** Nome do bucket */
    bucket: string;
    /** Data/hora do upload */
    uploadedAt: Date;
}

/**
 * Obtém o nome do bucket padrão
 */
function getDefaultBucket(): string {
    return process.env.SUPABASE_STORAGE_BUCKET || 'diegobarbosa-os';
}

/**
 * Faz upload de um arquivo para o Supabase Storage
 * 
 * @param params - Parâmetros do upload (buffer, key, contentType)
 * @returns Resultado com URL e metadados do arquivo
 */
export async function uploadToSupabase(
    params: SupabaseUploadParams
): Promise<SupabaseUploadResult> {
    const { buffer, key, contentType, upsert = true } = params;
    const bucket = params.bucket || getDefaultBucket();

    logger.info(`📤 [Supabase Storage] Iniciando upload: ${key}`, {
        bucket,
        size: `${(buffer.length / 1024).toFixed(2)} KB`,
        contentType,
    });

    const supabase = createServiceClient();

    // 1. Upload do arquivo
    const { error } = await supabase.storage
        .from(bucket)
        .upload(key, buffer, {
            contentType,
            upsert,
        });

    if (error) {
        logger.error(`❌ [Supabase Storage] Erro ao fazer upload: ${key}`, error);
        throw new Error(
            `Falha ao fazer upload para Supabase Storage: ${error.message}`
        );
    }

    // 2. Obter URL pública
    // Supabase Storage retorna URL: https://project.supabase.co/storage/v1/object/public/bucket/key
    const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(key);

    const url = publicUrlData.publicUrl;

    logger.info(`✅ [Supabase Storage] Upload concluído: ${url}`);

    return {
        url,
        key,
        bucket,
        uploadedAt: new Date(),
    };
}

/**
 * Deleta um arquivo do Supabase Storage
 * 
 * @param key - Chave (path) do arquivo no bucket
 * @param bucket - Nome do bucket (opcional)
 */
export async function deleteFromSupabase(
    key: string, 
    bucket?: string
): Promise<void> {
    const bucketName = bucket || getDefaultBucket();
    logger.info(`🗑️ [Supabase Storage] Deletando arquivo: ${key}`, { bucket: bucketName });

    const supabase = createServiceClient();

    const { error } = await supabase.storage
        .from(bucketName)
        .remove([key]);

    if (error) {
        logger.error(`❌ [Supabase Storage] Erro ao deletar: ${key}`, error);
        throw new Error(
            `Falha ao deletar arquivo do Supabase Storage: ${error.message}`
        );
    }

    logger.info(`✅ [Supabase Storage] Arquivo deletado: ${key}`);
}

/**
 * Gera uma URL assinada (presigned URL) para acesso temporário a um arquivo privado.
 * Útil se o bucket não for público.
 * 
 * @param key - Chave do arquivo
 * @param expiresIn - Tempo em segundos (padrão: 3600 = 1 hora)
 * @param bucket - Nome do bucket (opcional)
 */
export async function createPresignedUrl(
    key: string,
    expiresIn: number = 3600,
    bucket?: string
): Promise<string> {
    const bucketName = bucket || getDefaultBucket();
    logger.info(`🔐 [Supabase Storage] Gerando URL assinada: ${key}`, { bucket: bucketName, expiresIn });

    const supabase = createServiceClient();

    const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(key, expiresIn);

    if (error || !data) {
        logger.error(`❌ [Supabase Storage] Erro ao gerar URL assinada: ${key}`, error);
        throw new Error(
            `Falha ao gerar URL assinada: ${error?.message || 'Erro desconhecido'}`
        );
    }

    return data.signedUrl;
}

/**
 * Download de arquivo do Supabase Storage
 */
export async function downloadFromSupabase(
    key: string,
    bucket?: string
): Promise<ArrayBuffer> {
    const bucketName = bucket || getDefaultBucket();
    logger.info(`⬇️ [Supabase Storage] Baixando arquivo: ${key}`, { bucket: bucketName });

    const supabase = createServiceClient();

    const { data, error } = await supabase.storage
        .from(bucketName)
        .download(key);

    if (error || !data) {
        logger.error(`❌ [Supabase Storage] Erro ao baixar arquivo: ${key}`, error);
        throw new Error(
            `Falha ao baixar arquivo: ${error?.message || 'Erro desconhecido'}`
        );
    }

    return await data.arrayBuffer();
}
