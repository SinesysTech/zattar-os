'use server';

import { LancamentosRepository } from '@/core/financeiro/lancamentos/repository';
import { CriarContaPagarDTO, AtualizarContaPagarDTO } from '@/backend/types/financeiro/contas-pagar.types';
// Using backend types for DTOs for now as we haven't created consolidated DTOs in core yet, 
// or should use the types from lancamentos/domain if they cover it.
// lancamentos/domain.ts has `Lancamento` interface but not explicit DTOs for creation yet, 
// let's assume we pass partials or define simple inputs here.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function actionCriarLancamento(dados: any) {
    try {
        const lancamento = await LancamentosRepository.criar(dados);
        revalidatePath('/financeiro');
        return { sucesso: true, data: lancamento };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}

export async function actionAtualizarLancamento(id: number, dados: any) {
    try {
        const lancamento = await LancamentosRepository.atualizar(id, dados);
        revalidatePath('/financeiro');
        return { sucesso: true, data: lancamento };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}

export async function actionConfirmarLancamento(id: number) {
    //TODO: Implementar lógica de confirmação (setar status pago/recebido)
    try {
        const lancamento = await LancamentosRepository.atualizar(id, { status: 'confirmado', dataEfetivacao: new Date().toISOString() });
        revalidatePath('/financeiro');
        return { sucesso: true, data: lancamento };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}

export async function actionCancelarLancamento(id: number) {
    try {
        const lancamento = await LancamentosRepository.atualizar(id, { status: 'cancelado' });
        revalidatePath('/financeiro');
        return { sucesso: true, data: lancamento };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}

export async function actionEstornarLancamento(id: number) {
    try {
        const lancamento = await LancamentosRepository.atualizar(id, { status: 'estornado' });
        revalidatePath('/financeiro');
        return { sucesso: true, data: lancamento };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}
