import { z } from 'zod';

// =============================================================================
// LEGACY TYPES (MIGRATED FROM BACKEND)
// =============================================================================

/**
 * Grau do processo
 */
export type GrauPendente = 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';

/**
 * Campos disponíveis para ordenação
 */
export type OrdenarPorPendente =
  | 'data_prazo_legal_parte'
  | 'data_autuacao'
  | 'numero_processo'
  | 'nome_parte_autora'
  | 'nome_parte_re'
  | 'data_arquivamento'
  | 'data_ciencia_parte'
  | 'data_criacao_expediente'
  | 'prioridade_processual'
  | 'trt'
  | 'grau'
  | 'descricao_orgao_julgador'
  | 'classe_judicial'
  | 'tipo_expediente_id'
  | 'responsavel_id' // TODO: Implementar ordenação por nome do responsável (join com usuarios)
  | 'created_at'
  | 'updated_at';

/**
 * Campos disponíveis para agrupamento
 * NÃO incluir processo_id ou id_pje isoladamente (precisaria de TRT + grau para unicidade)
 */
export type AgruparPorPendente =
  | 'trt'
  | 'grau'
  | 'responsavel_id'
  | 'classe_judicial'
  | 'codigo_status_processo'
  | 'orgao_julgador'
  | 'mes_autuacao'
  | 'ano_autuacao'
  | 'prazo_vencido'
  | 'mes_prazo_legal';

/**
 * Direção da ordenação
 */
export type OrdemPendente = 'asc' | 'desc';

/**
 * Formato de banco de dados (snake_case) para Expediente.
 * Usado por API routes legadas em /api/pendentes-manifestacao.
 * @deprecated Preferir usar interface Expediente (camelCase) em novos códigos.
 */
export interface PendenteManifestacao {
  id: number;
  id_pje: number;
  advogado_id: number;
  processo_id: number | null;
  trt: string;
  grau: GrauPendente;
  numero_processo: string;
  descricao_orgao_julgador: string;
  classe_judicial: string;
  numero: number;
  segredo_justica: boolean;
  codigo_status_processo: string;
  prioridade_processual: number;
  nome_parte_autora: string;
  qtde_parte_autora: number;
  nome_parte_re: string;
  qtde_parte_re: number;
  data_autuacao: string; // ISO timestamp
  juizo_digital: boolean;
  data_arquivamento: string | null; // ISO timestamp
  id_documento: number | null;
  data_ciencia_parte: string | null; // ISO timestamp
  data_prazo_legal_parte: string | null; // ISO timestamp
  data_criacao_expediente: string | null; // ISO timestamp
  prazo_vencido: boolean;
  sigla_orgao_julgador: string | null;
  baixado_em: string | null; // ISO timestamp - data de baixa do expediente
  protocolo_id: string | null; // ID do protocolo quando houve protocolo de peça (pode conter números e letras)
  justificativa_baixa: string | null; // Justificativa quando não houve protocolo
  responsavel_id: number | null;
  tipo_expediente_id: number | null; // Tipo de expediente associado
  descricao_arquivos: string | null; // Descrição ou referência a arquivos relacionados
  arquivo_nome: string | null; // Nome do arquivo PDF no Backblaze B2
  arquivo_url: string | null; // URL pública do arquivo no Backblaze B2
  arquivo_key: string | null; // Chave (path) do arquivo no bucket
  arquivo_bucket: string | null; // Nome do bucket no Backblaze B2
  observacoes: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}


// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export enum OrigemExpediente {
  CAPTURA = 'captura',
  MANUAL = 'manual',
  COMUNICA_CNJ = 'comunica_cnj',
}

export enum GrauTribunal {
  PRIMEIRO_GRAU = 'primeiro_grau',
  SEGUNDO_GRAU = 'segundo_grau',
  TRIBUNAL_SUPERIOR = 'tribunal_superior',
}

export const CodigoTribunal = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24',
] as const;
export type CodigoTribunal = (typeof CodigoTribunal)[number];

export const ORIGEM_EXPEDIENTE_LABELS: Record<OrigemExpediente, string> = {
  [OrigemExpediente.CAPTURA]: 'Captura PJE',
  [OrigemExpediente.MANUAL]: 'Manual',
  [OrigemExpediente.COMUNICA_CNJ]: 'Comunica CNJ',
};

export const GRAU_TRIBUNAL_LABELS: Record<GrauTribunal, string> = {
  [GrauTribunal.PRIMEIRO_GRAU]: '1º Grau',
  [GrauTribunal.SEGUNDO_GRAU]: '2º Grau',
  [GrauTribunal.TRIBUNAL_SUPERIOR]: 'Tribunal Superior',
};

// =============================================================================
// INTERFACES (DOMAIN)
// =============================================================================

