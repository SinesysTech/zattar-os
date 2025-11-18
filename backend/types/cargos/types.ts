/**
 * Types e interfaces para o módulo de Cargos
 * Cargos são usados para organização interna de usuários (sem relação com permissões)
 */

/**
 * Interface principal de Cargo
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

/**
 * DTO para criar novo cargo
 */
export interface CriarCargoDTO {
  nome: string;
  descricao?: string;
  ativo?: boolean;
}

/**
 * DTO para atualizar cargo existente
 */
export interface AtualizarCargoDTO {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
}

/**
 * Parâmetros para listagem de cargos
 */
export interface ListarCargosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  ativo?: boolean;
  ordenarPor?: 'nome' | 'created_at' | 'updated_at';
  ordem?: 'asc' | 'desc';
}

/**
 * Resposta paginada de listagem de cargos
 */
export interface ListarCargosResponse {
  items: Cargo[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
}

/**
 * Erro ao tentar deletar cargo com usuários associados
 */
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

/**
 * Type guard para verificar se é um Cargo válido
 */
export const isCargo = (obj: unknown): obj is Cargo => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'nome' in obj &&
    'ativo' in obj
  );
};

/**
 * Validar dados de criação de cargo
 */
export const validarCriarCargoDTO = (data: unknown): data is CriarCargoDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as CriarCargoDTO;

  // Nome é obrigatório e deve ser string não vazia
  if (!dto.nome || typeof dto.nome !== 'string' || dto.nome.trim() === '') {
    return false;
  }

  // Descrição é opcional, mas se fornecida deve ser string
  if (dto.descricao !== undefined && typeof dto.descricao !== 'string') {
    return false;
  }

  // Ativo é opcional, mas se fornecido deve ser boolean
  if (dto.ativo !== undefined && typeof dto.ativo !== 'boolean') {
    return false;
  }

  return true;
};

/**
 * Validar dados de atualização de cargo
 */
export const validarAtualizarCargoDTO = (data: unknown): data is AtualizarCargoDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as AtualizarCargoDTO;

  // Pelo menos um campo deve ser fornecido
  if (!dto.nome && !dto.descricao && dto.ativo === undefined) {
    return false;
  }

  // Nome, se fornecido, deve ser string não vazia
  if (dto.nome !== undefined && (typeof dto.nome !== 'string' || dto.nome.trim() === '')) {
    return false;
  }

  // Descrição, se fornecida, deve ser string
  if (dto.descricao !== undefined && typeof dto.descricao !== 'string') {
    return false;
  }

  // Ativo, se fornecido, deve ser boolean
  if (dto.ativo !== undefined && typeof dto.ativo !== 'boolean') {
    return false;
  }

  return true;
};
