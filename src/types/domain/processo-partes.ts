import type { GrauProcesso } from './common';
import type { TipoPessoa } from './partes';

/**
 * Define o tipo da entidade que participa do processo.
 */
export type EntidadeTipoProcessoParte = 'cliente' | 'parte_contraria' | 'terceiro';

/**
 * Define o polo processual da parte.
 */
export type PoloProcessoParte = 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO';

/**
 * Define o papel específico da parte no processo (e.g., autor, réu).
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
 * Constante com os tipos de parte válidos.
 * Usada para validação em runtime.
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
 * Representa a participação de uma entidade (cliente, parte contrária, terceiro)
 * em um processo judicial. É a tabela de ligação N:N.
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
  principal: boolean | null;
  ordem: number | null;
  status_pje: string | null;
  situacao_pje: string | null;
  autoridade: boolean | null;
  endereco_desconhecido: boolean | null;
  dados_pje_completo: Record<string, unknown> | null;
  trt: string;
  numero_processo: string | null;
  grau: GrauProcesso;
  ultima_atualizacao_pje: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Representa uma parte com seus dados básicos, retornada em listagens
 * de participantes de um processo.
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
  nome: string;
  tipo_pessoa: TipoPessoa;
  cpf: string | null;
  cnpj: string | null;
  emails: string[] | null;
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_telefone: string | null;
  numero_telefone: string | null;
}

/**
 * Representa um processo com informações sobre a participação de uma
 * entidade específica nele.
 */
export interface ProcessoComParticipacao {
  id: number; // ID da participação (processo_partes.id)
  processo_id: number;
  numero_processo: string;
  trt: string;
  grau: GrauProcesso;
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  ordem: number;
  principal: boolean;
  classe_judicial: string | null;
  codigo_status_processo: string | null;
  data_autuacao: string | null;
  nome_parte_autora: string | null;
  nome_parte_re: string | null;
}
