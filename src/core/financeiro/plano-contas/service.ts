import { PlanoContasRepository } from './repository';
import { PlanoContas } from './domain';

export const PlanoContasService = {
    async listarHierarquia(): Promise<PlanoContas[]> {
        // Por enquanto retorna lista plana, mas preparado para lógica de árvore se necessário
        return await PlanoContasRepository.listarContas();
    },

    async validarLancamentoConta(contaId: number, tipoLancamento: 'receita' | 'despesa'): Promise<boolean> {
        const conta = await PlanoContasRepository.buscarPorId(contaId);
        if (!conta) return false;

        // Valida se o tipo da conta bate com o lançamento (opcional, pode ser flexível)
        return conta.tipo === tipoLancamento;
    },

    async sugerirContaPorTipo(tipo: 'receita' | 'despesa'): Promise<PlanoContas | null> {
        const contas = await this.listarHierarquia();
        // Lógica simplificada: retorna a primeira do tipo correspondente
        return contas.find(c => c.tipo === tipo) || null;
    }
};
