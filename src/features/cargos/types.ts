/**
 * Types for Cargos Feature
 */

export interface Cargo {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface ListarCargosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  ativo?: boolean;
  ordenarPor?: 'nome' | 'createdAt' | 'updatedAt';
  ordem?: 'asc' | 'desc';
}

export interface ListarCargosResponse {
  items: Cargo[];
  paginacao: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

export interface CriarCargoDTO {
  nome: string;
  descricao?: string;
  ativo?: boolean;
  created_by?: number;
}

export interface AtualizarCargoDTO {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
}

export interface CargoComUsuariosError {
  error: string;
  cargoId: number;
  cargoNome: string;
  totalUsuarios: number;
  usuarios: Array<{
    id: number;
    nome_completo: string;
    email_corporativo: string;
  }>;
}
