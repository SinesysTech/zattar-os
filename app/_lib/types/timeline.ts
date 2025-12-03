/**
 * Tipos TypeScript para Timeline de Processos
 *
 * Representa a estrutura de dados da timeline capturada do PJE-TRT,
 * incluindo movimentos processuais e documentos com arquivos no Backblaze B2.
 */

/**
 * Item básico da timeline (movimento ou documento)
 */
export interface TimelineItem {
  id: number;
  titulo: string;
  data: string; // ISO 8601
  documento: boolean; // true = documento, false = movimento

  // Campos comuns
  idUsuario: number;
  nomeResponsavel: string;
  tipoPolo: string;
  documentoSigiloso: boolean;
  documentoApreciavel: boolean;
  numeroOrdem: number;
  codigoInstancia: number;

  // Campos de DOCUMENTO (quando documento: true)
  idUnicoDocumento?: string;
  idTipo?: number;
  tipo?: string; // Ex: "Certidão", "Petição"
  codigoDocumento?: string;
  idSignatario?: number | null; // Se null, documento não assinado
  nomeSignatario?: string;
  instancia?: string;

  // Campos de MOVIMENTO (quando documento: false)
  codigoMovimentoCNJ?: string;
  movimentoPermiteExclusao?: boolean;
  movimentoPermiteRetificacao?: boolean;
}

/**
 * Informações do Backblaze B2 para um documento
 */
export interface BackblazeB2Info {
  url: string; // URL pública do arquivo
  key: string; // Chave (path) do arquivo no bucket
  bucket: string; // Nome do bucket
  fileName: string; // Nome do arquivo
  uploadedAt: Date | string; // Data do upload
}

/**
 * Informações do Google Drive para um documento
 * @deprecated Use BackblazeB2Info no lugar. Google Drive será removido.
 */
export interface GoogleDriveInfo {
  linkVisualizacao: string; // URL para visualizar no Google Drive
  linkDownload: string; // URL para download direto
  fileId: string; // ID do arquivo no Google Drive
  uploadedAt: Date | string; // Data do upload
}

/**
 * Item da timeline enriquecido com informações de armazenamento
 */
export interface TimelineItemEnriquecido extends TimelineItem {
  backblaze?: BackblazeB2Info; // Informações do Backblaze B2 (atual)
  googleDrive?: GoogleDriveInfo; // Deprecated, manter por compatibilidade
}

/**
 * Metadados da timeline
 */
export interface TimelineMetadata {
  advogadoId?: number; // ID do advogado usado na captura
  totalDocumentos: number; // Total de documentos na timeline
  totalMovimentos: number; // Total de movimentos na timeline
  totalDocumentosBaixados: number; // Total de documentos com PDF baixado
  schemaVersion: number; // Versão do schema (para migrações futuras)
}

/**
 * Documento completo armazenado no MongoDB
 */
export interface TimelineDocument {
  _id: string; // ObjectId do MongoDB
  processoId: string; // ID do processo no PJE
  trtCodigo: string; // Ex: "TRT3"
  grau: string; // "primeiro_grau" ou "segundo_grau"
  capturadoEm: Date | string; // Data da captura
  timeline: TimelineItemEnriquecido[]; // Array de items da timeline
  metadata: TimelineMetadata; // Metadados da captura
}

/**
 * Detalhes completos de um documento (retornado pela API PJE)
 */
export interface DocumentoDetalhes {
  id: number;
  idUnicoDocumento: string;
  identificadorUnico: string; // UUID completo
  idTipoDocumento: number;
  titulo: string;
  tipo: string;
  criador: string;
  signatario: string;
  criadoEm: string; // ISO 8601
  juntadoEm: string; // ISO 8601
  assinado: boolean;
  sigiloso: boolean;
  tipoArquivo: string; // Ex: "PDF"
  nomeArquivo: string;
  idBin: number;
  md5: string; // Hash do arquivo
  tamanho: number; // Bytes
  binario: boolean; // true se tem arquivo

  // Dados de assinatura (se documento assinado)
  dadosAssinatura?: {
    signatario: string;
    commonName: string;
    data: string; // ISO 8601
    tipoAssinador: string; // Ex: "PJE_OFFICE"
    assinatura: string; // Base64
    algoritmoDigest: string; // Ex: "SHA256withRSA"
  };
}

/**
 * Resposta da API de consulta de timeline
 */
export interface TimelineAPIResponse {
  success: boolean;
  data: {
    acervo: unknown; // Dados do processo (tipo Acervo do backend)
    timeline: TimelineDocument | null; // Timeline do MongoDB ou null se não existe
  };
  error?: string;
}

/**
 * Resposta da API de captura de timeline
 */
export interface CapturaTimelineAPIResponse {
  success: boolean;
  data?: {
    timeline: TimelineItemEnriquecido[];
    totalItens: number;
    totalDocumentos: number;
    totalMovimentos: number;
    documentosBaixados: Array<{
      detalhes: DocumentoDetalhes;
      pdfTamanho: number;
      erro?: string;
    }>;
    totalBaixadosSucesso: number;
    totalErros: number;
    mongoId: string; // ID do documento no MongoDB
  };
  error?: string;
}

