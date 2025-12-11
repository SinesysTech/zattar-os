/**
 * Service de Conciliação Bancária
 * Casos de uso e orquestração de regras de negócio
 */

import { ConciliacaoRepository } from '../repository/conciliacao';
import {
    filtrarCandidatos,
    validarConciliacao,
    validarDesconciliacao,
    SCORE_MINIMO_AUTO_CONCILIACAO
} from '../domain/conciliacao';
import type {
    ConciliacaoBancaria,
    SugestaoConciliacao,
    ImportarExtratoDTO,
    ImportarExtratoResponse,
    ConciliarManualDTO,
    ConciliarAutomaticaDTO,
    ConciliacaoResult,
    ListarTransacoesImportadasParams,
    ListarTransacoesResponse,
    LancamentoFinanceiroResumo,
    BuscarLancamentosCandidatosParams
} from '../types/conciliacao';

// ============================================================================
// Service Implementation
// ============================================================================

export class ConciliacaoService {
    /**
     * Lista transações importadas com status de conciliação
     */
    async listarTransacoes(params: ListarTransacoesImportadasParams): Promise<ListarTransacoesResponse> {
        return ConciliacaoRepository.listarTransacoesImportadas(params);
    }

    /**
     * Importa extrato bancário (OFX/CSV)
     */
    async importarExtrato(dto: ImportarExtratoDTO): Promise<ImportarExtratoResponse> {
        console.log('Importando extrato:', dto.nomeArquivo);

        // TODO: Implementar parsing de OFX/CSV
        // Por enquanto retorna mock

        return {
            processados: 10,
            importados: 5,
            duplicados: 5,
            erros: 0
        };
    }

    /**
     * Obtém sugestões de conciliação para uma transação
     */
    async obterSugestoes(transacaoId: number): Promise<SugestaoConciliacao[]> {
        const transacao = await ConciliacaoRepository.buscarTransacaoPorId(transacaoId);
        if (!transacao) {
            throw new Error('Transação não encontrada');
        }

        const validacao = validarConciliacao(transacao);
        if (!validacao.valido) {
            return [];
        }

        // Buscar lançamentos candidatos
        const tipoEsperado = transacao.tipoTransacao === 'credito' ? 'receita' : 'despesa';
        const lancamentos = await ConciliacaoRepository.buscarLancamentosCandidatos({
            contaBancariaId: transacao.contaBancariaId,
            tipo: tipoEsperado,
            valorMin: transacao.valor * 0.9,
            valorMax: transacao.valor * 1.1
        });

        return filtrarCandidatos(transacao, lancamentos);
    }

    /**
     * Concilia manualmente uma transação com um lançamento
     */
    async conciliarManual(dto: ConciliarManualDTO): Promise<ConciliacaoBancaria> {
        const transacao = await ConciliacaoRepository.buscarTransacaoPorId(dto.transacaoImportadaId);
        if (!transacao) {
            throw new Error('Transação não encontrada');
        }

        const validacao = validarConciliacao(transacao);
        if (!validacao.valido) {
            throw new Error(validacao.erros.join('; '));
        }

        // Se é para ignorar (sem lançamento vinculado)
        if (!dto.lancamentoFinanceiroId && !dto.criarNovoLancamento) {
            return ConciliacaoRepository.criarConciliacao({
                transacaoImportadaId: dto.transacaoImportadaId,
                lancamentoFinanceiroId: null,
                status: 'ignorado',
                usuarioId: 'system' // TODO: Obter do contexto de autenticação
            });
        }

        // TODO: Se criarNovoLancamento, criar o lançamento primeiro

        return ConciliacaoRepository.criarConciliacao({
            transacaoImportadaId: dto.transacaoImportadaId,
            lancamentoFinanceiroId: dto.lancamentoFinanceiroId,
            status: 'conciliado',
            diferencaValor: 0, // TODO: Calcular diferença
            usuarioId: 'system'
        });
    }

    /**
     * Executa conciliação automática
     */
    async conciliarAutomaticamente(dto: ConciliarAutomaticaDTO): Promise<ConciliacaoResult[]> {
        const resultados: ConciliacaoResult[] = [];

        // Buscar transações pendentes
        const { items: transacoes } = await ConciliacaoRepository.listarTransacoesImportadas({
            contaBancariaId: dto.contaBancariaId,
            dataInicio: dto.dataInicio,
            dataFim: dto.dataFim
        });

        const pendentes = transacoes.filter(t => t.statusConciliacao === 'pendente');

        for (const transacao of pendentes) {
            try {
                const sugestoes = await this.obterSugestoes(transacao.id);

                // Se houver sugestão com score alto, conciliar automaticamente
                const melhorSugestao = sugestoes[0];
                if (melhorSugestao && melhorSugestao.score >= SCORE_MINIMO_AUTO_CONCILIACAO) {
                    await this.conciliarManual({
                        transacaoImportadaId: transacao.id,
                        lancamentoFinanceiroId: melhorSugestao.lancamentoId
                    });

                    resultados.push({
                        transacaoId: transacao.id,
                        lancamentoId: melhorSugestao.lancamentoId,
                        sucesso: true,
                        mensagem: `Conciliado automaticamente (score: ${melhorSugestao.score})`
                    });
                } else {
                    resultados.push({
                        transacaoId: transacao.id,
                        lancamentoId: 0,
                        sucesso: false,
                        mensagem: 'Nenhuma sugestão com score suficiente'
                    });
                }
            } catch (error) {
                resultados.push({
                    transacaoId: transacao.id,
                    lancamentoId: 0,
                    sucesso: false,
                    mensagem: String(error)
                });
            }
        }

        return resultados;
    }

    /**
     * Busca lançamentos candidatos para conciliação manual
     */
    async buscarLancamentosCandidatos(params: BuscarLancamentosCandidatosParams): Promise<LancamentoFinanceiroResumo[]> {
        const lancamentos = await ConciliacaoRepository.buscarLancamentosCandidatos(params);

        return lancamentos.map(l => ({
            id: l.id,
            descricao: l.descricao,
            dataLancamento: l.dataLancamento,
            valor: l.valor,
            tipo: l.tipo,
            conciliado: l.status === 'confirmado'
        }));
    }

    /**
     * Obtém resumo de conciliação
     */
    async obterResumo(): Promise<{
        totalPendentes: number;
        totalConciliadas: number;
        totalDivergentes: number;
        totalIgnoradas: number;
    }> {
        return ConciliacaoRepository.calcularResumo();
    }

    /**
     * Desconcilia uma transação
     */
    async desconciliar(transacaoId: number): Promise<void> {
        const transacao = await ConciliacaoRepository.buscarTransacaoPorId(transacaoId);
        if (!transacao) {
            throw new Error('Transação não encontrada');
        }

        const validacao = validarDesconciliacao(transacao);
        if (!validacao.valido) {
            throw new Error(validacao.erros.join('; '));
        }

        await ConciliacaoRepository.removerConciliacao(transacaoId);
        console.log(`Transação ${transacaoId} desconciliada`);
    }
}

// Exportar instância singleton para compatibilidade
export const conciliacaoService = new ConciliacaoService();
