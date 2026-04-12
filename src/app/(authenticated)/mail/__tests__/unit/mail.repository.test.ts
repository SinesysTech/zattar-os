import { describe, it, expect } from '@jest/globals';

/**
 * MAIL MODULE — Repository Tests
 *
 * O repository.ts do módulo mail é atualmente um stub/placeholder.
 * As operações de dados são feitas via API routes (/api/mail/*) usando
 * IMAP/SMTP diretamente, sem queries Supabase.
 *
 * Este arquivo valida que o módulo repository existe e documenta
 * a arquitetura atual. Quando queries Supabase forem adicionadas
 * ao repository, os testes devem ser expandidos seguindo o padrão
 * do módulo notas (createChainableMock + jest.mock('@/lib/supabase')).
 */

describe('Mail Repository', () => {
    it('deve existir como módulo importável', async () => {
        // O repository.ts existe como ponto de extensão
        const repo = await import('../../repository');
        expect(repo).toBeDefined();
    });

    it('não deve exportar funções de negócio (stub atual)', async () => {
        const repo = await import('../../repository');
        // Filtra chaves internas do módulo ES (__esModule, default)
        const businessKeys = Object.keys(repo).filter(
            (k) => !['__esModule', 'default'].includes(k),
        );
        expect(businessKeys).toHaveLength(0);
    });
});
