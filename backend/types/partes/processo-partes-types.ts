// Tipos e interfaces para o serviço de processo_partes (relacionamento N:N)

import type { GrauAcervo } from '@/backend/types/acervo/types';

/**
 * Tipo de entidade participante do processo
 */
export type EntidadeTipoProcessoParte = 'cliente' | 'parte_contraria' | 'terceiro';

/**
 * Grau do processo (primeiro ou segundo grau)
 */
export type GrauProcessoParte = GrauAcervo;

/**
 * Polo processual
 */
export type PoloProcessoParte = 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO';

/**
 * Tipo de participante no processo
 */
export type TipoParteProcesso =
  | 'AUTOR'
  | 'REU'
  | 'RECLAMANTE'
  | 'RECLAMADO'
  | 'EXEQUENTE'
  | 'EXECUTADO'
  | 'EMBARGANTE'
  | 'EMBARGADO'
  | 'APELANTE'
  | 'APELADO'
  | 'AGRAVANTE'
  | 'AGRAVADO'
  | 'PERITO'
  | 'MINISTERIO_PUBLICO'
  | 'ASSISTENTE'
  | 'TESTEMUNHA'
  | 'CUSTOS_LEGIS'
  | 'AMICUS_CURIAE'
  | 'OUTRO';

/**
 * Registro de participação no processo
 */
export interface ProcessoParte {
  id: number;
  processo_id: number;
  tipo_entidade: EntidadeTipoProcessoParte;
  entidade_id: number;
  id_pje: number;
  id_pessoa_pje: number | null;
  id_tipo_parte: number | null;
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  principal: boolean | null; // Indica se é a parte principal no polo
  ordem: number | null; // Ordem de exibição dentro do polo
  status_pje: string | null;
  situacao_pje: string | null;
  autoridade: boolean | null;
  endereco_desconhecido: boolean | null;
  dados_pje_completo: Record<string, unknown> | null; // JSONB
  trt: string;
  numero_processo: string;
  grau: GrauProcessoParte;
  ultima_atualizacao_pje: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Dados para criar participação no processo
 */
export interface CriarProcessoParteParams {
  processo_id: number;
  tipo_entidade: EntidadeTipoProcessoParte;
  entidade_id: number;
  id_pje: number;
  id_pessoa_pje?: number;
  id_tipo_parte?: number;
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  trt: string;
  grau: GrauProcessoParte;
  numero_processo: string;
  principal?: boolean;
  ordem?: number;
  status_pje?: string;
  situacao_pje?: string;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  dados_pje_completo?: Record<string, unknown>;
  ultima_atualizacao_pje?: string;
}

/**
 * Dados para atualizar participação no processo
 */
export interface AtualizarProcessoParteParams {
  id: number;
  processo_id?: number;
  tipo_entidade?: EntidadeTipoProcessoParte;
  entidade_id?: number;
  id_pje?: number;
  id_pessoa_pje?: number;
  id_tipo_parte?: number;
  tipo_parte?: TipoParteProcesso;
  polo?: PoloProcessoParte;
  trt?: string;
  grau?: GrauProcessoParte;
  numero_processo?: string;
  principal?: boolean;
  ordem?: number;
  status_pje?: string;
  situacao_pje?: string;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  dados_pje_completo?: Record<string, unknown>;
  ultima_atualizacao_pje?: string;
}

/**
 * Campos disponíveis para ordenação
 */
export type OrdenarPorProcessoParte =
  | 'polo'
  | 'ordem'
  | 'tipo_parte'
  | 'principal'
  | 'created_at'
  | 'updated_at';

/**
 * Direção da ordenação
 */
export type OrdemProcessoParte = 'asc' | 'desc';

/**
 * Parâmetros para listar participações
 */
export interface ListarProcessoPartesParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Filtros por entidade
  tipo_entidade?: EntidadeTipoProcessoParte;
  entidade_id?: number;

  // Filtros por processo
  processo_id?: number;
  trt?: string;
  grau?: GrauProcessoParte;
  numero_processo?: string;

  // Filtros de participação
  polo?: PoloProcessoParte;
  tipo_parte?: TipoParteProcesso;
  principal?: boolean;

  // Ordenação
  ordenar_por?: OrdenarPorProcessoParte;
  ordem?: OrdemProcessoParte;
}

/**
 * Resultado da listagem
 */
export interface ListarProcessoPartesResult {
  processoPartes: ProcessoParte[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Parâmetros para buscar partes de um processo com dados completos
 */
export interface BuscarPartesPorProcessoParams {
  processo_id: number;
  polo?: PoloProcessoParte;
}

/**
 * Parte com dados completos da entidade
 */
export interface ParteComDadosCompletos {
  id: number; // ID da participação (processo_partes.id)
  processo_id: number;
  tipo_entidade: EntidadeTipoProcessoParte;
  entidade_id: number;
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  ordem: number | null;
  principal: boolean | null;
  // Dados da entidade
  nome: string;
  tipo_pessoa: 'pf' | 'pj';
  cpf: string | null;
  cnpj: string | null;
  emails: string[] | null;
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_telefone: string | null;
  numero_telefone: string | null;
}

/**
 * Parâmetros para buscar processos de uma entidade
 */
export interface BuscarProcessosPorEntidadeParams {
  tipo_entidade: EntidadeTipoProcessoParte;
  entidade_id: number;
}

/**
 * Processo com dados da participação
 */
export interface ProcessoComParticipacao {
  id: number; // ID da participação (processo_partes.id)
  processo_id: number;
  numero_processo: string;
  trt: string;
  grau: GrauProcessoParte;
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  ordem: number | null;
  principal: boolean | null;
  // Dados do processo
  classe_judicial: string | null;
  codigo_status_processo: string | null;
  data_autuacao: string | null;
  nome_parte_autora: string | null;
  nome_parte_re: string | null;
}

/**
 * Parâmetros para vincular entidade a processo
 */
export interface VincularParteProcessoParams {
  processo_id: number;
  tipo_entidade: EntidadeTipoProcessoParte;
  entidade_id: number;
  id_pje: number;
  id_pessoa_pje?: number;
  id_tipo_parte?: number;
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  trt: string;
  grau: GrauProcessoParte;
  numero_processo: string;
  principal?: boolean;
  ordem?: number;
  status_pje?: string;
  situacao_pje?: string;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  dados_pje_completo?: Record<string, unknown>;
  ultima_atualizacao_pje?: string;
}

/**
 * Parâmetros para desvincular entidade de processo
 */
export interface DesvincularParteProcessoParams {
  id: number; // ID da participação (processo_partes.id)
}
