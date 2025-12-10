import { ObrigacoesService } from './service';
import { ParcelaObrigacao } from './domain';

// Mock dependências se necessário (por enquanto validacao é pura)

describe('ObrigacoesService', () => {
    describe('validarIntegridade', () => {
        it('deve validar com sucesso uma parcela pendente', () => {
            const parcela: Partial<ParcelaObrigacao> = {
                id: 1,
                numeroParcela: 1,
                status: 'pendente',
                statusRepasse: 'nao_aplicavel',
                valorRepasseCliente: 0
            };

            const result = ObrigacoesService.validarIntegridade(parcela as ParcelaObrigacao, 'recebimento');
            expect(result.valido).toBe(true);
            expect(result.erros).toHaveLength(0);
        });

        it('deve validar com sucesso uma parcela recebida com forma de pagamento', () => {
            const parcela: Partial<ParcelaObrigacao> = {
                id: 2,
                numeroParcela: 1,
                status: 'recebida',
                formaPagamento: 'pix',
                statusRepasse: 'nao_aplicavel',
                valorRepasseCliente: 0
            };

            const result = ObrigacoesService.validarIntegridade(parcela as ParcelaObrigacao, 'recebimento');
            expect(result.valido).toBe(true);
        });

        it('deve falhar se parcela recebida nao tiver forma de pagamento', () => {
            const parcela: Partial<ParcelaObrigacao> = {
                id: 3,
                numeroParcela: 1,
                status: 'recebida',
                formaPagamento: null, // Faltando
                lancamento: undefined, // E sem lançamento vinculado com forma
                statusRepasse: 'nao_aplicavel',
                valorRepasseCliente: 0
            };

            const result = ObrigacoesService.validarIntegridade(parcela as ParcelaObrigacao, 'recebimento');
            expect(result.valido).toBe(false);
            expect(result.erros[0]).toContain('não possui forma de pagamento');
        });

        it('deve falhar se repasse ao cliente for > 0 mas statusRepasse for invalido', () => {
            const parcela: Partial<ParcelaObrigacao> = {
                id: 4,
                numeroParcela: 1,
                status: 'recebida',
                formaPagamento: 'boleto',
                valorRepasseCliente: 1000,
                statusRepasse: 'nao_aplicavel' // Inválido para repasse > 0
            };

            const result = ObrigacoesService.validarIntegridade(parcela as ParcelaObrigacao, 'recebimento');
            expect(result.valido).toBe(false);
            expect(result.erros[0]).toContain('status de repasse inválido');
        });

        it('deve validar se repasse ao cliente for > 0 e statusRepasse for valido', () => {
            const parcela: Partial<ParcelaObrigacao> = {
                id: 5,
                numeroParcela: 1,
                status: 'recebida',
                formaPagamento: 'boleto',
                valorRepasseCliente: 1000,
                statusRepasse: 'pendente_transferencia'
            };

            const result = ObrigacoesService.validarIntegridade(parcela as ParcelaObrigacao, 'recebimento');
            expect(result.valido).toBe(true);
        });
    });
});
