/**
 * Repositório para acesso a dados de documentos
 * Encapsula as chamadas à API REST para desacoplar a camada de apresentação
 */

import type {
  DocumentoComUsuario,
  ConteudoDocumento,
  AutoSaveData,
  AtualizarDocumentoData,
} from './domain';

/**
 * Tipo de resposta padrão da API
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Carrega um documento pelo ID
 * @param documentoId - ID do documento
 * @returns Documento com informações do autor
 * @throws Error se a requisição falhar
 */
export async function carregarDocumento(
  documentoId: number
): Promise<DocumentoComUsuario> {
  const response = await fetch(`/api/documentos/${documentoId}`);
  const data: ApiResponse<DocumentoComUsuario> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erro ao carregar documento');
  }

  if (!data.data) {
    throw new Error('Documento não encontrado');
  }

  return data.data;
}

/**
 * Salva automaticamente o documento (auto-save)
 * @param autoSaveData - Dados para auto-save (ID, conteúdo, título)
 * @throws Error se a requisição falhar
 */
export async function salvarDocumentoAutomatico(
  autoSaveData: AutoSaveData
): Promise<void> {
  const response = await fetch(
    `/api/documentos/${autoSaveData.documento_id}/auto-save`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(autoSaveData),
    }
  );

  const data: ApiResponse<unknown> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erro ao salvar');
  }
}

/**
 * Salva manualmente o documento (atualização completa)
 * @param documentoId - ID do documento
 * @param dados - Dados para atualização (título, conteúdo, pasta)
 * @returns Documento atualizado
 * @throws Error se a requisição falhar
 */
export async function salvarDocumento(
  documentoId: number,
  dados: AtualizarDocumentoData
): Promise<DocumentoComUsuario> {
  const response = await fetch(`/api/documentos/${documentoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });

  const data: ApiResponse<DocumentoComUsuario> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erro ao salvar');
  }

  if (!data.data) {
    throw new Error('Erro ao processar resposta do servidor');
  }

  return data.data;
}
