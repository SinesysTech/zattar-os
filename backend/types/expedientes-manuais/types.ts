// Tipos e interfaces para expedientes manuais

/**
 * Expediente manual completo baseado no schema do banco
 */
export interface ExpedienteManual {
  id: number;
  processo_id: number;
  trt: string;
  grau: 'primeiro_grau' | 'segundo_grau';
  numero_processo: string;
  tipo_expediente_id: number | null;
  descricao: string;
  data_prazo_legal: string | null; // ISO timestamp
  prazo_vencido: boolean;
  responsavel_id: number | null;
  baixado_em: string | null; // ISO timestamp
  protocolo_id: string | null;
  justificativa_baixa: string | null;
  criado_por: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Expediente unificado (PJE + Manual) da VIEW
 */
export interface ExpedienteUnificado {
  origem: 'pje' | 'manual';
  id: number;
  processo_id: number | null;
  trt: string;
  grau: 'primeiro_grau' | 'segundo_grau';
  numero_processo: string;
  tipo_expediente_id: number | null;
  descricao: string | null;
  data_prazo_legal: string | null;
  prazo_vencido: boolean;
  responsavel_id: number | null;
  baixado_em: string | null;
  protocolo_id: string | null;
  justificativa_baixa: string | null;
  id_pje: number | null;
  criado_por: number | null;
  classe_judicial: string | null;
  codigo_status_processo: string | null;
  descricao_orgao_julgador: string | null;
  nome_parte_autora: string | null;
  nome_parte_re: string | null;
  data_autuacao: string | null;
  segredo_justica: boolean;
  juizo_digital: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Parâmetros para criar um novo expediente manual
 */
export interface CriarExpedienteManualParams {
  processo_id: number;
  tipo_expediente_id?: number | null;
  descricao: string;
  data_prazo_legal?: string | null; // ISO timestamp
  responsavel_id?: number | null;
}

/**
 * Parâmetros para atualizar um expediente manual
 */
export interface AtualizarExpedienteManualParams {
  tipo_expediente_id?: number | null;
  descricao?: string;
  data_prazo_legal?: string | null;
  responsavel_id?: number | null;
}

/**
 * Parâmetros para baixar um expediente manual
 */
export interface BaixarExpedienteManualParams {
  protocolo_id?: string | null;
  justificativa_baixa?: string | null;
}

/**
 * Parâmetros para listar expedientes manuais
 */
export interface ListarExpedientesManuaisParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Busca textual
  busca?: string;

  // Filtros
  processo_id?: number;
  trt?: string;
  grau?: 'primeiro_grau' | 'segundo_grau';
  tipo_expediente_id?: number;
  responsavel_id?: number | 'null';
  prazo_vencido?: boolean;
  baixado?: boolean;
  criado_por?: number;

  // Filtros de data
  data_prazo_legal_inicio?: string;
  data_prazo_legal_fim?: string;

  // Ordenação
  ordenar_por?: 'data_prazo_legal' | 'created_at' | 'updated_at' | 'baixado_em';
  ordem?: 'asc' | 'desc';
}

/**
 * Resultado da listagem de expedientes manuais
 */
export interface ListarExpedientesManuaisResult {
  expedientes: ExpedienteManual[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Parâmetros para listar expedientes unificados (PJE + Manual)
 */
export interface ListarExpedientesUnificadosParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Busca textual
  busca?: string;

  // Filtros
  origem?: 'pje' | 'manual';
  processo_id?: number;
  trt?: string;
  grau?: 'primeiro_grau' | 'segundo_grau';
  tipo_expediente_id?: number;
  responsavel_id?: number | 'null';
  prazo_vencido?: boolean;
  baixado?: boolean;
  segredo_justica?: boolean;
  juizo_digital?: boolean;

  // Filtros de data
  data_prazo_legal_inicio?: string;
  data_prazo_legal_fim?: string;
  data_autuacao_inicio?: string;
  data_autuacao_fim?: string;

  // Ordenação
  ordenar_por?: 'data_prazo_legal' | 'created_at' | 'updated_at' | 'baixado_em';
  ordem?: 'asc' | 'desc';
}

/**
 * Resultado da listagem de expedientes unificados
 */
export interface ListarExpedientesUnificadosResult {
  expedientes: ExpedienteUnificado[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}
