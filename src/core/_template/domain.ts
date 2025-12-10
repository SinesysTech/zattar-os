/**
 * _TEMPLATE DOMAIN - Entidades e Schemas de Validação
 *
 * Este arquivo demonstra o padrão para definir:
 * 1. Interfaces TypeScript (tipos estáticos)
 * 2. Schemas Zod (validação em runtime)
 *
 * CONVENÇÕES:
 * - Prefixar schemas de criação com "create" (ex: createTarefaSchema)
 * - Prefixar schemas de atualização com "update" (ex: updateTarefaSchema)
 * - Interfaces devem espelhar a estrutura do banco
 * - NUNCA importar React/Next.js aqui
 */

import { z } from 'zod';

// =============================================================================
// ENTIDADE: Tarefa (Exemplo Didático)
// =============================================================================

/**
 * Interface que espelha a tabela `tarefas` no banco
 * Representa uma tarefa completa retornada do banco
 */
export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string | null;
  concluida: boolean;
  prioridade: 'baixa' | 'media' | 'alta';
  responsavel_id: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Schema Zod para validar criação de tarefa
 * Usado para validar input do usuário antes de salvar no banco
 */
export const createTarefaSchema = z.object({
  titulo: z
    .string()
    .min(3, 'Título deve ter pelo menos 3 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  descricao: z
    .string()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .nullable()
    .optional(),
  prioridade: z.enum(['baixa', 'media', 'alta']).default('media'),
  responsavel_id: z.number().positive().nullable().optional(),
});

/**
 * Tipo inferido do schema de criação
 * Use para tipar parâmetros de funções de criação
 */
export type CreateTarefaInput = z.infer<typeof createTarefaSchema>;

/**
 * Schema Zod para validar atualização de tarefa
 * Todos os campos são opcionais (partial update)
 */
export const updateTarefaSchema = z.object({
  titulo: z
    .string()
    .min(3, 'Título deve ter pelo menos 3 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .optional(),
  descricao: z
    .string()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .nullable()
    .optional(),
  concluida: z.boolean().optional(),
  prioridade: z.enum(['baixa', 'media', 'alta']).optional(),
  responsavel_id: z.number().positive().nullable().optional(),
});

/**
 * Tipo inferido do schema de atualização
 */
export type UpdateTarefaInput = z.infer<typeof updateTarefaSchema>;

// =============================================================================
// FILTROS E QUERIES
// =============================================================================

/**
 * Parâmetros para listar tarefas com filtros
 */
export interface ListTarefasParams {
  concluida?: boolean;
  prioridade?: 'baixa' | 'media' | 'alta';
  responsavel_id?: number;
  page?: number;
  limit?: number;
}
