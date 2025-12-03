import type { Representante } from '@/types/domain/representantes';
import type { ProcessoRelacionado } from '@/types/domain/processo-relacionado';
import type { ListarRepresentantesResult, OrdenarPorRepresentante, OrdemRepresentante } from '@/types/contracts/representantes';
import type { SituacaoOAB } from '@/types/domain/representantes';

/**
 * Resposta da API de representantes (formato padrão)
 */
export interface RepresentantesApiResponse {
  success: boolean;
  data: ListarRepresentantesResult;
}

/**
 * Representante com processos relacionados (estendido para uso no frontend)
 */
export type RepresentanteComProcessos = Representante & {
  processos_relacionados?: ProcessoRelacionado[];
};

/**
 * Representante com endereço e processos relacionados (estendido para uso no frontend)
 */
export type RepresentanteComEnderecoEProcessos = Representante & {
  endereco?: unknown; // Temporário, ajustar para tipo Endereco quando disponível
  processos_relacionados?: ProcessoRelacionado[];
}

/**
 * Parâmetros para buscar representantes (frontend)
 */
export interface BuscarRepresentantesParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  numero_oab?: string;
  situacao_oab?: string;
  incluirEndereco?: boolean;
  incluirProcessos?: boolean;
  ordenar_por?: OrdenarPorRepresentante;
  ordem?: OrdemRepresentante;
}

// TODO: Definir RepresentanteFormData se necessário para formulários
// export interface RepresentanteFormData {}

export interface RepresentantesFilters {
  situacao_oab?: SituacaoOAB;
}
