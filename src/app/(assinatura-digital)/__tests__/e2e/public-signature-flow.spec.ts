import { test, expect } from '@playwright/test';

test.describe('Assinatura Digital - Fluxo Público de Assinatura', () => {
  test('deve renderizar a tela de welcome e tratar token inválido', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    await page.route('**/api/assinatura-digital/public/invalid-token', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Link inválido ou expirado.'
        })
      });
    });

    await page.goto('/assinatura/invalid-token');

    // ErrorState no PublicWizardShell mostra "Erro ao carregar"
    await expect(page.getByText(/Erro ao carregar/i)).toBeVisible();
    await expect(page.getByText(/link.*inválido ou expirado/i)).toBeVisible();
  });

  test('deve renderizar a tela de welcome com token simulado na API', async ({ page }) => {
    // Mock da API para o token de sucesso
    await page.route('**/api/assinatura-digital/public/fake-valid-token', async (route) => {
      if (route.request().url().endsWith('/identificacao')) {
        return route.fallback();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            documento: {
              titulo: 'Contrato de Honorários Teste',
              pdf_original_url: '/dummy.pdf',
              selfie_habilitada: true,
              geolocation_necessaria: false,
              status: 'pronto'
            },
            assinante: {
              dados_snapshot: {
                nome_completo: 'Maria Silva',
                cpf: '123.456.789-00',
                email: 'maria@example.com',
                telefone: '11999999999'
              },
              status: 'pendente'
            }
          }
        })
      });
    });

    await page.route('**/api/assinatura-digital/public/fake-valid-token/identificacao', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} })
      });
    });

    await page.goto('/assinatura/fake-valid-token');

    // Welcome step — novo hero com chip "Contrato para assinatura" e file name no DocumentPeekCard
    await expect(page.getByText('Contrato para assinatura')).toBeVisible();
    await expect(page.getByText('Contrato de Honorários Teste')).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar assinatura/i })).toBeVisible();

    // Avança para Confirmar dados
    await page.getByRole('button', { name: /iniciar assinatura/i }).click();

    // Confirm Details Step — form com dados pré-preenchidos
    await expect(page.getByRole('heading', { name: /confirme seus dados/i })).toBeVisible();
    await expect(page.locator('input[name="nome_completo"]')).toHaveValue('Maria Silva');
    await expect(page.locator('input[name="cpf"]')).toHaveValue('123.456.789-00');

    await page.getByRole('button', { name: /continuar/i }).click();

    // Review Step — novo título "Revise o documento"
    await expect(page.getByRole('heading', { name: /revise o documento/i })).toBeVisible();
  });
});
