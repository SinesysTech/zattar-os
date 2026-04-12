/**
 * Testes unitários para o módulo comunica-cnj (proxy module)
 *
 * O módulo comunica-cnj é intencionalmente minimal — apenas uma rota
 * que renderiza ComunicaCNJTabsContent do módulo captura.
 * Não possui domain.ts/service.ts/repository.ts por design.
 *
 * Estes testes validam:
 * - Barrel export (index.ts) re-exporta corretamente do módulo captura
 * - page.tsx exporta configuração de rota dinâmica (force-dynamic)
 *
 * Requirements: 1.4, 1.5
 */

// Mock the captura module to avoid pulling in heavy dependencies
jest.mock('@/app/(authenticated)/captura', () => ({
    ComunicaCNJTabsContent: () => 'ComunicaCNJTabsContent',
}));

describe('Módulo comunica-cnj', () => {
    describe('index.ts — Barrel Export', () => {
        it('deve re-exportar ComunicaCNJTabsContent do módulo captura', () => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const barrel = require('@/app/(authenticated)/comunica-cnj');

            expect(barrel).toHaveProperty('ComunicaCNJTabsContent');
            expect(typeof barrel.ComunicaCNJTabsContent).toBe('function');
        });

        it('não deve exportar domain/service/repository (módulo proxy)', () => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const barrel = require('@/app/(authenticated)/comunica-cnj');

            // Módulo proxy não possui camadas FSD próprias
            expect(barrel).not.toHaveProperty('domain');
            expect(barrel).not.toHaveProperty('service');
            expect(barrel).not.toHaveProperty('repository');
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
