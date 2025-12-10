/**
 * Service de Fluxo de Caixa
 * Casos de uso e orquestração de regras de negócio
 */

import { FluxoCaixaRepository } from '../repository/fluxo-caixa';
import {
    calcularFluxoRealizado,
    calcularFluxoProjetado,
    converterParcelasEmProjecoes,
    agruparPorPeriodo,
    calcularIndicadoresSaude,
    verificarAlertasCaixa
} from '../domain/fluxo-caixa';
import type {
    FiltroFluxoCaixa,
    FluxoCaixaConsolidado,
    FluxoCaixaDiario,
    FluxoCaixaPeriodo,
    ProjecaoFluxoCaixa
} from '../domain/fluxo-caixa';

// ============================================================================
// Service Implementation
// ============================================================================

export const FluxoCaixaService = {
    /**
     * Obtém fluxo de caixa unificado (realizado + projetado)
     */
    async getFluxoCaixaUnificado(filtro: FiltroFluxoCaixa): Promise<FluxoCaixaConsolidado> {
        // 1. Buscar lançamentos realizados
        const lancamentosRealizados = await FluxoCaixaRepository.buscarLancamentosRealizados(filtro);

        // 2. Buscar lançamentos pendentes
        const lancamentosPendentes = await FluxoCaixaRepository.buscarLancamentosPendentes(filtro);

        // 3. Buscar parcelas pendentes (obrigações)
        const parcelasPendentes = await FluxoCaixaRepository.buscarParcelasPendentes(filtro);

        // 4. Calcular fluxo realizado
        const realizado = calcularFluxoRealizado(lancamentosRealizados);

        // 5. Calcular fluxo projetado
        const projetado = calcularFluxoProjetado(lancamentosPendentes, parcelasPendentes);

        // 6. Converter parcelas em projeções
        const projecoesParcelas = converterParcelasEmProjecoes(parcelasPendentes, 'recebimento');

        // 7. Converter lançamentos pendentes em projeções
        const projecoesLancamentos: ProjecaoFluxoCaixa[] = lancamentosPendentes.map(l => ({
            id: l.id,
            descricao: l.descricao,
            valor: l.valor,
            dataVencimento: l.dataVencimento || l.dataLancamento,
            tipo: l.tipo,
            origem: 'manual' as const,
            origemId: l.id,
            probabilidade: 90
        }));

        return {
            realizado,
            projetado,
            saldoTotal: realizado.saldo + projetado.saldo,
            detalhes: {
                lancamentos: lancamentosRealizados,
                projecoes: [...projecoesParcelas, ...projecoesLancamentos]
            }
        };
    },

    /**
     * Obtém fluxo de caixa diário
     */
    async getFluxoCaixaDiario(
        contaBancariaId: number,
        dataInicio: string,
        dataFim: string
    ): Promise<FluxoCaixaDiario[]> {
        return FluxoCaixaRepository.buscarMovimentacoesDiarias(contaBancariaId, dataInicio, dataFim);
    },

    /**
     * Obtém fluxo de caixa agrupado por período
     */
    async getFluxoCaixaPorPeriodo(
        filtro: FiltroFluxoCaixa,
        agrupamento: 'dia' | 'semana' | 'mes' = 'mes'
    ): Promise<FluxoCaixaPeriodo[]> {
        const fluxo = await this.getFluxoCaixaUnificado(filtro);
        return agruparPorPeriodo(
            fluxo.detalhes.lancamentos,
            fluxo.detalhes.projecoes,
            agrupamento
        );
    },

    /**
     * Obtém indicadores de saúde financeira
     */
    async getIndicadoresSaude(filtro: FiltroFluxoCaixa): Promise<{
        liquidezImediata: number;
        coberturaDespesas: number;
        tendencia: 'positiva' | 'negativa' | 'estável';
    }> {
        const fluxo = await this.getFluxoCaixaUnificado(filtro);
        return calcularIndicadoresSaude(fluxo);
    },

    /**
     * Obtém alertas de fluxo de caixa
     */
    async getAlertasCaixa(filtro: FiltroFluxoCaixa): Promise<
        { tipo: 'perigo' | 'atencao' | 'ok'; mensagem: string }[]
    > {
        const periodos = await this.getFluxoCaixaPorPeriodo(filtro, 'mes');
        return verificarAlertasCaixa(periodos);
    },

    /**
     * Obtém resumo para dashboard
     */
    async getResumoDashboard(filtro: FiltroFluxoCaixa) {
        return FluxoCaixaRepository.buscarResumoFluxoCaixa(filtro);
    },

    /**
     * Obtém saldo inicial de uma conta bancária em uma data
     */
    async getSaldoInicial(contaBancariaId: number, data: string): Promise<number> {
        return FluxoCaixaRepository.buscarSaldoInicial(contaBancariaId, data);
    },

    /**
     * Lista contas bancárias disponíveis
     */
    async listarContasBancarias() {
        return FluxoCaixaRepository.listarContasBancarias();
    },

    /**
     * Lista centros de custo disponíveis
     */
    async listarCentrosCusto() {
        return FluxoCaixaRepository.listarCentrosCusto();
    }
};
