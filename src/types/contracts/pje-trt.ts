/**
 * Tipos de contrato (contract) para integração PJE-TRT.
 *
 * Regra: estes tipos representam o “shape” externo (API do PJE) e podem ser usados
 * por múltiplas features (captura, processos, acervo) sem acoplamento ao Playwright.
 *
 * Origem: migrado de `src/lib/api/pje-trt/types.ts` para `src/types/contracts`.
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
 * Informações do Backblaze B2 adicionadas ao documento
 */
export interface BackblazeB2Info {
    /** URL pública do arquivo no Backblaze B2 */
    url: string;
    /** Chave (path) do arquivo no bucket */
    key: string;
    /** Nome do bucket */
    bucket: string;
    /** Nome do arquivo */
    fileName: string;
    /** Data do upload */
    uploadedAt: Date;
}

/**
 * Informações do Google Drive adicionadas ao documento
 * @deprecated Use BackblazeB2Info no lugar. Google Drive será removido.
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
 * Item da timeline enriquecido com informações de armazenamento
 */
export interface TimelineItemEnriquecido extends TimelineItem {
    /** Informações do Backblaze B2 (se documento foi enviado) */
    backblaze?: BackblazeB2Info;
    /** Informações do Google Drive (deprecated, use backblaze) */
    googleDrive?: GoogleDriveInfo;
}

// =============================================================================
// TYPES FROM BACKEND
// =============================================================================

/**
 * Interface: PagedResponse<T>
 */
export interface PagedResponse<T> {
  pagina: number;
  tamanhoPagina: number;
  qtdPaginas: number;
  totalRegistros: number;
  resultado: T[];
}

/**
 * Interface: Totalizador
 */
export interface Totalizador {
  quantidadeProcessos: number;
  idAgrupamentoProcessoTarefa: number;
  nomeAgrupamentoTarefa: string;
  ordem: number;
  destaque: boolean;
}

/**
 * Interface: Processo
 */
export interface Processo {
  id: number;
  descricaoOrgaoJulgador: string;
  classeJudicial: string;
  numero: number;
  numeroProcesso: string;
  segredoDeJustica: boolean;
  codigoStatusProcesso: string;
  prioridadeProcessual: number;
  nomeParteAutora: string;
  qtdeParteAutora: number;
  nomeParteRe: string;
  qtdeParteRe: number;
  dataAutuacao: string;
  juizoDigital: boolean;
  dataArquivamento?: string;
  dataProximaAudiencia?: string | null;
  temAssociacao: boolean;
}

/**
 * Interface: ClasseJudicial
 */
export interface ClasseJudicial {
  id: number;
  codigo: string;
  descricao: string;
  sigla: string;
  requerProcessoReferenciaCodigo: string;
  controlaValorCausa: boolean;
  podeIncluirAutoridade: boolean;
  pisoValorCausa: number;
  tetoValorCausa: number;
  ativo: boolean;
  idClasseJudicialPai: number | null;
  possuiFilhos: boolean;
}

/**
 * Interface: OrgaoJulgador
 */
export interface OrgaoJulgador {
  id: number;
  descricao: string;
  cejusc: boolean;
  ativo: boolean;
  postoAvancado: boolean;
  novoOrgaoJulgador: boolean;
  codigoServentiaCnj: number;
}

/**
 * Interface: ProcessoAudiencia
 */
export interface ProcessoAudiencia {
  id: number;
  numero: string;
  classeJudicial: ClasseJudicial;
  segredoDeJustica: boolean;
  juizoDigital: boolean;
  orgaoJulgador: OrgaoJulgador;
}

/**
 * Interface: TipoAudiencia
 */
export interface TipoAudiencia {
  id: number;
  descricao: string;
  codigo: string;
  isVirtual: boolean;
}

/**
 * Interface: PoloAudiencia
 */
export interface PoloAudiencia {
  nome: string;
  polo: string;
  poloEnum: 'ATIVO' | 'PASSIVO';
  representaVarios: boolean;
  cpf?: string;
  cnpj?: string;
}

/**
 * Interface: SalaAudiencia
 */
export interface SalaAudiencia {
  nome: string;
  id?: number;
}

/**
 * Interface: PautaAudienciaHorario
 */
export interface PautaAudienciaHorario {
  id: number;
  horaInicial: string;
  horaFinal: string;
}

/**
 * Interface: Audiencia
 */
export interface Audiencia {
  id: number;
  dataInicio: string;
  dataFim: string;
  salaAudiencia: SalaAudiencia;
  status: string;
  processo: ProcessoAudiencia;
  tipo: TipoAudiencia;
  designada: boolean;
  emAndamento: boolean;
  documentoAtivo: boolean;
  poloAtivo: PoloAudiencia;
  poloPassivo: PoloAudiencia;
  pautaAudienciaHorario: PautaAudienciaHorario;
  statusDescricao: string;
  idProcesso: number;
  nrProcesso: string;
  urlAudienciaVirtual?: string;
}

/**
 * Enum: AgrupamentoProcessoTarefa
 */
export enum AgrupamentoProcessoTarefa {
  ACERVO_GERAL = 1,
  PENDENTES_MANIFESTACAO = 2,
  ARQUIVADOS = 5,
}


