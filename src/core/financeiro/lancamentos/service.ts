import { LancamentosRepository } from './repository';
import { Lancamento } from './domain';

export const LancamentosService = {
    async criar(dados: Partial<Lancamento>) {
        // Validações de regra de negócio antes de salvar
        if (!dados.descricao) throw new Error("Descrição é obrigatória");
        // if (dados.valor <= 0) throw new Error("Valor deve ser positivo"); // Depende se é débito/crédito

        return await LancamentosRepository.criar(dados);
    },

    async atualizar(id: number, dados: Partial<Lancamento>) {
        return await LancamentosRepository.atualizar(id, dados);
    }
};
