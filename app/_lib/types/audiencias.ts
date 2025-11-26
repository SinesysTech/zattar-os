// Tipos para integração com API de audiências no frontend

import type { Audiencia, ListarAudienciasParams } from '@/backend/types/audiencias/types';

/**
 * Resposta da API de audiências (formato padrão)
 */
export interface AudienciasApiResponse {
  success: boolean;
  data: {
    audiencias: Audiencia[];
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
export interface BuscarAudienciasParams extends Partial<ListarAudienciasParams> {
  pagina?: number;
  limite?: number;
  busca?: string;
  ordenar_por?: ListarAudienciasParams['ordenar_por'];
  ordem?: ListarAudienciasParams['ordem'];
}

/**
 * Modalidade da audiência (re-exportado do backend)
 */
export type { ModalidadeAudiencia } from '@/backend/types/audiencias/types';

/**
 * Estado de filtros da página de audiências
 */
export interface AudienciasFilters {
  trt?: string;
  grau?: 'primeiro_grau' | 'segundo_grau';
  responsavel_id?: number | 'null';
  sem_responsavel?: boolean;
  busca?: string;
  numero_processo?: string;
  polo_ativo_nome?: string;
  polo_passivo_nome?: string;
  status?: string;
  modalidade?: 'virtual' | 'presencial' | 'hibrida';
  tipo_descricao?: string;
  tipo_codigo?: string;
  tipo_is_virtual?: boolean;
  data_inicio_inicio?: string;
  data_inicio_fim?: string;
  data_fim_inicio?: string;
  data_fim_fim?: string;
}

