// Tipos e interfaces para o serviço de pendentes de manifestação

/**
 * Grau do processo
 */
export type GrauPendente = 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior';

/**
 * Campos disponíveis para ordenação
 */
export type OrdenarPorPendente =
  | 'data_prazo_legal_parte'
  | 'data_autuacao'
  | 'numero_processo'
  | 'nome_parte_autora'
  | 'nome_parte_re'
  | 'data_arquivamento'
  | 'data_ciencia_parte'
  | 'data_criacao_expediente'
  | 'prioridade_processual'
  | 'trt'
  | 'grau'
  | 'descricao_orgao_julgador'
  | 'classe_judicial'
  | 'tipo_expediente_id'
  | 'responsavel_id' // TODO: Implementar ordenação por nome do responsável (join com usuarios)
  | 'created_at'
  | 'updated_at';

/**
 * Campos disponíveis para agrupamento
 * NÃO incluir processo_id ou id_pje isoladamente (precisaria de TRT + grau para unicidade)
 */
export type AgruparPorPendente =
  | 'trt'
  | 'grau'
  | 'responsavel_id'
  | 'classe_judicial'
  | 'codigo_status_processo'
  | 'orgao_julgador'
  | 'mes_autuacao'
  | 'ano_autuacao'
  | 'prazo_vencido'
  | 'mes_prazo_legal';

/**
 * Direção da ordenação
 */
export type OrdemPendente = 'asc' | 'desc';

/**
 * Registro de pendente de manifestação completo baseado no schema do banco (tabela: expedientes)
 */
export interface PendenteManifestacao {
  id: number;
  id_pje: number;
  advogado_id: number;
  processo_id: number | null;
  trt: string;
  grau: GrauPendente;
  numero_processo: string;
  descricao_orgao_julgador: string;
  classe_judicial: string;
  numero: number;
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
  id_documento: number | null;
  data_ciencia_parte: string | null; // ISO timestamp
  data_prazo_legal_parte: string | null; // ISO timestamp
  data_criacao_expediente: string | null; // ISO timestamp
  prazo_vencido: boolean;
  sigla_orgao_julgador: string | null;
  baixado_em: string | null; // ISO timestamp - data de baixa do expediente
  protocolo_id: string | null; // ID do protocolo quando houve protocolo de peça (pode conter números e letras)
  justificativa_baixa: string | null; // Justificativa quando não houve protocolo
  responsavel_id: number | null;
  tipo_expediente_id: number | null; // Tipo de expediente associado
  descricao_arquivos: string | null; // Descrição ou referência a arquivos relacionados
  arquivo_nome: string | null; // Nome do arquivo PDF no Backblaze B2
  arquivo_url: string | null; // URL pública do arquivo no Backblaze B2
  arquivo_key: string | null; // Chave (path) do arquivo no bucket
  arquivo_bucket: string | null; // Nome do bucket no Backblaze B2
  observacoes: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Parâmetros para listar pendentes de manifestação
 */
export interface ListarPendentesParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Filtros básicos
  trt?: string;
  grau?: GrauPendente;
  responsavel_id?: number | 'null'; // 'null' string para processos sem responsável
  sem_responsavel?: boolean;

  // Busca textual
  busca?: string; // Busca em numero_processo, nome_parte_autora, nome_parte_re, descricao_orgao_julgador, classe_judicial, sigla_orgao_julgador

  // Filtros específicos
  numero_processo?: string;
  nome_parte_autora?: string;
  nome_parte_re?: string;
  descricao_orgao_julgador?: string;
  sigla_orgao_julgador?: string;
  classe_judicial?: string;
  codigo_status_processo?: string;
  segredo_justica?: boolean;
  juizo_digital?: boolean;
  processo_id?: number; // Filtrar por processo relacionado no acervo - apenas filtro, não agrupamento

  // Filtros específicos de pendentes
  baixado?: boolean; // true = apenas baixados, false = apenas pendentes
  prazo_vencido?: boolean;
  tipo_expediente_id?: number | 'null'; // Filtrar por tipo de expediente ('null' para sem tipo)
  sem_tipo?: boolean; // true = apenas expedientes sem tipo atribuído
  data_prazo_legal_inicio?: string; // ISO date
  data_prazo_legal_fim?: string; // ISO date
  data_ciencia_inicio?: string; // ISO date
  data_ciencia_fim?: string; // ISO date
  data_criacao_expediente_inicio?: string; // ISO date
  data_criacao_expediente_fim?: string; // ISO date

  // Filtros de data (comuns)
  data_autuacao_inicio?: string; // ISO date
  data_autuacao_fim?: string; // ISO date
  data_arquivamento_inicio?: string; // ISO date
  data_arquivamento_fim?: string; // ISO date

  // Ordenação
  ordenar_por?: OrdenarPorPendente;
  ordem?: OrdemPendente;

  // Agrupamento
  agrupar_por?: AgruparPorPendente;
  incluir_contagem?: boolean; // Padrão: true quando agrupar_por está presente
}

/**
 * Resultado da listagem padrão (sem agrupamento)
 */
export interface ListarPendentesResult {
  pendentes: PendenteManifestacao[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Item de agrupamento
 */
export interface AgrupamentoPendente {
  grupo: string;
  quantidade: number;
  pendentes?: PendenteManifestacao[]; // Opcional: apenas se incluir_contagem=false
}

/**
 * Resultado da listagem com agrupamento
 */
export interface ListarPendentesAgrupadoResult {
  agrupamentos: AgrupamentoPendente[];
  total: number;
}
