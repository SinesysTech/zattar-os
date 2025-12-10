/**
 * Tipos para o módulo de audiências
 * 
 * Re-exporta tipos de domínio e define tipos específicos de frontend
 */

// Re-exporta tipos de domínio do core
export {
  StatusAudiencia,
  ModalidadeAudiencia,
  PresencaHibrida,
  CODIGO_TRIBUNAL,
  GrauTribunal,
  STATUS_AUDIENCIA_LABELS,
  MODALIDADE_AUDIENCIA_LABELS,
  GRAU_TRIBUNAL_LABELS,
  createAudienciaSchema,
  updateAudienciaSchema,
  atualizarStatusSchema,
} from '@/core/audiencias/domain';

export type {
  CodigoTribunal,
  EnderecoPresencial,
  Audiencia,
  AudienciaSortBy,
  ListarAudienciasParams,
} from '@/core/audiencias/domain';

// Re-exporta tipos do backend
export type {
  GrauAudiencia,
  AudienciaInfra,
  CriarAudienciaInfraParams,
  AtualizarAudienciaInfraParams,
} from '@/backend/types/audiencias/types';

// ============================================================================
// Tipos específicos de frontend para audiências
// ============================================================================

/**
 * Resposta da API de audiências (formato padrão)
 */
export interface AudienciasApiResponse {
  success: boolean;
  data: {
    audiencias: import('@/core/audiencias/domain').Audiencia[];
    paginacao: {
      pagina: number;
      limite: number;
      total: number;
      totalPaginas: number;
    };
  };
}

/**
 * Parâmetros para buscar audiências (frontend)
 */
export interface BuscarAudienciasParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  ordenar_por?: import('@/core/audiencias/domain').AudienciaSortBy;
  ordem?: 'asc' | 'desc';
  trt?: import('@/core/audiencias/domain').CodigoTribunal;
  grau?: import('@/core/audiencias/domain').GrauTribunal;
  responsavel_id?: number | 'null';
  status?: import('@/core/audiencias/domain').StatusAudiencia;
  modalidade?: import('@/core/audiencias/domain').ModalidadeAudiencia;
  tipo_descricao?: string;
  tipo_codigo?: string;
  data_inicio_inicio?: string;
  data_inicio_fim?: string;
  data_fim_inicio?: string;
  data_fim_fim?: string;
}

/**
 * Estado de filtros da página de audiências
 */
export interface AudienciasFilters {
  trt?: string;
  grau?: import('@/core/audiencias/domain').GrauTribunal;
  responsavel_id?: number | 'null';
  busca?: string;
  numero_processo?: string;
  polo_ativo_nome?: string;
  polo_passivo_nome?: string;
  status?: string;
  modalidade?: 'virtual' | 'presencial' | 'hibrida';
  tipo_descricao?: string;
  tipo_codigo?: string;
  data_inicio_inicio?: string;
  data_inicio_fim?: string;
  data_fim_inicio?: string;
  data_fim_fim?: string;
}

/**
 * Visualização ativa de audiências
 */
export type AudienciasVisualizacao = 'semana' | 'mes' | 'ano' | 'lista';

/**
 * Paginação de audiências
 */
export interface AudienciasPaginacao {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

/**
 * Resultado do hook useAudiencias
 */
export interface UseAudienciasResult {
  audiencias: import('@/core/audiencias/domain').Audiencia[];
  paginacao: AudienciasPaginacao | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Opções do hook useAudiencias
 */
export interface UseAudienciasOptions {
  /** Se false, não faz a busca (útil para aguardar inicialização de parâmetros) */
  enabled?: boolean;
}

/**
 * Tipo de audiência (retornado pela API)
 */
export interface TipoAudiencia {
  id: number;
  codigo: string;
  descricao: string;
  trt: string;
  grau: string;
}

/**
 * Resultado do hook useTiposAudiencias
 */
export interface UseTiposAudienciasResult {
  tiposAudiencia: TipoAudiencia[];
  isLoading: boolean;
  error: string | null;
}
