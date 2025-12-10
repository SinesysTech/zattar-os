'use server';

import { revalidatePath } from 'next/cache';
import { conciliacaoService } from '../services/conciliacao';
import { 
    ImportarExtratoDTO, 
    ConciliarManualDTO, 
    ConciliarAutomaticaDTO 
} from '../types/conciliacao';

// Actions para Conciliação Bancária

export async function actionImportarExtrato(formData: FormData) {
    try {
        const contaBancariaId = Number(formData.get('contaBancariaId'));
        const tipoArquivo = formData.get('tipoArquivo') as 'ofx' | 'csv';
        const arquivo = formData.get('arquivo') as File;

        if (!contaBancariaId || !tipoArquivo || !arquivo) {
            throw new Error('Dados inválidos para importação.');
        }

        const dto: ImportarExtratoDTO = {
            contaBancariaId,
            tipoArquivo,
            arquivo,
            nomeArquivo: arquivo.name
        };

        const resultado = await conciliacaoService.importarExtrato(dto);
        revalidatePath('/financeiro/conciliacao-bancaria');
        return { success: true, data: resultado };
    } catch (error) {
        console.error('Erro ao importar extrato:', error);
        return { success: false, error: 'Falha ao importar extrato.' };
    }
}

export async function actionConciliarManual(dto: ConciliarManualDTO) {
    try {
        const resultado = await conciliacaoService.conciliarManual(dto);
        revalidatePath('/financeiro/conciliacao-bancaria');
        return { success: true, data: resultado };
    } catch (error) {
        console.error('Erro na conciliação manual:', error);
        return { success: false, error: 'Falha ao conciliar transação.' };
    }
}

export async function actionObterSugestoes(transacaoId: number) {
    try {
        const sugestoes = await conciliacaoService.obterSugestoes(transacaoId);
        return { success: true, data: sugestoes };
    } catch (error) {
        console.error('Erro ao obter sugestões:', error);
        return { success: false, error: 'Falha ao buscar sugestões.' };
    }
}

export async function actionBuscarLancamentosManuais(params: any) {
    try {
        const lancamentos = await conciliacaoService.buscarLancamentosCandidatos(params);
        return { success: true, data: lancamentos };
    } catch (error) {
        console.error('Erro ao buscar lançamentos:', error);
        return { success: false, error: 'Falha ao buscar lançamentos.' };
    }
}

export async function actionConciliarAutomaticamente(dto: ConciliarAutomaticaDTO) {
    try {
        // Implementar no serviço futuramente
        // const resultado = await conciliacaoService.conciliarAutomaticamente(dto);
        revalidatePath('/financeiro/conciliacao-bancaria');
        return { success: true, message: 'Conciliação automática iniciada.' };
    } catch (error) {
        console.error('Erro na conciliação automática:', error);
        return { success: false, error: 'Falha ao executar conciliação automática.' };
    }
}
