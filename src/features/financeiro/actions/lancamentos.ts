'use server';

import { LancamentosService } from '../services/lancamentos';
import { Lancamento, ListarLancamentosParams, ResumoVencimentos } from '../types/lancamentos';
import { revalidatePath } from 'next/cache';

// ============================================================================
// Types - Response padronizado (success/error)
// ============================================================================

type CriarLancamentoInput = Partial<Lancamento>;
type AtualizarLancamentoInput = Partial<Lancamento>;

export interface ListarLancamentosResult {
    dados: Lancamento[];
    meta: {
        total: number;
        pagina: number;
        limite: number;
    };
    resumo: ResumoVencimentos;
}

// ============================================================================
// Server Actions - CRUD
// ============================================================================

/**
 * Lista lançamentos com paginação e resumo de vencimentos
 */
export async function actionListarLancamentos(params: ListarLancamentosParams) {
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
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Exclui um lançamento
 */
export async function actionExcluirLancamento(id: number) {
    try {
        await LancamentosService.excluir(id);
        revalidatePath('/financeiro');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Cria um novo lançamento
 */
export async function actionCriarLancamento(dados: CriarLancamentoInput) {
    try {
        const lancamento = await LancamentosService.criar(dados);
        revalidatePath('/financeiro');
        return { success: true, data: lancamento };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Atualiza um lançamento existente
 */
export async function actionAtualizarLancamento(id: number, dados: AtualizarLancamentoInput) {
    try {
        const lancamento = await LancamentosService.atualizar(id, dados);
        revalidatePath('/financeiro');
        return { success: true, data: lancamento };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Confirma (efetiva) um lançamento
 */
export async function actionConfirmarLancamento(id: number) {
    try {
        const lancamento = await LancamentosService.atualizar(id, {
            status: 'confirmado',
            dataEfetivacao: new Date().toISOString()
        });
        revalidatePath('/financeiro');
        return { success: true, data: lancamento };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Cancela um lançamento
 */
export async function actionCancelarLancamento(id: number) {
    try {
        const lancamento = await LancamentosService.atualizar(id, { status: 'cancelado' });
        revalidatePath('/financeiro');
        return { success: true, data: lancamento };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Estorna um lançamento
 */
export async function actionEstornarLancamento(id: number) {
    try {
        const lancamento = await LancamentosService.atualizar(id, { status: 'estornado' });
        revalidatePath('/financeiro');
        return { success: true, data: lancamento };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
