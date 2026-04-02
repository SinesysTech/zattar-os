import { z } from 'zod';

// =============================================================================
// CONSTANTES
// =============================================================================

export const LIMITE_DEFAULT = 50;
export const LIMITE_MAX = 100;

export const ORDENAR_POR_OPTIONS = [
    'tipoExpediente',
    'createdAt',
    'updatedAt',
] as const;

export const ORDEM_OPTIONS = ['asc', 'desc'] as const;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Entidade Tipo de Expediente (Domínio)
 * Representa um tipo de expediente no sistema.
 */
export interface TipoExpediente {
    id: number;
    tipoExpediente: string;
    createdBy: number;
    createdAt: string; // ISO timestamp
    updatedAt: string; // ISO timestamp
}

/**
 * Entrada para criação de tipo de expediente
 */
export interface CreateTipoExpedienteInput {
    tipoExpediente: string;
}

/**
 * Entrada para atualização de tipo de expediente
 */
export interface UpdateTipoExpedienteInput {
    tipoExpediente: string;
}

// =============================================================================
// SCHEMAS ZOD
// =============================================================================

/**
 * Valida o nome do tipo de expediente
 * - Remove espaços extras (trim)
 * - Mínimo 1 caracter
 * - Máximo 255 caracteres
 */
export const validarNomeTipoExpediente = (nome: string): boolean => {
    if (!nome) return false;
    const trimmed = nome.trim();
    return trimmed.length > 0 && trimmed.length <= 255;
};

export const createTipoExpedienteSchema = z.object({
    tipoExpediente: z
        .string({ required_error: 'O nome do tipo de expediente é obrigatório' })
        .trim()
        .min(1, 'O nome deve ter pelo menos 1 caractere')
        .max(255, 'O nome deve ter no máximo 255 caracteres'),
});

export const updateTipoExpedienteSchema = createTipoExpedienteSchema;

export const listarTiposExpedientesParamsSchema = z.object({
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(LIMITE_MAX).default(LIMITE_DEFAULT),
    busca: z.string().optional(),
    ordenarPor: z.enum(ORDENAR_POR_OPTIONS).default('tipoExpediente'),
    ordem: z.enum(ORDEM_OPTIONS).default('asc'),
});

export type ListarTiposExpedientesParams = z.input<typeof listarTiposExpedientesParamsSchema>;

export interface ListarTiposExpedientesResult {
    data: TipoExpediente[];
    meta: {
        total: number;
        pagina: number;
        limite: number;
        totalPaginas: number;
    };
}
