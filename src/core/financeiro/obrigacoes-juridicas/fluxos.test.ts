import { ObrigacoesService } from './service';

// Mock do supabase client
const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn(),
};

jest.mock('@/backend/utils/supabase/service-client', () => ({
    createServiceClient: () => mockSupabase
}));

// Mock do serviço de backend que é importado dinamicamente
// Jest hoisting might need this path to match exactly what is required
jest.mock('@/backend/financeiro/obrigacoes/services/integracao/obrigacoes-integracao.service', () => ({
    sincronizarParcelaParaFinanceiro: jest.fn().mockResolvedValue({ success: true, mensagem: 'Sincronizado via mock' })
}), { virtual: true });


describe('ObrigacoesService - Fluxos de Integração', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset defaults
        mockSupabase.select.mockReturnThis();
        mockSupabase.update.mockReturnThis();
        mockSupabase.eq.mockReturnThis();
    });

    describe('Fluxo de Sincronização', () => {
        it('sincronizarAcordo deve processar lista de parcelas', async () => {
            // Mock da resposta do supabase com 2 parcelas
            mockSupabase.select.mockReturnThis();
            mockSupabase.eq.mockResolvedValueOnce({
                data: [{ id: 101 }, { id: 102 }],
                error: null
            });

            // Espionar o método sincronizarParcela para garantir que ele é chamado
            // Como estamos testando o objeto ObrigacoesService e ele chama this.sincronizarParcela, 
            // precisamos spyOn nele mesmo.
            const spySincronizarParcela = jest.spyOn(ObrigacoesService, 'sincronizarParcela');
            spySincronizarParcela.mockResolvedValue({ sucesso: true, mensagem: 'OK' });

            const result = await ObrigacoesService.sincronizarAcordo(999);

            expect(mockSupabase.from).toHaveBeenCalledWith('parcelas');
            expect(mockSupabase.eq).toHaveBeenCalledWith('acordo_condenacao_id', 999);

            expect(spySincronizarParcela).toHaveBeenCalledTimes(2);
            expect(spySincronizarParcela).toHaveBeenCalledWith(101, false);
            expect(spySincronizarParcela).toHaveBeenCalledWith(102, false);

            expect(result.sucesso).toBe(true);
            expect(result.mensagem).toContain('2 parcelas processadas');
        });
    });

    describe('Fluxo de Repasse', () => {
        it('registrarDeclaracao deve atualizar URL e status', async () => {
            mockSupabase.update.mockReturnThis();
            mockSupabase.eq.mockResolvedValueOnce({ error: null });

            await ObrigacoesService.registrarDeclaracao(55, 'http://declaracao.pdf');

            expect(mockSupabase.from).toHaveBeenCalledWith('parcelas');
            expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
                declaracao_prestacao_contas_url: 'http://declaracao.pdf',
                status_repasse: 'pendente_transferencia'
            }));
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 55);
        });

        it('registrarComprovanteRepasse deve atualizar URL, status e data', async () => {
            mockSupabase.update.mockReturnThis();
            mockSupabase.eq.mockResolvedValueOnce({ error: null });

            await ObrigacoesService.registrarComprovanteRepasse(55, 'http://comprovante.pdf', '2024-01-01');

            expect(mockSupabase.from).toHaveBeenCalledWith('parcelas');
            expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
                comprovante_repasse_url: 'http://comprovante.pdf',
                status_repasse: 'repassado',
                data_repasse: '2024-01-01'
            }));
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 55);
        });
    });
});
