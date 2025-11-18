// Tipos e interfaces para tipos de expedientes

/**
 * Tipo de expediente completo baseado no schema do banco
 */
export interface TipoExpediente {
  id: number;
  tipo_expediente: string;
  created_by: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Parâmetros para criar um novo tipo de expediente
 */
export interface CriarTipoExpedienteParams {
  tipo_expediente: string;
  created_by: number;
}

/**
 * Parâmetros para atualizar um tipo de expediente
 */
export interface AtualizarTipoExpedienteParams {
  tipo_expediente?: string;
}

/**
 * Parâmetros para listar tipos de expedientes
 */
export interface ListarTiposExpedientesParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Busca textual
  busca?: string; // Busca em tipo_expediente

  // Filtros
  created_by?: number;

  // Ordenação
  ordenar_por?: 'tipo_expediente' | 'created_at' | 'updated_at';
  ordem?: 'asc' | 'desc';
}

/**
 * Resultado da listagem de tipos de expedientes
 */
export interface ListarTiposExpedientesResult {
  tipos_expedientes: TipoExpediente[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

