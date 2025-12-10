import { z } from 'zod';
import { assistenteSchema } from './domain';

export type Assistente = z.infer<typeof assistenteSchema> & {
  id: number;
  created_at: string;
  updated_at: string;
};

export interface AssistentesParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  ativo?: boolean;
}

export interface AssistentesFilters {
  ativo?: boolean;
}

export type ViewMode = 'cards' | 'table';

export interface PaginacaoResult<T> {
  data: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

// Helper type for pagination metadata without data
export type PaginacaoMetadata = Omit<PaginacaoResult<any>, 'data'>;

