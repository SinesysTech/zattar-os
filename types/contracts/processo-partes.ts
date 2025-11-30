import type {
  ProcessoParte,
  ParteComDadosCompletos,
  ProcessoComParticipacao,
  EntidadeTipoProcessoParte,
  PoloProcessoParte,
  TipoParteProcesso,
} from '@/types/domain/processo-partes';
import type { GrauProcesso } from '@/types/domain/common';

/**
 * Parâmetros para criar um vínculo entre um processo e uma parte.
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
  grau: GrauProcesso;
  numero_processo: string;
  principal?: boolean; // Made optional
  ordem?: number; // Made optional
  status_pje?: string;
  situacao_pje?: string;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  dados_pje_completo?: Record<string, unknown>;
  ultima_atualizacao_pje?: string;
}

/**
 * Parâmetros para atualizar um vínculo existente entre processo e parte.
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
  grau?: GrauProcesso;
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

export type OrdenarPorProcessoParte =
  | 'polo'
  | 'ordem'
  | 'tipo_parte'
  | 'principal'
  | 'created_at'
  | 'updated_at';
export type OrdemProcessoParte = 'asc' | 'desc';

/**
 * Parâmetros para listar as participações de partes em processos.
 */
export interface ListarProcessoPartesParams {
  pagina?: number;
  limite?: number;
  tipo_entidade?: EntidadeTipoProcessoParte;
  entidade_id?: number;
  processo_id?: number;
  trt?: string;
  grau?: GrauProcesso;
  numero_processo?: string;
  polo?: PoloProcessoParte;
  tipo_parte?: TipoParteProcesso;
  principal?: boolean;
  ordenar_por?: OrdenarPorProcessoParte;
  ordem?: OrdemProcessoParte;
}

/**
 * Resultado da listagem de participações de partes em processos.
 */
export interface ListarProcessoPartesResult {
  processoPartes: ProcessoParte[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Parâmetros para buscar as partes de um processo específico.
 */
export interface BuscarPartesPorProcessoParams {
  processo_id: number;
  polo?: PoloProcessoParte;
}

/**
 * Parâmetros para buscar os processos em que uma entidade específica participa.
 */
export interface BuscarProcessosPorEntidadeParams {
  tipo_entidade: EntidadeTipoProcessoParte;
  entidade_id: number;
}

/**
 * Parâmetros para vincular uma parte a um processo.
 */
export interface VincularParteProcessoParams {
  processo_id: number;
  tipo_entidade: EntidadeTipoProcessoParte;
  entidade_id: number;
  id_pje: number;
  id_pessoa_pje?: number; // Adicionado
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  trt: string;
  grau: GrauProcesso;
  numero_processo: string;
  principal?: boolean;
  ordem?: number;
  dados_pje_completo?: Record<string, unknown>; // Adicionado
}

/**
 * Parâmetros para desvincular uma parte de um processo.
 * Apenas o id é obrigatório - os demais campos são opcionais
 * para identificação alternativa.
 */
export interface DesvincularParteProcessoParams {
  id: number;
  processo_id?: number;
  tipo_entidade?: EntidadeTipoProcessoParte;
  entidade_id?: number;
}
