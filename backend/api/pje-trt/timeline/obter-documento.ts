/**
 * Arquivo: timeline/obter-documento.ts
 * 
 * PROPÓSITO:
 * Obtém os detalhes completos de um documento específico do processo.
 * Retorna metadados, informações de assinatura e dados do binário.
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório) - Instância da página do navegador autenticada no PJE
 * - processoId: string (obrigatório) - ID do processo no sistema PJE
 * - documentoId: string (obrigatório) - ID do documento (campo 'id' da timeline)
 * - options: ObterDocumentoOptions (opcional) - Opções de busca
 * 
 * RETORNO:
 * Promise<DocumentoDetalhes> - Detalhes completos do documento
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/processos/id/{processoId}/documentos/id/{documentoId}
 * 
 * EXEMPLO DE USO:
 * const documento = await obterDocumento(page, '2887163', '222702194', {
 *   incluirAssinatura: true,
 *   incluirAnexos: false,
 *   grau: 1
 * });
 * console.log(`Documento: ${documento.titulo}`);
 * console.log(`Tamanho: ${documento.tamanho} bytes`);
 * console.log(`MD5: ${documento.md5}`);
 */

import type { Page } from 'playwright';
import { fetchPJEAPI } from '../shared/fetch';
import type { DocumentoDetalhes, ObterDocumentoOptions } from '@/lib/api/pje-trt/types';

/**
 * Função: obterDocumento
 * 
 * Obtém os detalhes completos de um documento específico do processo.
 */
export async function obterDocumento(
  page: Page,
  processoId: string,
  documentoId: string,
  options: ObterDocumentoOptions = {}
): Promise<DocumentoDetalhes> {
  const {
    incluirAssinatura = true,
    incluirAnexos = false,
    grau = 1,
  } = options;

  const params = {
    incluirAssinatura,
    incluirAnexos,
    grau,
  };

  console.log('🌐 [obterDocumento] Chamando API:', {
    endpoint: `/pje-comum-api/api/processos/id/${processoId}/documentos/id/${documentoId}`,
    params,
  });

  try {
    const resultado = await fetchPJEAPI<DocumentoDetalhes>(
      page,
      `/pje-comum-api/api/processos/id/${processoId}/documentos/id/${documentoId}`,
      params
    );

    console.log('✅ [obterDocumento] Documento recebido com sucesso', {
      id: resultado.id,
      titulo: resultado.titulo,
      tamanho: resultado.tamanho,
      assinado: resultado.assinado,
    });

    return resultado;
  } catch (error) {
    console.error('❌ [obterDocumento] Erro na chamada da API:', error);
    throw error;
  }
}
