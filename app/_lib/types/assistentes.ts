// Tipos TypeScript para assistentes no front-end

/**
 * Tipo base do assistente (do banco)
 */
export interface Assistente {
  id: number;
  nome: string;
  descricao: string | null;
  iframe_code: string;
  ativo: boolean;
  criado_por: number;
  created_at: string;
  updated_at: string;
}

/**
 * Parâmetros para listagem
 * pagina e limite são opcionais (defaults: 1 e 50)
 */
export interface AssistentesParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  ativo?: boolean;
}

/**
 * Filtros para a UI
 */
export interface AssistentesFilters {
  ativo?: boolean;
}

/**
 * Tipo de visualização
 */
export type ViewMode = 'cards' | 'table';

/**
 * Resposta da API
 */
export interface AssistentesApiResponse {
  success: boolean;
  data?: {
    assistentes: Assistente[];
    paginacao: {
      total: number;
      pagina: number;
      limite: number;
      totalPaginas: number;
    };
  };
  error?: string;
}

/**
 * Dados para criar assistente
 */
export interface CriarAssistenteData {
  nome: string;
  descricao?: string;
  iframe_code: string;
}

/**
 * Dados para atualizar assistente
 */
export interface AtualizarAssistenteData {
  nome?: string;
  descricao?: string;
  iframe_code?: string;
  ativo?: boolean;
}