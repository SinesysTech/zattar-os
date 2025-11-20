/**
 * Arquivo: timeline/baixar-documento.ts
 * 
 * PROPÓSITO:
 * Baixa o conteúdo binário (PDF) de um documento do processo.
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório) - Instância da página do navegador autenticada no PJE
 * - processoId: string (obrigatório) - ID do processo no sistema PJE
 * - documentoId: string (obrigatório) - ID do documento
 * - options: BaixarDocumentoOptions (opcional) - Opções de download
 * 
 * RETORNO:
 * Promise<Buffer> - Conteúdo binário do documento (PDF)
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/processos/id/{processoId}/documentos/id/{documentoId}/conteudo
 * 
 * EXEMPLO DE USO:
 * const pdfBuffer = await baixarDocumento(page, '2887163', '222702194', {
 *   incluirCapa: false,
 *   incluirAssinatura: true,
 *   grau: 1
 * });
 * await writeFile('documento.pdf', pdfBuffer);
 */

import type { Page } from 'playwright';
import type { BaixarDocumentoOptions } from '@/backend/types/pje-trt/timeline';

/**
 * Função: baixarDocumento
 * 
 * Baixa o conteúdo binário (PDF) de um documento do processo.
 */
export async function baixarDocumento(
  page: Page,
  processoId: string,
  documentoId: string,
  options: BaixarDocumentoOptions = {}
): Promise<Buffer> {
  const {
    incluirCapa = false,
    incluirAssinatura = true,
    grau = 1,
  } = options;

  const params = {
    incluirCapa,
    incluirAssinatura,
    grau,
  };

  console.log('📥 [baixarDocumento] Preparando download:', {
    processoId,
    documentoId,
    params,
  });

  try {
    // Obter URL base do contexto da página
    const baseUrl = await page.evaluate(() => window.location.origin);
    
    // Construir URL completa
    const endpoint = `/pje-comum-api/api/processos/id/${processoId}/documentos/id/${documentoId}/conteudo`;
    const queryParams = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    );
    const fullUrl = `${baseUrl}${endpoint}?${queryParams.toString()}`;

    console.log('🌐 [baixarDocumento] URL:', fullUrl);

    // Fazer requisição e obter binário
    const pdfBytes = await page.evaluate(async (url) => {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Incluir cookies de autenticação
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Obter como ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();
      
      // Converter para array de bytes
      return Array.from(new Uint8Array(arrayBuffer));
    }, fullUrl);

    const buffer = Buffer.from(pdfBytes);

    // Verificar se é PDF válido
    const isPDF = buffer.toString('utf8', 0, 4) === '%PDF';
    if (!isPDF) {
      throw new Error('Conteúdo retornado não é um PDF válido');
    }

    console.log('✅ [baixarDocumento] Download concluído', {
      tamanho: buffer.length,
      tamanhoKB: (buffer.length / 1024).toFixed(2),
    });

    return buffer;
  } catch (error) {
    console.error('❌ [baixarDocumento] Erro no download:', error);
    throw error;
  }
}
