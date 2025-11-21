// Tipos para integração com API de acervo no frontend

import type { Acervo, ListarAcervoParams } from '@/backend/types/acervo/types';

/**
 * Resposta da API de acervo (formato padrão)
 */
export interface AcervoApiResponse {
  success: boolean;
  data: {
    processos: Acervo[];
    paginacao: {
      pagina: number;
      limite: number;
      total: number;
      totalPaginas: number;
    };
  };
}

/**
 * Parâmetros para buscar processos (frontend)
 */
export interface BuscarProcessosParams extends Partial<ListarAcervoParams> {
  pagina?: number;
  limite?: number;
  busca?: string;
  ordenar_por?: ListarAcervoParams['ordenar_por'];
  ordem?: ListarAcervoParams['ordem'];
}

/**
 * Estado de filtros da página de processos
 */
export interface ProcessosFilters {
  origem?: 'acervo_geral' | 'arquivado';
  trt?: string;
  grau?: 'primeiro_grau' | 'segundo_grau';
  responsavel_id?: number | 'null';
  sem_responsavel?: boolean;
  busca?: string;
  numero_processo?: string;
  nome_parte_autora?: string;
  nome_parte_re?: string;
  descricao_orgao_julgador?: string;
  classe_judicial?: string;
  codigo_status_processo?: string;
  segredo_justica?: boolean;
  juizo_digital?: boolean;
  tem_associacao?: boolean;
  data_autuacao_inicio?: string;
  data_autuacao_fim?: string;
  data_arquivamento_inicio?: string;
  data_arquivamento_fim?: string;
  data_proxima_audiencia_inicio?: string;
  data_proxima_audiencia_fim?: string;
  tem_proxima_audiencia?: boolean;
}

