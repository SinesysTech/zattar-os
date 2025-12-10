import { LancamentosRepository } from '../lancamentos/repository';
import { ObrigacoesRepository } from '../obrigacoes-juridicas/repository';

export interface FiltroFluxoCaixa {
    dataInicio: string;
    dataFim: string;
}

export const FluxoCaixaService = {
    async getFluxoCaixaUnificado(filtro: FiltroFluxoCaixa) {
        // 1. Buscar lançamentos efetivados (Realizado)
        const lancamentos = await LancamentosRepository.listar({
            dataCompetenciaInicio: filtro.dataInicio,
            dataCompetenciaFim: filtro.dataFim
        });

        // 2. Buscar obrigações futuras (Projetado)
        // Isso requer um método no repositório de obrigações que filtre por vencimento e status pendente
        const obrigacoesFuturas = await ObrigacoesRepository.listarParcelasComLancamentos({
            dataVencimentoInicio: filtro.dataInicio,
            dataVencimentoFim: filtro.dataFim
        });

        // Filtrar apenas o que ainda não virou lançamento confirmado financeiramente?
        // Se a obrigação já tem lançamento, ela vem do passo 1.
        // Se a obrigação é pendente, ela entra aqui como projeção.
        const projecoes = obrigacoesFuturas.filter(p => p.status === 'pendente');

        // Calcular totais
        const totalReceitasRealizadas = lancamentos
            .filter(l => l.tipo === 'receita' && l.status === 'confirmado')
            .reduce((acc, l) => acc + l.valor, 0);

        const totalDespesasRealizadas = lancamentos
            .filter(l => l.tipo === 'despesa' && l.status === 'confirmado')
            .reduce((acc, l) => acc + l.valor, 0);

        const totalReceitasProjetadas = projecoes
            .filter(p => !p.lancamento || p.lancamento.tipo === 'receita') // Inferir tipo se não tiver lancamento
            // Na verdade, ObrigaçãoJuridica define se é RECEBIMENTO ou PAGAMENTO. 
            // Precisamos saber a direção da obrigação pai.
            // Para simplificar, assumimos que p.valorBrutoCreditoPrincipal > 0 é receita se for AcordoRecebimento
            .reduce((acc, p) => acc + p.valor, 0); // TODO: Refinar lógica de tipo

        return {
            realizado: {
                receitas: totalReceitasRealizadas,
                despesas: totalDespesasRealizadas,
                saldo: totalReceitasRealizadas - totalDespesasRealizadas
            },
            projetado: {
                receitas: totalReceitasProjetadas,
                despesas: 0, // Implementar lógica para despesas
                saldo: totalReceitasProjetadas
            },
            detalhes: {
                lancamentos,
                projecoes
            }
        };
    }
};