export interface Expediente {
  id: number;
  idPje: number | null;
  advogadoId: number | null;
  processoId: number | null;
  trt: CodigoTribunal;
  grau: GrauTribunal;
  numeroProcesso: string;
  descricaoOrgaoJulgador: string | null;
  classeJudicial: string | null;
  numero: string | null;
  segredoJustica: boolean;
  codigoStatusProcesso: string | null;
  prioridadeProcessual: boolean;
  nomeParteAutora: string | null;
  qtdeParteAutora: number | null;
  nomeParteRe: string | null;
  qtdeParteRe: number | null;
  dataAutuacao: string | null;
  juizoDigital: boolean;
  dataArquivamento: string | null;
  idDocumento: string | null;
  dataCienciaParte: string | null;
  dataPrazoLegalParte: string | null;
  dataCriacaoExpediente: string | null;
  prazoVencido: boolean;
  siglaOrgaoJulgador: string | null;
  dadosAnteriores: Record<string, unknown> | null;
  responsavelId: number | null;
  baixadoEm: string | null;
  protocoloId: string | null;
  justificativaBaixa: string | null;
  tipoExpedienteId: number | null;
  descricaoArquivos: string | null;
  arquivoNome: string | null;
  arquivoUrl: string | null;
  arquivoBucket: string | null;
  arquivoKey: string | null;
  observacoes: string | null;
  origem: OrigemExpediente;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// ZOD SCHEMAS (VALIDATION)
// =============================================================================

export const createExpedienteSchema = z.object({
  numeroProcesso: z.string().min(1, 'Número do processo é obrigatório.'),
  trt: z.enum(CodigoTribunal),
  grau: z.enum([GrauTribunal.PRIMEIRO_GRAU, GrauTribunal.SEGUNDO_GRAU, GrauTribunal.TRIBUNAL_SUPERIOR]),
  dataPrazoLegalParte: z.string().min(1, 'Data do prazo é obrigatória.'),
  origem: z.nativeEnum(OrigemExpediente).default(OrigemExpediente.MANUAL),
  advogadoId: z.number().optional(),
  processoId: z.number().optional(),
  descricaoOrgaoJulgador: z.string().optional(),
  classeJudicial: z.string().optional(),
  numero: z.string().optional(),
  segredoJustica: z.boolean().optional(),
  codigoStatusProcesso: z.string().optional(),
  prioridadeProcessual: z.boolean().optional(),
  nomeParteAutora: z.string().optional(),
  qtdeParteAutora: z.number().optional(),
  nomeParteRe: z.string().optional(),
  qtdeParteRe: z.number().optional(),
  dataAutuacao: z.string().optional(),
  juizoDigital: z.boolean().optional(),
  dataArquivamento: z.string().optional(),
  idDocumento: z.string().optional(),
  dataCienciaParte: z.string().optional(),
  responsavelId: z.number().optional(),
  tipoExpedienteId: z.number().optional(),
  observacoes: z.string().optional(),
});

export const updateExpedienteSchema = createExpedienteSchema.partial();

export const baixaExpedienteSchema = z.object({
  expedienteId: z.number().min(1),
  protocoloId: z.string().trim().min(1).optional(),
  justificativaBaixa: z.string().optional(),
  dataBaixa: z.string().optional().refine(val => !val || new Date(val) <= new Date(), {
    message: 'A data da baixa não pode ser futura.',
  }),
}).refine(data => data.protocoloId || data.justificativaBaixa, {
  message: 'É necessário fornecer o Protocolo ID ou uma Justificativa para a baixa.',
  path: ['protocoloId'],
});

export const reverterBaixaSchema = z.object({
  expedienteId: z.number().min(1),
});

// =============================================================================
// PARAMS TYPES (FILTERS & SORTING)
// =============================================================================

export type ExpedienteSortBy =
  | 'id'
  | 'data_prazo_legal_parte'
  | 'data_ciencia_parte'
  | 'data_criacao_expediente'
  | 'baixado_em'
  | 'created_at';

export type ListarExpedientesParams = {
  pagina?: number;
  limite?: number;
  busca?: string;
  trt?: CodigoTribunal;
  grau?: GrauTribunal;
  responsavelId?: number | 'null';
  tipoExpedienteId?: number;
  semTipo?: boolean;
  semResponsavel?: boolean;
  baixado?: boolean;
  prazoVencido?: boolean;
  dataPrazoLegalInicio?: string;
  dataPrazoLegalFim?: string;
  dataCienciaInicio?: string;
  dataCienciaFim?: string;
  dataCriacaoExpedienteInicio?: string;
  dataCriacaoExpedienteFim?: string;
  classeJudicial?: string;
  codigoStatusProcesso?: string;
  segredoJustica?: boolean;
  juizoDigital?: boolean;
  dataAutuacaoInicio?: string;
  dataAutuacaoFim?: string;
  dataArquivamentoInicio?: string;
  dataArquivamentoFim?: string;
  ordenarPor?: ExpedienteSortBy;
  ordem?: 'asc' | 'desc';
};

/**
 * Interface for frontend API response (Legacy support)
 */
export interface ExpedientesApiResponse {
  success: boolean;
  data: {
    pendentes: PendenteManifestacao[];
    paginacao: {
      pagina: number;
      limite: number;
      total: number;
      totalPaginas: number;
    };
  };
}

/**
 * Filter state interface for UI components
 */
export type ExpedientesFilters = Omit<ListarExpedientesParams, 'pagina' | 'limite' | 'ordenarPor' | 'ordem'>;

// =============================================================================
// LEGACY TYPES - Compatibilidade com código legado
// =============================================================================

/**
 * @deprecated Use ListarExpedientesParams instead
 * Parâmetros para listar pendentes (legado)
 */
export type ListarPendentesParams = ListarExpedientesParams;

/**
 * Resultado da listagem de pendentes (legado)
 */
export interface ListarPendentesResult {
  pendentes: PendenteManifestacao[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Resultado agrupado da listagem de pendentes (legado)
 */
export interface ListarPendentesAgrupadoResult {
  agrupamentos: Array<{
    grupo: string;
    quantidade: number;
    pendentes?: PendenteManifestacao[];
  }>;
  total: number;
}
