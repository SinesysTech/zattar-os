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
 * Objeto Record com todos os tipos válidos de parte do processo
 * Serve como fonte única de verdade para validação de tipo de parte
 * Qualquer adição no enum TipoParteProcesso deve ser refletida aqui
 */
export const TIPOS_PARTE_PROCESSO_VALIDOS: Record<TipoParteProcesso, true> = {
  AUTOR: true,
  REU: true,
  RECLAMANTE: true,
  RECLAMADO: true,
  EXEQUENTE: true,
  EXECUTADO: true,
  EMBARGANTE: true,
  EMBARGADO: true,
  APELANTE: true,
  APELADO: true,
  AGRAVANTE: true,
  AGRAVADO: true,
  PERITO: true,
  MINISTERIO_PUBLICO: true,
  ASSISTENTE: true,
  TESTEMUNHA: true,
  CUSTOS_LEGIS: true,
  AMICUS_CURIAE: true,
  OUTRO: true,
};

/**
 * Registro de participação de uma entidade (cliente/parte_contraria/terceiro) em um processo.
 * 
 * Esta é a tabela de junção N:N entre processos (acervo) e entidades.
 * Cada registro representa uma participação única identificada por:
 * - processo_id + tipo_entidade + entidade_id + grau (UNIQUE constraint)
 * 
 * @example
 * // Cliente como RECLAMANTE (polo ATIVO) em processo de 1º grau
 * {
 *   processo_id: 123,
 *   tipo_entidade: 'cliente',
 *   entidade_id: 456,
 *   tipo_parte: 'RECLAMANTE',
 *   polo: 'ATIVO',
 *   grau: 'primeiro_grau',
 *   ...
 * }
 */
export interface ProcessoParte {
  id: number;
  processo_id: number;
  tipo_entidade: EntidadeTipoProcessoParte; // Tipo de entidade participante - determina qual tabela buscar (clientes/partes_contrarias/terceiros)
  entidade_id: number; // ID da entidade na tabela correspondente (FK polimórfica)
  id_pje: number; // ID da parte no PJE (idParte) - obrigatório
  id_pessoa_pje: number | null; // ID da pessoa no PJE (idPessoa) - recomendado para auditoria
  id_tipo_parte: number | null;
  tipo_parte: TipoParteProcesso; // Tipo de participante no processo (ex: RECLAMANTE, RECLAMADO) - vem do PJE
  polo: PoloProcessoParte; // Polo processual - ATIVO (autor), PASSIVO (réu), NEUTRO (perito), TERCEIRO (interveniente)
  principal: boolean; // Indica se é a parte principal no polo
  ordem: number; // Ordem de exibição dentro do polo (0-based, deve ser >= 0)
  status_pje: string | null;
  situacao_pje: string | null;
  autoridade: boolean | null;
  endereco_desconhecido: boolean | null;
  dados_pje_completo: Record<string, unknown> | null; // JSON completo retornado pelo PJE para auditoria e histórico
  trt: string;
  numero_processo: string;
  grau: GrauProcessoParte;
  ultima_atualizacao_pje: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// NOTA: Constraint UNIQUE (processo_id, tipo_entidade, entidade_id, grau)
// garante que uma entidade aparece apenas 1x por processo/grau.
// Mesma entidade pode aparecer em graus diferentes (1º e 2º grau).

/**
 * Parâmetros para criar vínculo processo-parte.
 *
 * Campos obrigatórios: processo_id, tipo_entidade, entidade_id, id_pje,
 * trt, grau, numero_processo, tipo_parte, polo, principal, ordem.
 *
 * @example
 * await criarProcessoParte({
 *   processo_id: 123,
 *   tipo_entidade: 'cliente',
 *   entidade_id: 456,
 *   id_pje: 789,
 *   id_pessoa_pje: 101112,
 *   tipo_parte: 'RECLAMANTE',
 *   polo: 'ATIVO',
 *   trt: '02',
 *   grau: 'primeiro_grau',
 *   numero_processo: '0000123-45.2024.5.02.0001',
 *   principal: true,
 *   ordem: 0,
 *   dados_pje_completo: { ...dadosDoPJE }
 * });
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
  principal: boolean;
  ordem: number;
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
  ordem: number;
  principal: boolean;
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
  ordem: number;
  principal: boolean;
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
  principal: boolean;
  ordem: number;
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
