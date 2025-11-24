// Tipos para integração com API de representantes no frontend

import type {
  Representante,
  ListarRepresentantesParams,
} from '@/backend/types/representantes/representantes-types';

/**
 * Resposta da API de representantes (formato padrão)
 */
export interface RepresentantesApiResponse {
  success: boolean;
  data: {
    representantes: Representante[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

/**
 * Parâmetros para buscar representantes (frontend)
 */
export interface BuscarRepresentantesParams extends Partial<ListarRepresentantesParams> {
  pagina?: number;
  limite?: number;
  busca?: string;
  parte_tipo?: 'cliente' | 'parte_contraria' | 'terceiro';
  parte_id?: number;
  tipo_pessoa?: 'pf' | 'pj';
  numero_oab?: string;
  situacao_oab?: 'REGULAR' | 'SUSPENSO' | 'CANCELADO' | 'LICENCIADO' | 'FALECIDO';
}

/**
 * Estado de filtros da página de representantes
 */
export interface RepresentantesFilters {
  parte_tipo?: 'cliente' | 'parte_contraria' | 'terceiro';
  tipo_pessoa?: 'pf' | 'pj';
  situacao_oab?: 'REGULAR' | 'SUSPENSO' | 'CANCELADO' | 'LICENCIADO' | 'FALECIDO';
}
