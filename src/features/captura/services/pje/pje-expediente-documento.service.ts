/**
 * Arquivo: pje-expediente-documento.service.ts
 *
 * PROPÓSITO:
 * Serviço especializado para buscar documentos PDF de expedientes pendentes do PJE-TRT.
 * Orquestra o processo completo: fetch do PJE → upload Backblaze B2 → persistência no banco.
 *
 * IMPORTANTE:
 * Este serviço é específico para documentos de PENDENTES DE MANIFESTAÇÃO.
 * Futuramente teremos serviços similares para outros domínios PJE (cartas de audiência, processos completos, etc.).
 *
 * DEPENDÊNCIAS:
 * - playwright: Para executar fetch no contexto do navegador com cookies
 * - documento-types.ts: Tipos TypeScript para documentos PJE
 * - backblaze-b2: Serviço de upload para Backblaze B2
 * - file-naming.utils: Utilitários para nomeação de arquivos
 * - pendentes-persistence: Para atualizar informações de arquivo no banco
 *
 * EXPORTAÇÕES:
 * - fetchDocumentoMetadata(): Busca metadados do documento (nome, mimetype, tamanho)
 * - fetchDocumentoConteudo(): Busca conteúdo do documento (PDF em base64)
 * - downloadAndUploadDocumento(): Orquestração completa do processo
 *
 * QUEM USA ESTE ARQUIVO:
 * - app/api/pje/pendente-manifestacao/documento/route.ts: Endpoint REST standalone
 * - pendentes-manifestacao.service.ts: Integração com scraper automático
 */

import type { Page } from 'playwright';
import type {
  DocumentoMetadata,
  DocumentoConteudo,
  FetchDocumentoParams,
  FetchDocumentoResult,
  ArquivoInfo,
} from '@/backend/types/pje-trt/documento-types';
import { uploadToBackblaze } from '@/backend/storage/backblaze-b2.service';
import { gerarCaminhoCompletoPendente } from '@/backend/storage/file-naming.utils';
import { atualizarDocumentoPendente } from '@/backend/captura/services/persistence/pendentes-persistence.service';

/**
 * Função: fetchDocumentoMetadata
 *
 * PROPÓSITO:
 * Busca metadados de um documento específico do PJE.
 * Usado para validar tipo do documento antes de fazer download completo.
 *
 * ENDPOINT PJE:
 * GET /pje-comum-api/api/processos/id/{processoId}/documentos/id/{documentoId}
 *
 * PARÂMETROS:
 * - page: Instância do Playwright com cookies de autenticação
 * - processoId: ID do processo no PJE
 * - documentoId: ID do documento/expediente no PJE
 *
 * RETORNO:
 * Promise<DocumentoMetadata> - Metadados do documento
 *
 * EXEMPLO DE RETORNO:
 * {
 *   id: 123456,
 *   nome: "sentenca.pdf",
 *   mimetype: "application/pdf",
 *   tamanho: 1024000,
 *   dataHora: "2025-01-19T12:00:00Z"
 * }
 */
export async function fetchDocumentoMetadata(
  page: Page,
  processoId: string,
  documentoId: string
): Promise<DocumentoMetadata> {
  const baseUrl = await page.evaluate(() => window.location.origin);
  const url = `${baseUrl}/pje-comum-api/api/processos/id/${processoId}/documentos/id/${documentoId}?incluirAssinatura=false&incluirAnexos=false`;

  console.log(`📄 Buscando metadados do documento: ${documentoId} do processo: ${processoId}`);

  const response = await page.evaluate(async ({ url }: { url: string }) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('DEBUG - Response JSON:', JSON.stringify(data));
    return data;
  }, { url });

  console.log(`✅ Metadados obtidos: ${response.nomeArquivo} (${response.tipoArquivo})`);
  return response as DocumentoMetadata;
}

/**
 * Função: fetchDocumentoConteudo
 *
 * PROPÓSITO:
 * Busca o conteúdo completo de um documento (PDF em base64) do PJE.
 *
 * ENDPOINT PJE:
 * GET /pje-comum-api/api/processos/id/{processoId}/documentos/id/{documentoId}/conteudo
 *
 * PARÂMETROS:
 * - page: Instância do Playwright com cookies de autenticação
 * - processoId: ID do processo no PJE
 * - documentoId: ID do documento/expediente no PJE
 *
 * RETORNO:
 * Promise<DocumentoConteudo> - Conteúdo do documento em base64
 *
 * EXEMPLO DE RETORNO:
 * {
 *   documento: "JVBERi0xLjQKJeLjz9MK...",
 *   mimetype: "application/pdf"
 * }
 */
