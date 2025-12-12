import { z } from 'zod';

export const STATUS_LABELS = {
  true: 'Ativo',
  false: 'Inativo',
} as const;

export const assistenteSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres'),
  descricao: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional().nullable(),
  iframe_code: z.string().min(1, 'Código do iframe é obrigatório'),
  ativo: z.boolean().default(true),
  criado_por: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const criarAssistenteSchema = assistenteSchema.pick({
  nome: true,
  descricao: true,
  iframe_code: true,
});

export const atualizarAssistenteSchema = assistenteSchema.pick({
  nome: true,
  descricao: true,
  iframe_code: true,
  ativo: true,
}).partial();

export type AssistenteSchema = z.infer<typeof assistenteSchema>;
export type CriarAssistenteInput = z.infer<typeof criarAssistenteSchema>;
export type AtualizarAssistenteInput = z.infer<typeof atualizarAssistenteSchema>;

// Types originally in types.ts

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
export type PaginacaoMetadata = Omit<PaginacaoResult<unknown>, 'data'>;
