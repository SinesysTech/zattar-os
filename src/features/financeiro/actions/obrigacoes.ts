'use server';

import { ObrigacoesService } from '../services/obrigacoes';
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

export async function actionObterResumoObrigacoes() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Example logic from legacy
        const parcelasPendentes = await ObrigacoesService.listarParcelasComLancamentos({
            dataVencimentoFim: today
        });

        // Filter in memory for demo
        const vencidas = parcelasPendentes.filter(p => p.status === 'pendente' && p.dataVencimento < today);

        return {
            sucesso: true,
            data: {
                totalVencidas: vencidas.length,
                valorTotalVencido: vencidas.reduce((acc, p) => acc + p.valor, 0)
            }
        };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}

export async function actionObterAlertasFinanceiros() {
    try {
        const inconsistencias = await ObrigacoesService.detectarInconsistencias();
        return {
            sucesso: true,
            data: inconsistencias // List of faulty items
        };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}
