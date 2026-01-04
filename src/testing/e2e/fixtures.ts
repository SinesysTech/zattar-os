import { test as base, type Page } from '@playwright/test';
import {
  mockProcessosAPI,
  mockAudienciasAPI,
  mockFinanceiroAPI,
  mockObrigacoesAPI,
  mockCommonAPIs,
} from './mocks';

type CustomFixtures = {
  authenticatedPage: Page;
  processosMockedPage: Page;
  audienciasMockedPage: Page;
  financeiroMockedPage: Page;
  obrigacoesMockedPage: Page;
};

export const test = base.extend<CustomFixtures>({
  authenticatedPage: async ({ page }, usePage) => {
    // Mock de autenticação
    await page.route('**/api/auth/session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            nome: 'Usuário Teste',
            email: 'teste@example.com',
            cargo: 'Advogado',
          },
          session: {
            access_token: 'mock-token',
            expires_at: Date.now() + 3600000,
          },
        }),
      })
    );

    // Mock de verificação de permissões
    await page.route('**/api/usuarios/*/permissoes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            processos: { ler: true, criar: true, editar: true, excluir: true },
            audiencias: { ler: true, criar: true, editar: true, excluir: true },
            financeiro: { ler: true, criar: true, editar: true, excluir: true },
            obrigacoes: { ler: true, criar: true, editar: true, excluir: true },
          },
        }),
      })
    );

    // Setup de mocks globais para todas as features
    await mockCommonAPIs(page);
    await mockProcessosAPI(page);
    await mockAudienciasAPI(page);
    await mockFinanceiroAPI(page);
    await mockObrigacoesAPI(page);

    // eslint-disable-next-line react-hooks/rules-of-hooks -- usePage is a Playwright fixture parameter, not a React hook
    await usePage(page);
  },

  processosMockedPage: async ({ page }, usePage) => {
    // Página com mocks específicos para processos
    await page.route('**/api/auth/session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, nome: 'Usuário Teste', email: 'teste@example.com' },
        }),
      })
    );

    await mockCommonAPIs(page);
    await mockProcessosAPI(page);

    // eslint-disable-next-line react-hooks/rules-of-hooks -- usePage is a Playwright fixture parameter, not a React hook
    await usePage(page);
  },

  audienciasMockedPage: async ({ page }, usePage) => {
    // Página com mocks específicos para audiências
    await page.route('**/api/auth/session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, nome: 'Usuário Teste', email: 'teste@example.com' },
        }),
      })
    );

    await mockCommonAPIs(page);
    await mockAudienciasAPI(page);
    await mockProcessosAPI(page);

    // eslint-disable-next-line react-hooks/rules-of-hooks -- usePage is a Playwright fixture parameter, not a React hook
    await usePage(page);
  },

  financeiroMockedPage: async ({ page }, usePage) => {
    // Página com mocks específicos para financeiro
    await page.route('**/api/auth/session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, nome: 'Usuário Teste', email: 'teste@example.com' },
        }),
      })
    );

    await mockCommonAPIs(page);
    await mockFinanceiroAPI(page);

    // eslint-disable-next-line react-hooks/rules-of-hooks -- usePage is a Playwright fixture parameter, not a React hook
    await usePage(page);
  },

  obrigacoesMockedPage: async ({ page }, usePage) => {
    // Página com mocks específicos para obrigações
    await page.route('**/api/auth/session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, nome: 'Usuário Teste', email: 'teste@example.com' },
        }),
      })
    );

    await mockCommonAPIs(page);
    await mockObrigacoesAPI(page);
    await mockProcessosAPI(page);

    // eslint-disable-next-line react-hooks/rules-of-hooks -- usePage is a Playwright fixture parameter, not a React hook
    await usePage(page);
  },
});

export { expect } from '@playwright/test';
