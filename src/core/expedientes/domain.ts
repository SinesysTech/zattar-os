import { z } from 'zod';

// Enums
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

// Interface
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
  dadosAnteriores: any | null;
  responsavelId: number | null;
  baixadoEm: string | null;
  protocoloId: number | null;
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

// Zod Schemas
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
  protocoloId: z.number().optional(),
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

// Parameter Types
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
  segretoJustica?: boolean;
  juizoDigital?: boolean;
  dataAutuacaoInicio?: string;
  dataAutuacaoFim?: string;
  dataArquivamentoInicio?: string;
  dataArquivamentoFim?: string;
  ordenarPor?: ExpedienteSortBy;
  ordem?: 'asc' | 'desc';
};

// Constants
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
