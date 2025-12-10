'use server';

import { ObrigacoesService } from '../services/obrigacoes';
import { revalidatePath } from 'next/cache';
import type { ParcelaObrigacao } from '../types/obrigacoes';

// ============================================================================
// Types - Response padronizado (success/error)
// ============================================================================

export interface AlertaObrigacao {
    tipo: 'vencida' | 'inconsistencia' | 'repasse_pendente' | 'sincronizacao';
    nivel: 'erro' | 'aviso' | 'info';
    mensagem: string;
    parcelaId?: number;
    acordoId?: number;
    valor?: number;
    dataVencimento?: string;
}

export interface ResumoObrigacoes {
    totalVencidas: number;
    valorTotalVencido: number;
    totalPendentes: number;
    valorTotalPendente: number;
    totalRepassesPendentes: number;
    valorRepassesPendentes: number;
}

export interface ObterResumoObrigacoesResult {
    alertas: AlertaObrigacao[];
    resumo: ResumoObrigacoes;
}

// ============================================================================
// Server Actions - CRUD
// ============================================================================

/**
 * Sincroniza uma parcela específica
 */
export async function actionSincronizarParcela(parcelaId: number, forcar: boolean = false) {
    try {
        const result = await ObrigacoesService.sincronizarParcela(parcelaId, forcar);
        revalidatePath('/financeiro');
        revalidatePath('/financeiro/obrigacoes');
        return { success: result.sucesso, message: result.mensagem };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Registra declaração de prestação de contas
 */
export async function actionRegistrarDeclaracao(parcelaId: number, urlArquivo: string) {
    try {
        await ObrigacoesService.registrarDeclaracao(parcelaId, urlArquivo);
        revalidatePath('/financeiro');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Gera repasse para cliente
 */
export async function actionGerarRepasse(parcelaId: number, urlArquivo: string, dataRepasse: string) {
    try {
        await ObrigacoesService.registrarComprovanteRepasse(parcelaId, urlArquivo, dataRepasse);
        revalidatePath('/financeiro');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Sincroniza todas as parcelas de um acordo
 */
export async function actionSincronizarAcordo(acordoId: number, forcar: boolean = false) {
    try {
        const result = await ObrigacoesService.sincronizarAcordo(acordoId, forcar);
        revalidatePath('/financeiro');
        revalidatePath('/financeiro/obrigacoes');
        return { success: result.sucesso, message: result.mensagem };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtém resumo de obrigações com alertas e métricas
 */
export async function actionObterResumoObrigacoes(): Promise<{ success: true; data: ObterResumoObrigacoesResult } | { success: false; error: string }> {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Buscar parcelas pendentes e inconsistências em paralelo
        const [parcelasPendentes, inconsistencias, repassesPendentes] = await Promise.all([
            ObrigacoesService.listarParcelasComLancamentos({ dataVencimentoFim: today }),
            ObrigacoesService.detectarInconsistencias(),
            ObrigacoesService.listarRepassesPendentes()
        ]);

        // Calcular vencidas
        const vencidas = parcelasPendentes.filter(p => p.status === 'pendente' && p.dataVencimento < today);
        const pendentes = parcelasPendentes.filter(p => p.status === 'pendente');

        // Construir alertas
        const alertas: AlertaObrigacao[] = [];

        // Alertas de vencidas
        vencidas.forEach(p => {
            alertas.push({
                tipo: 'vencida',
                nivel: 'erro',
                mensagem: `Parcela vencida em ${p.dataVencimento}`,
                parcelaId: p.id,
                acordoId: p.acordoCondenacaoId,
                valor: p.valor,
                dataVencimento: p.dataVencimento
            });
        });

        // Alertas de inconsistências
        inconsistencias.forEach(p => {
            alertas.push({
                tipo: 'inconsistencia',
                nivel: 'aviso',
                mensagem: 'Parcela sem lançamento financeiro correspondente',
                parcelaId: p.id,
                acordoId: p.acordoCondenacaoId,
                valor: p.valor
            });
        });

        // Alertas de repasses pendentes
        repassesPendentes.forEach(p => {
            alertas.push({
                tipo: 'repasse_pendente',
                nivel: 'info',
                mensagem: 'Repasse pendente de transferência',
                parcelaId: p.id,
                acordoId: p.acordoCondenacaoId,
                valor: p.valorRepasseCliente
            });
        });

        // Calcular resumo
        const resumo: ResumoObrigacoes = {
            totalVencidas: vencidas.length,
            valorTotalVencido: vencidas.reduce((acc, p) => acc + p.valor, 0),
            totalPendentes: pendentes.length,
            valorTotalPendente: pendentes.reduce((acc, p) => acc + p.valor, 0),
            totalRepassesPendentes: repassesPendentes.length,
            valorRepassesPendentes: repassesPendentes.reduce((acc, p) => acc + p.valorRepasseCliente, 0)
        };

        return {
            success: true,
            data: { alertas, resumo }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtém alertas financeiros (inconsistências)
 */
export async function actionObterAlertasFinanceiros() {
    try {
        const inconsistencias = await ObrigacoesService.detectarInconsistencias();

        const alertas: AlertaObrigacao[] = inconsistencias.map(p => ({
            tipo: 'inconsistencia' as const,
            nivel: 'aviso' as const,
            mensagem: 'Parcela sem lançamento financeiro correspondente',
            parcelaId: p.id,
            acordoId: p.acordoCondenacaoId,
            valor: p.valor
        }));

        return { success: true, data: alertas };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Lista obrigações com paginação
 */
export async function actionListarObrigacoes(params: any) {
    try {
        const dados = await ObrigacoesService.listarParcelasComLancamentos(params);

        // Calcular resumo básico
        const today = new Date().toISOString().split('T')[0];
        const vencidas = dados.filter(p => p.status === 'pendente' && p.dataVencimento < today);
        const pendentes = dados.filter(p => p.status === 'pendente');

        return {
            success: true,
            data: {
                dados,
                meta: {
                    total: dados.length,
                    pagina: params.pagina || 1,
                    limite: params.limite || 50
                },
                resumo: {
                    totalVencidas: vencidas.length,
                    valorTotalVencido: vencidas.reduce((acc, p) => acc + p.valor, 0),
                    totalPendentes: pendentes.length,
                    valorTotalPendente: pendentes.reduce((acc, p) => acc + p.valor, 0)
                }
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
