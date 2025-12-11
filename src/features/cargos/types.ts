/**
 * Types and schemas for Cargos Feature
 */

import { z } from 'zod';

// ============================================================================
// Interfaces
// ============================================================================

export interface Cargo {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CriarCargoDTO {
  nome: string;
  descricao?: string;
  ativo?: boolean;
}

export interface AtualizarCargoDTO {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
}

export interface ListarCargosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  ativo?: boolean;
  ordenarPor?: 'nome' | 'createdAt' | 'updatedAt'; // Mapped to DB snake_case in Repo
  ordem?: 'asc' | 'desc';
}

export interface ListarCargosResponse {
  items: Cargo[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
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

// ============================================================================
// Zod Schemas
// ============================================================================

export const criarCargoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
  ativo: z.boolean().optional().default(true),
});

export const atualizarCargoSchema = criarCargoSchema.partial();
