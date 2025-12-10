'use server';

import { ObrigacoesService } from '@/core/financeiro/obrigacoes-juridicas/service';
import { revalidatePath } from 'next/cache';

export async function actionSincronizarParcela(parcelaId: number, forcar: boolean = false) {
    try {
        const result = await ObrigacoesService.sincronizarParcela(parcelaId, forcar);
        revalidatePath('/financeiro');
        revalidatePath(`/financeiro/obrigacoes`);
        return result;
    } catch (error: any) {
        return { sucesso: false, mensagem: error.message };
    }
}

export async function actionRegistrarDeclaracao(parcelaId: number, urlArquivo: string) {
    try {
        await ObrigacoesService.registrarDeclaracao(parcelaId, urlArquivo);
        revalidatePath('/financeiro');
        return { sucesso: true };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}

export async function actionGerarRepasse(parcelaId: number, urlArquivo: string, dataRepasse: string) {
    try {
        await ObrigacoesService.registrarComprovanteRepasse(parcelaId, urlArquivo, dataRepasse);
        revalidatePath('/financeiro');
        return { sucesso: true };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}

export async function actionSincronizarAcordo(acordoId: number, forcar: boolean = false) {
    try {
        const result = await ObrigacoesService.sincronizarAcordo(acordoId, forcar);
        revalidatePath('/financeiro');
        return result;
    } catch (error: any) {
        return { sucesso: false, mensagem: error.message };
    }
}
