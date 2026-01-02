import { z } from "zod";

import type { CodigoTribunal, GrauTribunal } from "@/features/expedientes/domain";
import { CodigoTribunal as CodigoTribunalEnum, GrauTribunal as GrauTribunalEnum } from "@/features/expedientes/domain";

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export enum SituacaoPericiaCodigo {
  AGUARDANDO_ESCLARECIMENTOS = "S",
  AGUARDANDO_LAUDO = "L",
  CANCELADA = "C",
  FINALIZADA = "F",
  LAUDO_JUNTADO = "P",
  REDESIGNADA = "R",
}

export const SITUACAO_PERICIA_LABELS: Record<SituacaoPericiaCodigo, string> = {
  [SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS]:
    "Aguardando Esclarecimentos",
  [SituacaoPericiaCodigo.AGUARDANDO_LAUDO]: "Aguardando Laudo",
  [SituacaoPericiaCodigo.CANCELADA]: "Cancelada",
  [SituacaoPericiaCodigo.FINALIZADA]: "Finalizada",
  [SituacaoPericiaCodigo.LAUDO_JUNTADO]: "Laudo Juntado",
  [SituacaoPericiaCodigo.REDESIGNADA]: "Redesignada",
};

// =============================================================================
// INTERFACES (DOMAIN)
// =============================================================================

export interface Pericia {
  id: number;
  idPje: number;
  advogadoId: number;
  processoId: number;
  orgaoJulgadorId: number | null;
  trt: CodigoTribunal;
  grau: GrauTribunal;
  numeroProcesso: string;
  prazoEntrega: string | null;
  dataAceite: string | null;
  dataCriacao: string;
  situacaoCodigo: SituacaoPericiaCodigo;
  situacaoDescricao: string | null;
  situacaoPericia: string | null;
  idDocumentoLaudo: number | null;
  laudoJuntado: boolean;
  especialidadeId: number | null;
  peritoId: number | null;
  classeJudicialSigla: string | null;
  dataProximaAudiencia: string | null;
  segredoJustica: boolean;
  juizoDigital: boolean;
  arquivado: boolean;
  prioridadeProcessual: boolean;
  permissoesPericia: Record<string, boolean> | null;
  funcionalidadeEditor: string | null;
  responsavelId: number | null;
  observacoes: string | null;
  dadosAnteriores: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;

  // Joins (opcional)
  especialidade?: { descricao: string } | null;
  perito?: { nome: string } | null;
  responsavel?: { nomeExibicao: string } | null;
  processo?: {
    numeroProcesso: string;
    nomeParteAutora: string | null;
    nomeParteRe: string | null;
    nomeParteAutoraOrigem: string | null;
    nomeParteReOrigem: string | null;
  } | null;
}

// =============================================================================
// ZOD SCHEMAS (VALIDATION)
// =============================================================================

export const atribuirResponsavelSchema = z.object({
  periciaId: z.number().min(1),
  responsavelId: z.number().min(1),
});

export const adicionarObservacaoSchema = z.object({
  periciaId: z.number().min(1),
  observacoes: z.string().min(1),
});

// =============================================================================
// PARAMS TYPES (FILTERS & SORTING)
// =============================================================================

export type PericiaSortBy = "prazo_entrega" | "data_criacao" | "situacao_codigo";

export type ListarPericiasParams = {
  pagina?: number;
  limite?: number;
  busca?: string;
  trt?: CodigoTribunal;
  grau?: GrauTribunal;
  situacaoCodigo?: SituacaoPericiaCodigo;
  responsavelId?: number | "null";
  semResponsavel?: boolean;
  especialidadeId?: number;
  peritoId?: number;
  laudoJuntado?: boolean;
  prazoEntregaInicio?: string;
  prazoEntregaFim?: string;
  dataCriacaoInicio?: string;
  dataCriacaoFim?: string;
  segredoJustica?: boolean;
  prioridadeProcessual?: boolean;
  arquivado?: boolean;
  ordenarPor?: PericiaSortBy;
  ordem?: "asc" | "desc";
};

export type PericiasFilters = Omit<
  ListarPericiasParams,
  "pagina" | "limite" | "ordenarPor" | "ordem"
>;

// =============================================================================
// RE-EXPORTS (compatibilidade com padrão de expedientes)
// =============================================================================

export const CodigoTribunal = CodigoTribunalEnum;
export const GrauTribunal = GrauTribunalEnum;


