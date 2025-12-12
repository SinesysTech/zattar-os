'use server';

import { revalidatePath } from 'next/cache';
import { PlanoContasService } from '../services/plano-contas';
import { CriarPlanoContaDTO, AtualizarPlanoContaDTO, PlanoContasFilters } from '../domain/plano-contas';

export async function actionListarPlanoContas(filters?: PlanoContasFilters) {
    try {
        const data = await PlanoContasService.listarContas(filters);
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao listar plano de contas:', error);
        return { success: false, error: 'Falha ao carregar plano de contas.' };
    }
}

export async function actionCriarConta(dto: CriarPlanoContaDTO) {
    try {
        const data = await PlanoContasService.criar(dto);
        revalidatePath('/financeiro/plano-contas');
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        return { success: false, error: 'Falha ao criar conta.' };
    }
}

export async function actionAtualizarConta(dto: AtualizarPlanoContaDTO) {
    try {
        const data = await PlanoContasService.atualizar(dto);
        revalidatePath('/financeiro/plano-contas');
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao atualizar conta:', error);
        return { success: false, error: 'Falha ao atualizar conta.' };
    }
}

export async function actionExcluirConta(id: number) {
    try {
        await PlanoContasService.excluir(id);
        revalidatePath('/financeiro/plano-contas');
        return { success: true };
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        return { success: false, error: 'Falha ao excluir conta.' };
    }
}
