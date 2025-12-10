'use server';

import { ObrigacoesRepository } from '@/core/financeiro/obrigacoes-juridicas/repository';
import { LancamentosRepository } from '@/core/financeiro/lancamentos/repository';

export async function actionObterResumoObrigacoes() {
    // This would typically involve efficient aggregation queries.
    // For now, implementing basic fetching to serve the widget.
    try {
        const today = new Date().toISOString().split('T')[0];

        // Example logic:
        const parcelasPendentes = await ObrigacoesRepository.listarParcelasComLancamentos({
            dataVencimentoFim: today // Vencidas?
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
        const inconsistencias = await ObrigacoesRepository.detectarInconsistencias();
        return {
            sucesso: true,
            data: inconsistencias // List of faulty items
        };
    } catch (error: any) {
        return { sucesso: false, erro: error.message };
    }
}
