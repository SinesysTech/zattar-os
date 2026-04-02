'use server';

import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth';
import type {
    ListarTiposExpedientesParams,
    ListarTiposExpedientesResult,
    TipoExpediente,
    CreateTipoExpedienteInput,
    UpdateTipoExpedienteInput
} from '../domain';
import * as service from '../service';

export type ActionResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
};

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Listar tipos de expedientes
 */
export async function actionListarTiposExpedientes(
    params?: ListarTiposExpedientesParams
): Promise<ActionResponse<ListarTiposExpedientesResult>> {
    try {
        const data = await service.listar(params);
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao listar tipos de expedientes',
        };
    }
}

/**
 * Buscar tipo de expediente por ID
 */
export async function actionBuscarTipoExpediente(
    id: number
): Promise<ActionResponse<TipoExpediente | null>> {
    try {
        const data = await service.buscar(id);
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao buscar tipo de expediente',
        };
    }
}

/**
 * Criar tipo de expediente
 */
export async function actionCriarTipoExpediente(
    formData: FormData
): Promise<ActionResponse<TipoExpediente>> {
    try {
        const user = await authenticateRequest();
        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const tipoExpediente = formData.get('tipoExpediente')?.toString();

        // Validar presença de dados básicos antes de enviar pro service (que valida schema completo)
        if (!tipoExpediente) {
            return { success: false, error: 'Nome do tipo de expediente é obrigatório' };
        }

        const input: CreateTipoExpedienteInput = {
            tipoExpediente,
        };

        const data = await service.criar(input, user.id);

        revalidatePath('/app/tipos-expedientes');

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao criar tipo de expediente',
        };
    }
}

/**
 * Atualizar tipo de expediente
 */
export async function actionAtualizarTipoExpediente(
    id: number,
    formData: FormData
): Promise<ActionResponse<TipoExpediente>> {
    try {
        const user = await authenticateRequest();
        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const tipoExpediente = formData.get('tipoExpediente')?.toString();

        if (!tipoExpediente) {
            return { success: false, error: 'Nome do tipo de expediente é obrigatório' };
        }

        const input: UpdateTipoExpedienteInput = {
            tipoExpediente,
        };

        const data = await service.atualizar(id, input);

        revalidatePath('/app/tipos-expedientes');

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao atualizar tipo de expediente',
        };
    }
}

/**
 * Deletar tipo de expediente
 */
export async function actionDeletarTipoExpediente(
    id: number
): Promise<ActionResponse<void>> {
    try {
        const user = await authenticateRequest();
        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        await service.deletar(id);

        revalidatePath('/app/tipos-expedientes');

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao deletar tipo de expediente',
        };
    }
}
