/**
 * Tipos para integração com API de representantes no frontend
 * 
 * NOTA: Após a refatoração do modelo, representantes são sempre advogados
 * (pessoas físicas) com CPF único.
 */

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
  numero_oab?: string;
  situacao_oab?: 'REGULAR' | 'SUSPENSO' | 'CANCELADO' | 'LICENCIADO' | 'FALECIDO';
  incluirEndereco?: boolean;
}

/**
 * Estado de filtros da página de representantes
 */
export interface RepresentantesFilters {
  situacao_oab?: 'REGULAR' | 'SUSPENSO' | 'CANCELADO' | 'LICENCIADO' | 'FALECIDO';
}
