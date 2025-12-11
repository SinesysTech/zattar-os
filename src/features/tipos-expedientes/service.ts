import type {
    CreateTipoExpedienteInput,
    ListarTiposExpedientesParams,
    ListarTiposExpedientesResult,
    TipoExpediente,
    UpdateTipoExpedienteInput,
} from './domain';
import {
    createTipoExpedienteSchema,
    listarTiposExpedientesParamsSchema,
    updateTipoExpedienteSchema,
} from './domain';
import * as repository from './repository';

// =============================================================================
// SERVICE METHODS
// =============================================================================

/**
 * Listar tipos de expedientes com paginação e filtros
 */
export async function listar(
    params: Partial<ListarTiposExpedientesParams> = {}
): Promise<ListarTiposExpedientesResult> {
    // Validar e preencher defaults
    const parsed = listarTiposExpedientesParamsSchema.safeParse(params);

    if (!parsed.success) {
        throw new Error(`Parâmetros inválidos: ${parsed.error.message}`);
    }

    return repository.findAll(parsed.data);
}

/**
 * Buscar tipo de expediente por ID
 */
export async function buscar(id: number): Promise<TipoExpediente | null> {
    if (!id || id <= 0) {
        throw new Error('ID inválido fornecido');
    }
    return repository.findById(id);
}

/**
 * Criar novo tipo de expediente
 */
export async function criar(
    data: CreateTipoExpedienteInput,
    userId: number
): Promise<TipoExpediente> {
    // Validar input
    const parsed = createTipoExpedienteSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error(parsed.error.errors[0].message);
    }

    const { tipoExpediente } = parsed.data;

    // Validar unicidade
    const existente = await repository.findByNome(tipoExpediente);
    if (existente) {
        throw new Error('Tipo de expediente já cadastrado');
    }

    // Criar
    return repository.create(parsed.data, userId);
}

/**
 * Atualizar tipo de expediente
 */
export async function atualizar(
    id: number,
    data: UpdateTipoExpedienteInput
): Promise<TipoExpediente> {
    if (!id || id <= 0) {
        throw new Error('ID inválido fornecido');
    }

    // Validar input
    const parsed = updateTipoExpedienteSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error(parsed.error.errors[0].message);
    }

    const { tipoExpediente } = parsed.data;

    // Verificar se existe
    const current = await repository.findById(id);
    if (!current) {
        throw new Error('Tipo de expediente não encontrado');
    }

    // Se nome mudou, validar unicidade
    if (tipoExpediente !== current.tipoExpediente) {
        const existente = await repository.findByNome(tipoExpediente);
        if (existente && existente.id !== id) {
            throw new Error('Tipo de expediente já cadastrado');
        }
    }

    // Atualizar
    return repository.update(id, parsed.data);
}

/**
 * Deletar tipo de expediente
 */
export async function deletar(id: number): Promise<void> {
    if (!id || id <= 0) {
        throw new Error('ID inválido fornecido');
    }

    // Verificar se existe
    const current = await repository.findById(id);
    if (!current) {
        throw new Error('Tipo de expediente não encontrado');
    }

    // Verificar uso
    const emUso = await repository.isInUse(id);
    if (emUso) {
        throw new Error('Tipo de expediente está em uso e não pode ser excluído');
    }

    // Deletar
    await repository.deleteById(id);
}