export async function fetchDocumentoConteudo(
  page: Page,
  processoId: string,
  documentoId: string
): Promise<DocumentoConteudo> {
  const baseUrl = await page.evaluate(() => window.location.origin);
  const url = `${baseUrl}/pje-comum-api/api/processos/id/${processoId}/documentos/id/${documentoId}/conteudo?incluirCapa=false&incluirAssinatura=true`;

  console.log(`📥 Baixando conteúdo do documento: ${documentoId}`);

  const response = await page.evaluate(async ({ url }: { url: string }) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/pdf',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // O endpoint retorna PDF direto, precisamos converter para base64
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Converter para base64
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return {
      documento: base64,
      mimetype: 'application/pdf'
    };
  }, { url });

  console.log(`✅ Conteúdo obtido (${response.documento.length} caracteres base64)`);
  return response as DocumentoConteudo;
}

/**
 * Função: downloadAndUploadDocumento
 *
 * PROPÓSITO:
 * Orquestra o processo completo de captura de documento:
 * 1. Busca metadados do PJE
 * 2. Valida que é PDF
 * 3. Busca conteúdo (base64)
 * 4. Converte para Buffer
 * 5. Faz upload para Backblaze B2
 * 6. Atualiza banco de dados
 *
 * PARÂMETROS:
 * - page: Instância do Playwright com cookies de autenticação
 * - params: FetchDocumentoParams contendo processoId, documentoId, expedienteId, numeroProcesso, trt, grau
 *
 * RETORNO:
 * Promise<FetchDocumentoResult> - Resultado da operação com success e arquivoInfo ou error
 *
 * EXEMPLO DE USO:
 * const result = await downloadAndUploadDocumento(page, {
 *   processoId: "12345678",
 *   documentoId: "87654321",
 *   expedienteId: 999,
 *   numeroProcesso: "0010702-80.2025.5.03.0111",
 *   trt: "TRT3",
 *   grau: "1"
 * });
 *
 * EXEMPLO DE SUCESSO:
 * {
 *   success: true,
 *   expedienteId: 999,
 *   arquivoInfo: {
 *     arquivo_nome: "exp_789_doc_234517663_20251121.pdf",
 *     arquivo_url: "https://s3.us-east-005.backblazeb2.com/zattar-advogados/processos/.../exp_789_doc_234517663_20251121.pdf",
 *     arquivo_key: "processos/0010702-80.2025.5.03.0111/pendente_manifestacao/exp_789_doc_234517663_20251121.pdf",
 *     arquivo_bucket: "zattar-advogados"
 *   }
 * }
 *
 * EXEMPLO DE ERRO:
 * {
 *   success: false,
 *   expedienteId: 999,
 *   error: "Documento não é um PDF válido"
 * }
 */
export async function downloadAndUploadDocumento(
  page: Page,
  params: FetchDocumentoParams
): Promise<FetchDocumentoResult> {
  const { processoId, documentoId, expedienteId, numeroProcesso } = params;

  try {
    console.log(`\n🚀 Iniciando captura de documento para pendente ${expedienteId}`);

    // 1. Buscar metadados
    const metadata = await fetchDocumentoMetadata(page, processoId, documentoId);

    // 2. Validar que é PDF
    if (metadata.tipoArquivo !== 'PDF') {
      throw new Error(
        `Documento não é um PDF válido. Tipo: ${metadata.tipoArquivo}`
      );
    }

    // 3. Buscar conteúdo (base64)
    const conteudo = await fetchDocumentoConteudo(page, processoId, documentoId);

    // 4. Converter base64 para Buffer
    const buffer = Buffer.from(conteudo.documento, 'base64');
    console.log(`📦 Buffer criado: ${buffer.length} bytes`);

    // 5. Gerar caminho e nome do arquivo no Backblaze
    const key = gerarCaminhoCompletoPendente(numeroProcesso, expedienteId, documentoId);
    const nomeArquivo = key.split('/').pop()!; // Extrair nome do arquivo do path

    console.log(`📂 Caminho no Backblaze: ${key}`);
    console.log(`📝 Nome do arquivo: ${nomeArquivo}`);

    // 6. Fazer upload para Backblaze B2
    const uploadResult = await uploadToBackblaze({
      buffer,
      key,
      contentType: 'application/pdf',
    });

    console.log(`✅ Upload concluído no Backblaze B2`);
    console.log(`URL: ${uploadResult.url}`);
    console.log(`Key: ${uploadResult.key}`);
    console.log(`Bucket: ${uploadResult.bucket}`);

    // 7. Preparar informações do arquivo
    const arquivoInfo: ArquivoInfo = {
      arquivo_nome: nomeArquivo,
      arquivo_url: uploadResult.url,
      arquivo_key: uploadResult.key,
      arquivo_bucket: uploadResult.bucket,
    };

    // 8. Atualizar banco de dados
    console.log(`💾 Atualizando banco de dados: pendente ${expedienteId}`);
    await atualizarDocumentoPendente(expedienteId, arquivoInfo);

    console.log(`🎉 Documento capturado com sucesso para pendente ${expedienteId}\n`);

    return {
      success: true,
      expedienteId,
      arquivoInfo,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido';

    console.error(
      `❌ Erro ao capturar documento para pendente ${expedienteId}:`,
      errorMessage
    );

    return {
      success: false,
      expedienteId,
      error: errorMessage,
    };
  }
}
