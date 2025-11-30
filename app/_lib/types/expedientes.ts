// Tipos para integração com API de expedientes (pendentes de manifestação) no frontend

import type {
  PendenteManifestacao,
  ListarPendentesParams,
} from '@/backend/types/pendentes/types';

/**
 * Resposta da API de expedientes (formato padrão)
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
 * Parâmetros para buscar expedientes (frontend)
 */
export interface BuscarExpedientesParams extends Partial<ListarPendentesParams> {
  pagina?: number;
  limite?: number;
  busca?: string;
  ordenar_por?: ListarPendentesParams['ordenar_por'];
  ordem?: ListarPendentesParams['ordem'];
}

/**
 * Estado de filtros da página de expedientes
 */
export interface ExpedientesFilters {
  trt?: string;
  grau?: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';
  responsavel_id?: number | 'null';
  tipo_expediente_id?: number;
  sem_tipo?: boolean;
  sem_responsavel?: boolean;
  baixado?: boolean; // true = apenas baixados, false = apenas pendentes, undefined = todos
  prazo_vencido?: boolean;
  data_prazo_legal_inicio?: string;
  data_prazo_legal_fim?: string;
  data_ciencia_inicio?: string;
  data_ciencia_fim?: string;
  data_criacao_expediente_inicio?: string;
  data_criacao_expediente_fim?: string;
  classe_judicial?: string;
  codigo_status_processo?: string;
  segredo_justica?: boolean;
  juizo_digital?: boolean;
  data_autuacao_inicio?: string;
  data_autuacao_fim?: string;
  data_arquivamento_inicio?: string;
  data_arquivamento_fim?: string;
}

