/**
 * Tipos para gerenciamento de advogados
 */

/**
 * Dados de um advogado
 */
export interface Advogado {
  id: number;
  nome_completo: string;
  cpf: string;
  oab: string;
  uf_oab: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Dados para criar um novo advogado
 */
export interface CriarAdvogadoParams {
  nome_completo: string;
  cpf: string;
  oab: string;
  uf_oab: string;
}

/**
 * Dados para atualizar um advogado (todos os campos opcionais exceto id)
 */
export interface AtualizarAdvogadoParams {
  nome_completo?: string;
  cpf?: string;
  oab?: string;
  uf_oab?: string;
}

/**
 * Parâmetros para listar advogados
 */
export interface ListarAdvogadosParams {
  pagina?: number;
  limite?: number;
  busca?: string; // Busca em nome_completo, cpf, oab
  oab?: string;
  uf_oab?: string;
  com_credenciais?: boolean; // Filtrar apenas advogados com credenciais ativas
}

/**
 * Resultado da listagem de advogados
 */
export interface ListarAdvogadosResult {
  advogados: Advogado[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

