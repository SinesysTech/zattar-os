/**
 * Serviço de Upload de Documentos da Timeline para Backblaze B2
 * 
 * Responsável por fazer upload de PDFs capturados da timeline do PJE
 * para o Backblaze B2 com organização padronizada.
 */

import { uploadToBackblaze, type BackblazeUploadResult } from '@/lib/storage/backblaze-b2.service';
import { gerarCaminhoCompletoTimeline } from '@/lib/storage/file-naming.utils';

/**
 * Parâmetros para upload de documento da timeline
 */
export interface UploadDocumentoTimelineParams {
    /** Buffer do PDF */
    pdfBuffer: Buffer;
    /** Número do processo (ex: 0010702-80.2025.5.03.0111) */
    numeroProcesso: string;
    /** ID do documento no PJE */
    documentoId: string | number;
}

/**
 * Resultado do upload
 */
export interface UploadDocumentoTimelineResult {
    /** URL pública do arquivo */
    url: string;
    /** Chave (path) do arquivo no bucket */
    key: string;
    /** Nome do bucket */
    bucket: string;
    /** Nome do arquivo */
    fileName: string;
    /** Data/hora do upload */
    uploadedAt: Date;
}

/**
 * Faz upload de um documento da timeline para o Backblaze B2
 * 
 * @param params - Parâmetros do upload
 * @returns Resultado com URLs e metadados do arquivo
 */
export async function uploadDocumentoTimeline(
    params: UploadDocumentoTimelineParams
): Promise<UploadDocumentoTimelineResult> {
    const { pdfBuffer, numeroProcesso, documentoId } = params;

    console.log(`📤 [uploadDocumentoTimeline] Iniciando upload para Backblaze B2`, {
        numeroProcesso,
        documentoId,
        tamanho: `${(pdfBuffer.length / 1024).toFixed(2)} KB`,
    });

    // Gerar caminho completo no Storage
    // Formato: processos/{numeroProcesso}/timeline/doc_{documentoId}_{YYYYMMDD}.pdf
    const key = gerarCaminhoCompletoTimeline(numeroProcesso, documentoId);
    const fileName = key.split('/').pop() || `doc_${documentoId}.pdf`;

    // Upload para Backblaze B2
    const uploadResult: BackblazeUploadResult = await uploadToBackblaze({
        buffer: pdfBuffer,
        key,
        contentType: 'application/pdf',
    });

    console.log(`✅ [uploadDocumentoTimeline] Upload concluído`, {
        url: uploadResult.url,
        key: uploadResult.key,
    });

    return {
        url: uploadResult.url,
        key: uploadResult.key,
        bucket: uploadResult.bucket,
        fileName,
        uploadedAt: uploadResult.uploadedAt,
    };
}
