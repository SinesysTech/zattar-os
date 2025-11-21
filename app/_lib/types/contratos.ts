// Tipos para integração com API de contratos no frontend

import type { Contrato, ListarContratosParams } from '@/backend/contratos/services/persistence/contrato-persistence.service';

/**
 * Resposta da API de contratos (formato padrão)
 */
export interface ContratosApiResponse {
  success: boolean;
  data: {
    contratos: Contrato[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

/**
 * Parâmetros para buscar contratos (frontend)
 */
export interface BuscarContratosParams extends Partial<ListarContratosParams> {
  pagina?: number;
  limite?: number;
  busca?: string;
  areaDireito?: 'trabalhista' | 'civil' | 'previdenciario' | 'criminal' | 'empresarial' | 'administrativo';
  tipoContrato?: 'ajuizamento' | 'defesa' | 'ato_processual' | 'assessoria' | 'consultoria' | 'extrajudicial' | 'parecer';
  tipoCobranca?: 'pro_exito' | 'pro_labore';
  status?: 'em_contratacao' | 'contratado' | 'distribuido' | 'desistencia';
  clienteId?: number;
  parteContrariaId?: number;
  responsavelId?: number;
}

/**
 * Estado de filtros da página de contratos
 */
export interface ContratosFilters {
  areaDireito?: 'trabalhista' | 'civil' | 'previdenciario' | 'criminal' | 'empresarial' | 'administrativo';
  tipoContrato?: 'ajuizamento' | 'defesa' | 'ato_processual' | 'assessoria' | 'consultoria' | 'extrajudicial' | 'parecer';
  tipoCobranca?: 'pro_exito' | 'pro_labore';
  status?: 'em_contratacao' | 'contratado' | 'distribuido' | 'desistencia';
  clienteId?: number;
  parteContrariaId?: number;
  responsavelId?: number;
}
