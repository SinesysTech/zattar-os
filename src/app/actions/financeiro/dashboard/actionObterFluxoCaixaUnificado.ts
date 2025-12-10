'use server';

import { FluxoCaixaService } from '@/core/financeiro/fluxo-caixa/service';

export async function actionObterFluxoCaixaUnificado(dataInicio: string, dataFim: string) {
    try {
        const dados = await FluxoCaixaService.getFluxoCaixaUnificado({ dataInicio, dataFim });
        return { sucesso: true, data: dados };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}
