/**
 * Arquivo: documento-types.ts
 *
 * PROPÓSITO:
 * Este arquivo contém todas as interfaces e tipos relacionados a documentos/expedientes do PJE-TRT.
 * Define estruturas para busca, download e upload de documentos PDF do sistema PJE.
 *
 * DEPENDÊNCIAS:
 * Nenhuma dependência externa. Este arquivo contém apenas definições de tipos TypeScript.
 *
 * EXPORTAÇÕES:
 * - DocumentoMetadata: Interface para metadados de documento retornados pela API do PJE
 * - DocumentoConteudo: Interface para conteúdo do documento (PDF em base64)
 * - FetchDocumentoParams: Parâmetros para buscar um documento específico
 * - FetchDocumentoResult: Resultado da operação de fetch + upload de documento
 * - ArquivoInfo: Informações do arquivo após upload no Google Drive
 *
 * QUEM USA ESTE ARQUIVO:
 * - pje-expediente-documento.service.ts: Serviço principal de captura de documentos
 * - pendentes-manifestacao.service.ts: Integração com scraper de pendentes
 * - pendentes-persistence.service.ts: Persistência de informações de arquivo
 * - app/api/pje/pendente-manifestacao/documento/route.ts: Endpoint REST
 */

/**
 * Interface: DocumentoMetadata
 *
 * PROPÓSITO:
 * Representa os metadados de um documento retornados pela API do PJE.
 * Obtido via GET /api/processos/id/{processoId}/documentos/id/{documentoId}
 *
 * CAMPOS:
 * - id: number - ID único do documento no PJE
 * - nomeArquivo: string - Nome do arquivo (geralmente inclui extensão)
 * - tipoArquivo: string - Tipo do arquivo (ex: "PDF")
 * - titulo: string - Título do documento
 * - tipo: string - Tipo de documento (ex: "Intimação")
 * - tamanho?: number - Tamanho do arquivo em bytes (opcional)
 * - criadoEm?: string - Data/hora de criação do documento (opcional)
 * - assinado?: boolean - Se o documento está assinado
 * - sigiloso?: boolean - Se o documento é sigiloso
 *
 * USO:
 * Usado para validar tipo do documento antes de fazer download completo.
 * Valida se tipoArquivo é "PDF" antes de prosseguir.
 *
 * EXEMPLO DE RESPOSTA DA API:
 * {
 *   "id": 234517663,
 *   "nomeArquivo": "1º Grau-234517663.pdf",
 *   "tipoArquivo": "PDF",
 *   "titulo": "Intimação",
 *   "tipo": "Intimação",
 *   "tamanho": 102795,
 *   "criadoEm": "2025-11-21T11:24:25.754387",
 *   "assinado": true,
 *   "sigiloso": false
 * }
 */
export interface DocumentoMetadata {
  id: number;
  nomeArquivo: string;
  tipoArquivo: string;
  titulo: string;
  tipo: string;
  tamanho?: number;
  criadoEm?: string;
  assinado?: boolean;
  sigiloso?: boolean;
}

/**
 * Interface: DocumentoConteudo
 *
 * PROPÓSITO:
 * Representa o conteúdo de um documento PDF retornado pela API do PJE.
 * Obtido via GET /api/processos/id/{processoId}/documentos/id/{documentoId}/conteudo
 *
 * CAMPOS:
 * - documento: string - Conteúdo do PDF codificado em base64
 * - mimetype: string - MIME type do arquivo (geralmente "application/pdf")
 *
 * USO:
 * Usado para obter o conteúdo binário do documento para upload no Google Drive.
 * O campo "documento" deve ser decodificado de base64 para Buffer antes do upload.
 *
 * EXEMPLO DE RESPOSTA DA API:
 * {
 *   "documento": "JVBERi0xLjQKJeLjz9MK...",
 *   "mimetype": "application/pdf"
 * }
 */
export interface DocumentoConteudo {
  documento: string; // Base64 encoded
  mimetype: string;
}

