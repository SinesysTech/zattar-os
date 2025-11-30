// Tipos e interfaces para o serviço de acervo

/**
 * Origem do processo no acervo
 */
export type OrigemAcervo = 'acervo_geral' | 'arquivado';

/**
 * Grau do processo
 */
export type GrauAcervo = 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';

/**
 * Campos disponíveis para ordenação
 */
export type OrdenarPorAcervo =
  | 'data_autuacao'
  | 'numero_processo'
  | 'nome_parte_autora'
  | 'nome_parte_re'
  | 'data_arquivamento'
  | 'data_proxima_audiencia'
  | 'prioridade_processual'
  | 'created_at'
  | 'updated_at';

/**
 * Campos disponíveis para agrupamento
 */
export type AgruparPorAcervo =
  | 'trt'
  | 'grau'
  | 'origem'
  | 'responsavel_id'
  | 'classe_judicial'
  | 'codigo_status_processo'
  | 'orgao_julgador'
  | 'mes_autuacao'
  | 'ano_autuacao';

/**
 * Direção da ordenação
 */
export type OrdemAcervo = 'asc' | 'desc';

/**
 * Registro de acervo completo baseado no schema do banco
 */
export interface Acervo {
  id: number;
  id_pje: number;
  advogado_id: number;
  origem: OrigemAcervo;
  trt: string;
  grau: GrauAcervo;
  numero_processo: string;
  numero: number;
  descricao_orgao_julgador: string;
  classe_judicial: string;
  segredo_justica: boolean;
  codigo_status_processo: string;
  prioridade_processual: number;
  nome_parte_autora: string;
  qtde_parte_autora: number;
  nome_parte_re: string;
  qtde_parte_re: number;
  data_autuacao: string; // ISO timestamp
  juizo_digital: boolean;
  data_arquivamento: string | null; // ISO timestamp
  data_proxima_audiencia: string | null; // ISO timestamp
  tem_associacao: boolean;
  responsavel_id: number | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Parâmetros para listar acervo
 */
export interface ListarAcervoParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Unificação de processos multi-instância
  unified?: boolean; // Padrão: true - Agrupa processos com mesmo numero_processo

  // Filtros básicos
  origem?: OrigemAcervo;
  trt?: string;
  grau?: GrauAcervo;
  responsavel_id?: number | 'null'; // 'null' string para processos sem responsável
  sem_responsavel?: boolean;

  // Busca textual
  busca?: string; // Busca em numero_processo, nome_parte_autora, nome_parte_re, descricao_orgao_julgador, classe_judicial

  // Filtros específicos
  numero_processo?: string;
  nome_parte_autora?: string;
  nome_parte_re?: string;
  descricao_orgao_julgador?: string;
  classe_judicial?: string;
  codigo_status_processo?: string;
  segredo_justica?: boolean;
  juizo_digital?: boolean;
  tem_associacao?: boolean;

  // Filtros de data
  data_autuacao_inicio?: string; // ISO date
  data_autuacao_fim?: string; // ISO date
  data_arquivamento_inicio?: string; // ISO date
  data_arquivamento_fim?: string; // ISO date
  data_proxima_audiencia_inicio?: string; // ISO date
  data_proxima_audiencia_fim?: string; // ISO date
  tem_proxima_audiencia?: boolean;

  // Ordenação
  ordenar_por?: OrdenarPorAcervo;
  ordem?: OrdemAcervo;

  // Agrupamento
  agrupar_por?: AgruparPorAcervo;
  incluir_contagem?: boolean; // Padrão: true quando agrupar_por está presente
}

/**
 * Resultado da listagem padrão (sem agrupamento)
 */
export interface ListarAcervoResult {
  processos: Acervo[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Item de agrupamento
 */
export interface AgrupamentoAcervo {
  grupo: string;
  quantidade: number;
  processos?: Acervo[]; // Opcional: apenas se incluir_contagem=false
}

/**
 * Resultado da listagem com agrupamento
 */
export interface ListarAcervoAgrupadoResult {
  agrupamentos: AgrupamentoAcervo[];
  total: number;
}

/**
 * Metadados de uma instância de processo (grau específico)
 */
export interface ProcessoInstancia {
  id: number;
  grau: GrauAcervo;
  origem: OrigemAcervo;
  trt: string;
  data_autuacao: string;
  updated_at: string;
  is_grau_atual: boolean; // Indica se é a instância do grau atual
}

/**
 * Processo unificado - agrega todas as instâncias do mesmo numero_processo
 */
export interface ProcessoUnificado extends Omit<Acervo, 'id' | 'grau' | 'origem'> {
  id: number; // ID da instância principal (grau atual)
  grau_atual: GrauAcervo; // Grau atual do processo
  instances: ProcessoInstancia[]; // Todas as instâncias (graus) do processo
  graus_ativos: GrauAcervo[]; // Lista de graus onde o processo está ativo
}

/**
 * Resultado da listagem de processos unificados
 */
export interface ListarAcervoUnificadoResult {
  processos: ProcessoUnificado[];
  total: number; // Total de processos únicos (não instâncias)
  pagina: number;
  limite: number;
  totalPaginas: number;
}

