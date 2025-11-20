/**
 * Serviço genérico para upload de documentos PDF para Google Drive via n8n webhook
 * 
 * Reutiliza a infraestrutura existente de Google Drive configurada para pendentes de manifestação.
 */

/**
 * Informações do arquivo após upload no Google Drive
 */
export interface GoogleDriveUploadResult {
  /** Nome do arquivo no Google Drive */
  fileName: string;
  /** Link de visualização */
  linkVisualizacao: string;
  /** Link de download */
  linkDownload: string;
  /** ID do arquivo no Google Drive */
  fileId: string;
}

/**
 * Parâmetros para upload de documento
 */
export interface UploadDocumentoParams {
  /** Buffer do PDF */
  pdfBuffer: Buffer;
  /** Nome base do arquivo (será adicionado timestamp) */
  nomeBase: string;
  /** Processo relacionado */
  processoId: string;
  /** TRT código */
  trtCodigo: string;
  /** Tipo de documento (ex: 'timeline', 'pendente', 'audiencia') */
  tipoDocumento: string;
}

/**
 * Faz upload de um documento PDF para o Google Drive via webhook n8n
 */
export async function uploadDocumentoToGoogleDrive(
  params: UploadDocumentoParams
): Promise<GoogleDriveUploadResult> {
  const {
    pdfBuffer,
    nomeBase,
    processoId,
    trtCodigo,
    tipoDocumento,
  } = params;

  // 1. Validar variável de ambiente
  const webhookUrl = process.env.PJE_PENDENTE_DOCUMENTO_N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('PJE_PENDENTE_DOCUMENTO_N8N_WEBHOOK_URL não configurada no .env');
  }

  // 2. Preparar nome do arquivo com timestamp
  const timestamp = Date.now();
  const fileName = `${nomeBase}_${timestamp}.pdf`;

  // 3. Converter PDF para base64
  const pdfBase64 = pdfBuffer.toString('base64');

  // 4. Preparar payload para n8n
  const payload = {
    operation: 'upload',
    domain: tipoDocumento,
    data: {
      numeroProcesso: processoId,
      trt: trtCodigo,
      fileName,
      fileContent: pdfBase64,
      contentType: 'application/pdf',
    },
  };

  console.log(`📤 [GoogleDrive] Enviando para n8n webhook: ${webhookUrl}`);
  console.log(`📄 [GoogleDrive] Arquivo: ${fileName} (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);

  // 5. Fazer upload via webhook n8n
  const webhookResponse = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!webhookResponse.ok) {
    const errorText = await webhookResponse.text();
    throw new Error(
      `Erro no webhook n8n: ${webhookResponse.status} - ${errorText}`
    );
  }

  const webhookResult = await webhookResponse.json();

  console.log(`✅ [GoogleDrive] Upload concluído`);
  console.log(`📁 [GoogleDrive] File ID: ${webhookResult.file_id || webhookResult.fileId}`);

  // 6. Retornar informações do arquivo
  return {
    fileName: webhookResult.file_name || fileName,
    linkVisualizacao: webhookResult.web_view_link || webhookResult.url || '',
    linkDownload: webhookResult.web_content_link || '',
    fileId: webhookResult.file_id || webhookResult.fileId || '',
  };
}