/**
 * Interface: FetchDocumentoParams
 *
 * PROPÓSITO:
 * Parâmetros necessários para buscar um documento específico do PJE.
 *
 * CAMPOS:
 * - processoId: string - ID do processo no PJE (usado na URL da API)
 * - documentoId: string - ID do documento/expediente no PJE
 * - pendenteId: number - ID do registro na tabela pendente_manifestacao (para atualização)
 * - numeroProcesso: string - Número do processo (ex: "0010702-80.2025.5.03.0111") - usado no webhook
 * - trt: string - Código do TRT (ex: "TRT3") - usado para gerar path do arquivo
 * - grau: string - Grau do processo ("1" ou "2") - usado para gerar path do arquivo
 *
 * USO:
 * Passado para a função downloadAndUploadDocumento() que orquestra todo o fluxo.
 *
 * EXEMPLO:
 * {
 *   processoId: "12345678",
 *   documentoId: "87654321",
 *   pendenteId: 999,
 *   numeroProcesso: "0010702-80.2025.5.03.0111",
 *   trt: "TRT3",
 *   grau: "1"
 * }
 */
export interface FetchDocumentoParams {
  processoId: string;
  documentoId: string;
  pendenteId: number;
  numeroProcesso: string;
  trt: string;
  grau: string;
}

/**
 * Interface: ArquivoInfo
 *
 * PROPÓSITO:
 * Informações sobre o arquivo após upload bem-sucedido no Backblaze B2.
 * Estas informações são armazenadas no banco de dados.
 *
 * CAMPOS:
 * - arquivo_nome: string - Nome do arquivo (ex: "exp_789_doc_234517663_20251121.pdf")
 * - arquivo_url: string - URL pública do arquivo no Backblaze B2
 * - arquivo_key: string - Chave (path) do arquivo no bucket S3 (ex: "processos/0010702-80.2025.5.03.0111/pendente_manifestacao/exp_789_doc_234517663_20251121.pdf")
 * - arquivo_bucket: string - Nome do bucket no Backblaze B2 (ex: "zattar-advogados")
 *
 * USO:
 * Retornado pelo serviço Backblaze após upload bem-sucedido.
 * Usado para atualizar os campos correspondentes na tabela pendente_manifestacao.
 *
 * EXEMPLO:
 * {
 *   arquivo_nome: "exp_789_doc_234517663_20251121.pdf",
 *   arquivo_url: "https://s3.us-east-005.backblazeb2.com/zattar-advogados/processos/0010702-80.2025.5.03.0111/pendente_manifestacao/exp_789_doc_234517663_20251121.pdf",
 *   arquivo_key: "processos/0010702-80.2025.5.03.0111/pendente_manifestacao/exp_789_doc_234517663_20251121.pdf",
 *   arquivo_bucket: "zattar-advogados"
 * }
 */
export interface ArquivoInfo {
  arquivo_nome: string;
  arquivo_url: string;
  arquivo_key: string;
  arquivo_bucket: string;
}

/**
 * Interface: FetchDocumentoResult
 *
 * PROPÓSITO:
 * Resultado completo da operação de fetch e upload de documento.
 * Retornado pela função downloadAndUploadDocumento() e pelo endpoint REST.
 *
 * CAMPOS:
 * - success: boolean - Indica se a operação foi bem-sucedida
 * - pendenteId: number - ID do pendente que teve documento capturado
 * - arquivoInfo?: ArquivoInfo - Informações do arquivo (presente se success=true)
 * - error?: string - Mensagem de erro (presente se success=false)
 *
 * USO:
 * Retornado pelo endpoint POST /api/pje/pendente-manifestacao/documento
 * Usado pelo frontend para exibir feedback de sucesso/erro
 * Usado pelo scraper para coletar estatísticas de captura
 *
 * EXEMPLO DE SUCESSO:
 * {
 *   success: true,
 *   pendenteId: 999,
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
 *   pendenteId: 999,
 *   error: "Documento não é um PDF válido"
 * }
 */
export interface FetchDocumentoResult {
  success: boolean;
  pendenteId: number;
  arquivoInfo?: ArquivoInfo;
  error?: string;
}
