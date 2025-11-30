import type { Audiencia, ModalidadeAudiencia, StatusAudiencia } from '@/types/domain/audiencias';
import type { GrauProcesso } from '@/types/domain/common';

/**
 * Campos disponíveis para ordenação de audiências.
 */
export type OrdenarPorAudiencia =
  | 'data_inicio'
  | 'data_fim'
  | 'hora_inicio'
  | 'hora_fim'
  | 'numero_processo'
  | 'polo_ativo_nome'
  | 'polo_passivo_nome'
  | 'status'
  | 'modalidade'
  | 'tipo_descricao'
  | 'trt'
  | 'grau'
  | 'orgao_julgador_descricao'
  | 'sala_audiencia_nome'
  | 'responsavel_id'
  | 'created_at'
  | 'updated_at';

/**
 * Direção da ordenação (ascendente ou descendente).
 */
export type OrdemAudiencia = 'asc' | 'desc';

/**
 * Parâmetros para a operação de listar audiências.
 * Define filtros, paginação e ordenação.
 */
export interface ListarAudienciasParams {
  pagina?: number;
  limite?: number;
  trt?: string;
  grau?: GrauProcesso;
  responsavel_id?: number | 'null';
  sem_responsavel?: boolean;
  busca?: string;
  numero_processo?: string;
  polo_ativo_nome?: string;
  polo_passivo_nome?: string;
  status?: StatusAudiencia | string;
  modalidade?: ModalidadeAudiencia;
  tipo_descricao?: string;
  tipo_codigo?: string;
  tipo_is_virtual?: boolean;
  data_inicio_inicio?: string;
  data_inicio_fim?: string;
  data_fim_inicio?: string;
  data_fim_fim?: string;
  ordenar_por?: OrdenarPorAudiencia;
  ordem?: OrdemAudiencia;
}

/**
 * Resultado da operação de listar audiências.
 */
export interface ListarAudienciasResult {
  audiencias: Audiencia[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Parâmetros para a operação de criar uma nova audiência manualmente.
 *
 * **Separação de Responsabilidades:**
 * Este contrato contém tanto dados de domínio quanto de infraestrutura.
 * Os serviços de backend devem fazer o mapeamento explícito:
 *
 * - **Dados de Domínio** (persistidos na entidade `Audiencia`):
 *   - `processo_id`, `advogado_id`, `data_inicio`, `data_fim`
 *   - `tipo_audiencia_id`, `observacoes`, `responsavel_id`
 *
 * - **Dados de Infraestrutura** (persistidos via `AudienciaInfra`):
 *   - `sala_audiencia_id`, `url_audiencia_virtual`, `endereco_presencial`
 *   - Estes campos não fazem parte da entidade de domínio pura
 */
export interface CriarAudienciaParams {
  processo_id: number;
  advogado_id: number;
  data_inicio: string;
  data_fim: string;
  tipo_audiencia_id?: number;
  sala_audiencia_id?: number;
  url_audiencia_virtual?: string;
  endereco_presencial?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    pais?: string;
    cep?: string;
  };
  observacoes?: string;
  responsavel_id?: number;
}
