'use server';

import { LancamentosService } from '../services/lancamentos';
import { Lancamento } from '../types/lancamentos';
import { revalidatePath } from 'next/cache';

// Tipos explícitos para entrada das actions (DTOs simplificados baseados em Partial<Lancamento>)
type CriarLancamentoInput = Partial<Lancamento>;
type AtualizarLancamentoInput = Partial<Lancamento>;

export async function actionCriarLancamento(dados: CriarLancamentoInput) {
    try {
        const lancamento = await LancamentosService.criar(dados);
        revalidatePath('/financeiro');
        return { sucesso: true, data: lancamento };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}

export async function actionAtualizarLancamento(id: number, dados: AtualizarLancamentoInput) {
    try {
        const lancamento = await LancamentosService.atualizar(id, dados);
        revalidatePath('/financeiro');
        return { sucesso: true, data: lancamento };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}

export async function actionConfirmarLancamento(id: number) {
    try {
        const lancamento = await LancamentosService.atualizar(id, {
            status: 'confirmado',
            dataEfetivacao: new Date().toISOString()
        });
        revalidatePath('/financeiro');
        return { sucesso: true, data: lancamento };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}

export async function actionCancelarLancamento(id: number) {
    try {
        const lancamento = await LancamentosService.atualizar(id, { status: 'cancelado' });
        revalidatePath('/financeiro');
        return { sucesso: true, data: lancamento };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}

export async function actionEstornarLancamento(id: number) {
    try {
        const lancamento = await LancamentosService.atualizar(id, { status: 'estornado' });
        revalidatePath('/financeiro');
        return { sucesso: true, data: lancamento };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}
