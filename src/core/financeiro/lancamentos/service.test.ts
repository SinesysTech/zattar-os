import { LancamentosService } from './service';
import { LancamentosRepository } from './repository';

// Mock do Repository
jest.mock('./repository', () => ({
    LancamentosRepository: {
        criar: jest.fn(),
        atualizar: jest.fn()
    }
}));

describe('LancamentosService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('criar', () => {
        it('deve criar um lancamento com sucesso quando dados validos', async () => {
            const dados = { descricao: 'Teste', valor: 100 };
            (LancamentosRepository.criar as jest.Mock).mockResolvedValue({ id: 1, ...dados });

            const result = await LancamentosService.criar(dados);

            expect(LancamentosRepository.criar).toHaveBeenCalledWith(dados);
            expect(result).toHaveProperty('id', 1);
        });

        it('deve lançar erro se descricao for vazia', async () => {
            const dados = { valor: 100 };

            await expect(LancamentosService.criar(dados)).rejects.toThrow('Descrição é obrigatória');
            expect(LancamentosRepository.criar).not.toHaveBeenCalled();
        });
    });

    describe('atualizar', () => {
        it('deve chamar o repositorio para atualizar', async () => {
            const updates = { valor: 200 };
            (LancamentosRepository.atualizar as jest.Mock).mockResolvedValue({ id: 1, ...updates });

            await LancamentosService.atualizar(1, updates);

            expect(LancamentosRepository.atualizar).toHaveBeenCalledWith(1, updates);
        });
    });
});
