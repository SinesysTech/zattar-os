import { z } from 'zod';

// Enums and Types
export enum StatusAudiencia {
  Marcada = 'M',
  Finalizada = 'F',
  Cancelada = 'C',
}

export enum ModalidadeAudiencia {
  Virtual = 'virtual',
  Presencial = 'presencial',
  Hibrida = 'hibrida',
}

export enum PresencaHibrida {
  Advogado = 'advogado',
  Cliente = 'cliente',
}

export const CODIGO_TRIBUNAL = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24',
] as const;
export type CodigoTribunal = typeof CODIGO_TRIBUNAL[number];

export enum GrauTribunal {
  PrimeiroGrau = 'primeiro_grau',
  SegundoGrau = 'segundo_grau',
  TribunalSuperior = 'tribunal_superior',
}

// Interfaces
export interface EnderecoPresencial {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Audiencia {
  id: number;
  idPje: number | null;
  advogadoId: number | null;
  processoId: number;
  orgaoJulgadorId: number | null;
  trt: CodigoTribunal;
  grau: GrauTribunal;
  numeroProcesso: string;
  dataInicio: string;
  dataFim: string;
  horaInicio: string | null;
  horaFim: string | null;
  modalidade: ModalidadeAudiencia | null;
  presencaHibrida: PresencaHibrida | null;
  salaAudienciaNome: string | null;
  salaAudienciaId: number | null;
  status: StatusAudiencia;
  statusDescricao: string | null;
  tipoAudienciaId: number | null;
  tipoDescricao: string | null;
  classeJudicialId: number | null;
  designada: boolean;
  emAndamento: boolean;
  documentoAtivo: boolean;
  poloAtivoNome: string | null;
  poloPassivoNome: string | null;
  urlAudienciaVirtual: string | null;
  enderecoPresencial: EnderecoPresencial | null;
  responsavelId: number | null;
  observacoes: string | null;
  dadosAnteriores: any | null;
  createdAt: string;
  updatedAt: string;
}

// Zod Schemas
export const createAudienciaSchema = z.object({
  processoId: z.number({ required_error: 'Processo é obrigatório.' }),
  dataInicio: z.string({ required_error: 'Data de início é obrigatória.' }).datetime('Formato de data inválido.'),
  dataFim: z.string({ required_error: 'Data de fim é obrigatória.' }).datetime('Formato de data inválido.'),
  tipoAudienciaId: z.number().optional().nullable(),
  modalidade: z.nativeEnum(ModalidadeAudiencia).optional().nullable(),
  urlAudienciaVirtual: z.string().url('URL inválida.').optional().nullable(),
  enderecoPresencial: z.custom<EnderecoPresencial>().optional().nullable(),
  responsavelId: z.number().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  salaAudienciaNome: z.string().optional().nullable(),
}).refine(data => new Date(data.dataFim) > new Date(data.dataInicio), {
  message: 'A data de fim deve ser posterior à data de início.',
  path: ['dataFim'],
});

export const updateAudienciaSchema = createAudienciaSchema.partial();

export const atualizarStatusSchema = z.object({
  status: z.nativeEnum(StatusAudiencia),
  statusDescricao: z.string().optional(),
});

// Parameter Types
export type AudienciaSortBy = keyof Audiencia;

export type ListarAudienciasParams = {
  pagina?: number;
  limite?: number;
  busca?: string;
  trt?: CodigoTribunal;
  grau?: GrauTribunal;
  responsavelId?: number | 'null';
  semResponsavel?: boolean;
  status?: StatusAudiencia;
  modalidade?: ModalidadeAudiencia;
  tipoAudienciaId?: number;
  dataInicioInicio?: string;
  dataInicioFim?: string;
  dataFimInicio?: string;
  dataFimFim?: string;
  ordenarPor?: AudienciaSortBy;
  ordem?: 'asc' | 'desc';
};

// Labels and Constants
export const STATUS_AUDIENCIA_LABELS: Record<StatusAudiencia, string> = {
  [StatusAudiencia.Marcada]: 'Marcada',
  [StatusAudiencia.Finalizada]: 'Realizada',
  [StatusAudiencia.Cancelada]: 'Cancelada',
};

export const MODALIDADE_AUDIENCIA_LABELS: Record<ModalidadeAudiencia, string> = {
  [ModalidadeAudiencia.Virtual]: 'Virtual',
  [ModalidadeAudiencia.Presencial]: 'Presencial',
  [ModalidadeAudiencia.Hibrida]: 'Híbrida',
};

// Re-exporting from another module might be needed if GRAU_TRIBUNAL_LABELS is defined elsewhere
// For now, let's define it here if not present in expedientes
export const GRAU_TRIBUNAL_LABELS: Record<GrauTribunal, string> = {
  [GrauTribunal.PrimeiroGrau]: '1º Grau',
  [GrauTribunal.SegundoGrau]: '2º Grau',
  [GrauTribunal.TribunalSuperior]: 'Tribunal Superior',
};
