/**
 * Tipos para Timeline do PJE-TRT
 * Baseado na análise dos resultados reais da API
 */

/**
 * Item da timeline (pode ser documento ou movimento)
 */
export interface TimelineItem {
  id: number;
  titulo: string;
  data: string; // ISO 8601
  documento: boolean; // true = documento, false = movimento
  idUsuario: number;
  especializacoes: number;
  nomeResponsavel: string;
  tipoPolo: string;
  favorito: boolean;
  ativo: boolean;
  documentoSigiloso: boolean;
  usuarioInterno: boolean;
  documentoApreciavel: boolean;
  expediente: boolean;
  numeroOrdem: number;
  codigoInstancia: number;
  pendenciaDocInstanciaOrigem: boolean;
  copia: boolean;
  permiteCooperacaoJudiciaria: boolean;
  dataJuntadaFutura: boolean;

  // Campos específicos de DOCUMENTO (quando documento: true)
  idUnicoDocumento?: string;
  idTipo?: number;
  tipo?: string; // Ex: "Certidão", "Petição", "Contrarrazões"
  codigoDocumento?: string;
  idSignatario?: number;
  nomeSignatario?: string;
  participacaoProcesso?: string;
  instancia?: string;
  papelUsuarioDocumento?: string;
  infoExpedientes?: {
    expediente: boolean;
    expedienteAberto: boolean;
    hasMandadoDevolucaoPendente: boolean;
    mandadoDistribuido: boolean;
  };
  anexos?: unknown[]; // Array de anexos (estrutura a ser definida quando necessário)

  // Campos específicos de MOVIMENTO (quando documento: false)
  codigoMovimentoCNJ?: string;
  movimentoPermiteExclusao?: boolean;
  movimentoPermiteRetificacao?: boolean;
  movimentoFoiRetificado?: boolean;
}

/**
 * Resposta da API de timeline
 * A API retorna um array direto (não um objeto paginado)
 */
export type TimelineResponse = TimelineItem[];

/**
 * Detalhes completos de um documento
 */
export interface DocumentoDetalhes {
  id: number;
  idUnicoDocumento: string;
  identificadorUnico: string; // UUID completo
  idTipoDocumento: number;
  titulo: string;
  tipo: string;
  idTipo: number;
  codigoTipoDocumento: string;
  criador: string;
  signatario: string;
  idPessoaInclusao: number;
  criadoEm: string; // ISO 8601
  juntadoEm: string; // ISO 8601
  idProcesso: number;
  processoEmSegredo: boolean;
  assinado: boolean;
  apreciado: boolean;
  sigiloso: boolean;
  tipoArquivo: string; // Ex: "PDF"
  documentoApreciavel: boolean;
  ativo: boolean;
  numeroOrdem: number;
  nomeArquivo: string; // Ex: "1º Grau-222702194.pdf"
  idBin: number; // ID do binário
  md5: string; // Hash MD5 do arquivo
  dataInclusaoBin: string; // ISO 8601
  tamanho: number; // Tamanho em bytes
  version: number;
  responder: boolean;
  numComentariosNaoLidos: number;
  pendenteAnaliseMagistrado: boolean;
  binario: boolean; // true se tem arquivo disponível
  dadosAssinatura?: DadosAssinatura;
}

/**
 * Dados de assinatura digital do documento
 */
export interface DadosAssinatura {
  signatario: string;
  responsavelCertificado: string;
  commonName: string;
  emissor: string;
  data: string; // ISO 8601
  tipoAssinador: string; // Ex: "PJE_OFFICE"
  assinatura: string; // Base64
  algoritmoDigest: string; // Ex: "SHA256withRSA"
  certChain: string; // Cadeia de certificados em Base64
  tipoAssinaturaDocumento: string; // Ex: "ADRB_PADES_11"
  algoritmoAssinatura: string; // Ex: "MD5withRSA"
}

/**
 * Opções para obter timeline
 */
export interface ObterTimelineOptions {
  /** Retornar apenas documentos assinados */
  somenteDocumentosAssinados?: boolean;
  /** Incluir movimentos na timeline */
  buscarMovimentos?: boolean;
  /** Incluir documentos na timeline */
  buscarDocumentos?: boolean;
}

/**
 * Opções para obter detalhes de documento
 */
export interface ObterDocumentoOptions {
  /** Incluir dados de assinatura */
  incluirAssinatura?: boolean;
  /** Incluir anexos do documento */
  incluirAnexos?: boolean;
  /** Grau da instância (1 = primeiro grau, 2 = segundo grau) */
  grau?: number;
}

/**
 * Opções para baixar conteúdo de documento
 */
export interface BaixarDocumentoOptions {
  /** Incluir capa no PDF */
  incluirCapa?: boolean;
  /** Incluir assinatura no PDF */
  incluirAssinatura?: boolean;
  /** Grau da instância (1 = primeiro grau, 2 = segundo grau) */
  grau?: number;
}

/**
 * Filtro para documentos da timeline
 */
export interface FiltroDocumentosTimeline {
  /** Apenas documentos assinados */
  apenasAssinados?: boolean;
  /** Apenas documentos não sigilosos */
  apenasNaoSigilosos?: boolean;
  /** Tipos de documento a incluir */
  tipos?: string[];
  /** Data inicial (ISO 8601) */
  dataInicial?: string;
  /** Data final (ISO 8601) */
  dataFinal?: string;
}

/**
 * Informações do Google Drive adicionadas ao documento
 */
export interface GoogleDriveInfo {
  /** Link de visualização do Google Drive */
  linkVisualizacao: string;
  /** Link de download do Google Drive */
  linkDownload: string;
  /** ID do arquivo no Google Drive */
  fileId: string;
  /** Data do upload */
  uploadedAt: Date;
}

/**
 * Item da timeline enriquecido com informações do Google Drive
 */
export interface TimelineItemEnriquecido extends TimelineItem {
  /** Informações do Google Drive (se documento foi enviado) */
  googleDrive?: GoogleDriveInfo;
}
