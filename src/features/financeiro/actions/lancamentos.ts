'use server';

import { LancamentosService } from '../services/lancamentos';
import { Lancamento, ListarLancamentosParams, ResumoVencimentos } from '../types/lancamentos';
import { revalidatePath } from 'next/cache';

// ============================================================================
// Types - Response padronizado (success/error)
// ============================================================================

type CriarLancamentoInput = Partial<Lancamento>;
type AtualizarLancamentoInput = Partial<Lancamento>;

type ActionResponse<T> = { success: true; data: T } | { success: false; error: string };

type ActionVoidResponse = { success: true } | { success: false; error: string };

export interface ListarLancamentosResult {
    dados: Lancamento[];
    meta: {
        total: number;
        pagina: number;
        limite: number;
    };
    resumo: ResumoVencimentos;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Erro inesperado.';
}

// ============================================================================
// Server Actions - CRUD
// ============================================================================

/**
 * Lista lançamentos com paginação e resumo de vencimentos
 */
export async function actionListarLancamentos(params: ListarLancamentosParams): Promise<ActionResponse<ListarLancamentosResult>> {
    try {
        // Buscar lançamentos e total em paralelo
        const [lancamentos, total, resumo] = await Promise.all([
            LancamentosService.listar(params),
            LancamentosService.contar(params),
            LancamentosService.buscarResumoVencimentos(params.tipo)
        ]);

        const result: ListarLancamentosResult = {
            dados: lancamentos,
            meta: {
                total,
                pagina: params.pagina || 1,
                limite: params.limite || 50
            },
            resumo
        };

        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Exclui um lançamento
 */
export async function actionExcluirLancamento(id: number): Promise<ActionVoidResponse> {
    try {
        await LancamentosService.excluir(id);
        revalidatePath('/financeiro');
        return { success: true };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Cria um novo lançamento
 */
export async function actionCriarLancamento(dados: CriarLancamentoInput): Promise<ActionResponse<Lancamento>> {
    try {
        const lancamento = await LancamentosService.criar(dados);
        revalidatePath('/financeiro');
        return { success: true, data: lancamento };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Atualiza um lançamento existente
 */
export async function actionAtualizarLancamento(id: number, dados: AtualizarLancamentoInput): Promise<ActionResponse<Lancamento>> {
    try {
        const lancamento = await LancamentosService.atualizar(id, dados);
        revalidatePath('/financeiro');
        return { success: true, data: lancamento };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Confirma (efetiva) um lançamento
 */
export async function actionConfirmarLancamento(id: number): Promise<ActionResponse<Lancamento>> {
    try {
        const lancamento = await LancamentosService.atualizar(id, {
            status: 'confirmado',
            dataEfetivacao: new Date().toISOString()
        });
        revalidatePath('/financeiro');
        return { success: true, data: lancamento };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Cancela um lançamento
 */
export async function actionCancelarLancamento(id: number): Promise<ActionResponse<Lancamento>> {
    try {
        const lancamento = await LancamentosService.atualizar(id, { status: 'cancelado' });
        revalidatePath('/financeiro');
        return { success: true, data: lancamento };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Busca um lançamento por ID
 */
export async function actionBuscarLancamento(id: number): Promise<ActionResponse<Lancamento>> {
    try {
        const lancamento = await LancamentosService.buscarPorId(id);
        if (!lancamento) return { success: false, error: 'Lançamento não encontrado' };
        return { success: true, data: lancamento };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Estorna um lançamento
 */
export async function actionEstornarLancamento(id: number): Promise<ActionResponse<Lancamento>> {
    try {
        const lancamento = await LancamentosService.atualizar(id, { status: 'estornado' });
        revalidatePath('/financeiro');
        return { success: true, data: lancamento };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}
