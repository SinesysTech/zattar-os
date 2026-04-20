/**
 * Testes do barrel público do módulo comunica-cnj (Diário Oficial).
 *
 * Validam a superfície pública exportada pelo index.ts após a migração
 * do módulo proxy para módulo FSD autocontido (2026-04-20).
 */

jest.mock('@/app/(authenticated)/expedientes', () => ({
    OrigemExpediente: { COMUNICA_CNJ: 'COMUNICA_CNJ' },
    CodigoTribunal: {},
}));

jest.mock('@/app/(authenticated)/expedientes/service', () => ({
    criarExpediente: jest.fn(),
}));

jest.mock('@/app/(authenticated)/expedientes/repository', () => ({
    findExpedienteById: jest.fn(),
}));

describe('Módulo comunica-cnj', () => {
    describe('index.ts — Barrel Export', () => {
        it('deve exportar o componente ComunicaCNJTabsContent', () => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const barrel = require('@/app/(authenticated)/comunica-cnj');

            expect(barrel).toHaveProperty('ComunicaCNJTabsContent');
            expect(typeof barrel.ComunicaCNJTabsContent).toBe('function');
        });

        it('deve expor labels e schemas de domínio', () => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const barrel = require('@/app/(authenticated)/comunica-cnj');

            expect(barrel).toHaveProperty('MEIO_COMUNICACAO_LABELS');
            expect(barrel).toHaveProperty('GRAU_TRIBUNAL_LABELS');
            expect(barrel).toHaveProperty('consultarComunicacoesSchema');
            expect(barrel).toHaveProperty('sincronizarComunicacoesSchema');
            expect(barrel).toHaveProperty('vincularExpedienteSchema');
        });

        it('deve expor as server actions principais', () => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const barrel = require('@/app/(authenticated)/comunica-cnj');

            expect(typeof barrel.actionConsultarComunicacoes).toBe('function');
            expect(typeof barrel.actionListarComunicacoesCapturadas).toBe('function');
            expect(typeof barrel.actionSincronizarComunicacoes).toBe('function');
            expect(typeof barrel.actionObterCertidao).toBe('function');
            expect(typeof barrel.actionVincularExpediente).toBe('function');
        });
    });

    describe('page.tsx — Configuração de rota', () => {
        it('deve exportar dynamic = "force-dynamic"', () => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const page = require('@/app/(authenticated)/comunica-cnj/page');

            expect(page.dynamic).toBe('force-dynamic');
        });

        it('deve exportar componente default (DiarioOficialPage)', () => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const page = require('@/app/(authenticated)/comunica-cnj/page');

            expect(page.default).toBeDefined();
            expect(typeof page.default).toBe('function');
        });
    });
});
