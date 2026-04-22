'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/app/(authenticated)/usuarios';
import type {
    ListarTiposExpedientesParams,
    ListarTiposExpedientesResult,
    TipoExpediente,
    CreateTipoExpedienteInput,
    UpdateTipoExpedienteInput
} from '../domain';
import * as service from '../service';

import type { ActionResponse } from './types';

// =============================================================================
// ACTIONS
// =============================================================================
//
// Nota de segurança:
// O repository de tipos-expedientes usa service client Supabase
// (`createDbClient` com service role), que BYPASSA RLS. As 4 policies RLS
// existentes na tabela (authenticated + is_current_user_active) só protegem
// clients com sessão do usuário. Por isso TODAS as actions deste módulo
// DEVEM chamar `requireAuth([...])` explicitamente — é a única camada de
// autorização efetiva para este caminho.
// =============================================================================

/**
 * Listar tipos de expedientes
 */
export async function actionListarTiposExpedientes(
    params?: ListarTiposExpedientesParams
): Promise<ActionResponse<ListarTiposExpedientesResult>> {
    try {
        await requireAuth(['tipos_expedientes:listar']);
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
        await requireAuth(['tipos_expedientes:visualizar']);
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
        const { userId } = await requireAuth(['tipos_expedientes:criar']);

        const tipoExpediente = formData.get('tipoExpediente')?.toString();

        if (!tipoExpediente) {
            return { success: false, error: 'Nome do tipo de expediente é obrigatório' };
        }

        const input: CreateTipoExpedienteInput = {
            tipoExpediente,
        };

        const data = await service.criar(input, userId);

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
        await requireAuth(['tipos_expedientes:editar']);

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
        await requireAuth(['tipos_expedientes:deletar']);

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
