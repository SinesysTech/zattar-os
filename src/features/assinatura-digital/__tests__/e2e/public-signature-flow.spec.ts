import { test, expect } from '@playwright/test';

test.describe('Assinatura Digital - Novo Fluxo Público', () => {
  const token = 'test-token-123';

  test.beforeEach(async ({ page }) => {
    // Mock API response for Context
    await page.route(`**/api/assinatura-digital/public/${token}`, (route) => {
      // Primeiro load: assinante pendente
      if (!route.request().headers()['x-mock-final']) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              documento: {
                documento_uuid: 'doc-123',
                titulo: 'Documento Teste',
                status: 'pronto',
                selfie_habilitada: true,
                pdf_original_url: 'https://example.com/doc.pdf',
              },
              assinante: {
                id: 1,
                status: 'pendente',
                dados_snapshot: {
                  nome_completo: 'Fulano de Tal',
                  cpf: '12345678900',
                  email: 'fulano@example.com',
                  telefone: '11999999999',
                },
                dados_confirmados: false,
                token: token,
              },
              anchors: [
                { tipo: 'assinatura' },
                { tipo: 'rubrica' },
              ],
            },
          }),
        });
      }

      // Após finalizar, contexto volta como concluído
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            documento: {
              documento_uuid: 'doc-123',
              titulo: 'Documento Teste',
              status: 'concluido',
              selfie_habilitada: true,
              pdf_original_url: 'https://example.com/doc.pdf',
              pdf_final_url: 'https://example.com/doc-final.pdf',
            },
            assinante: {
              id: 1,
              status: 'concluido',
              dados_snapshot: {
                nome_completo: 'Fulano de Tal',
                cpf: '12345678900',
                email: 'fulano@example.com',
                telefone: '11999999999',
              },
              dados_confirmados: true,
              token: token,
            },
            anchors: [
              { tipo: 'assinatura' },
              { tipo: 'rubrica' },
            ],
          },
        }),
      });
    });

    // Mock API save identification
    await page.route(`**/api/assinatura-digital/public/${token}/identificacao`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Mock API finalize e garantir que é chamado
    await page.route(`**/api/assinatura-digital/public/${token}/finalizar`, async (route) => {
      const body = await route.request().postDataJSON();

      // Verifica que o aceite dos termos está sendo enviado e assinatura presente
      expect(body.termos_aceite).toBe(true);
      expect(typeof body.assinatura_base64).toBe('string');
      expect(body.assinatura_base64.length).toBeGreaterThan(0);

      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        // Header usado para o próximo GET do contexto simular status concluído
        headers: {
          'x-mock-final': '1',
        },
        body: JSON.stringify({
          success: true,
          data: {
            pdf_final_url: 'https://example.com/doc-final.pdf',
          },
        }),
      });
    });
  });

  test('Deve completar o fluxo de assinatura com sucesso (Selfie + Assinatura + Rubrica)', async ({ page }) => {
    await page.goto(`/assinatura/${token}`);

    // 1. Welcome Step
    await expect(page.getByText('Documento Teste')).toBeVisible();
    await expect(page.getByText('Você foi convidado a assinar')).toBeVisible();
    await page.getByRole('button', { name: /começar/i }).click();

    // 2. Confirm Details Step
    await expect(page.getByText('Confirme seus dados')).toBeVisible();
    await expect(page.getByDisplayValue('Fulano de Tal')).toBeVisible();
    await page.getByRole('button', { name: /confirmar e continuar/i }).click();

    // 3. Review Document Step
    await expect(page.getByText('Revise o Documento')).toBeVisible();
    // Simulate scroll or just click continue (assuming button is enabled or becomes enabled)
    await page.getByRole('button', { name: /continuar para selfie/i }).click();

    // 4. Selfie Step
    await expect(page.getByText('Tire uma Selfie')).toBeVisible();
    await page.getByRole('button', { name: /tirar foto/i }).click();
    // After capture, should see confirm/retake
    await page.getByRole('button', { name: /usar foto/i }).click();

    // 5. Signature Step
    await expect(page.getByText('Assinar Documento')).toBeVisible();
    await expect(page.getByText('Sua Assinatura')).toBeVisible();
    await expect(page.getByText('Rubrica / Iniciais')).toBeVisible();

    // Simulate drawing on canvas (Signature)
    // Finding canvas by some selector. SignatureStep has multiple canvas.
    // Assuming first is signature, second is rubrica.
    const canvases = page.locator('canvas');
    const signatureCanvas = canvases.first();
    const rubricaCanvas = canvases.nth(1);

    // Draw signature
    await signatureCanvas.click({ position: { x: 50, y: 50 } });
    await signatureCanvas.click({ position: { x: 60, y: 60 } }); // simulate dots/strokes

    // Draw rubrica
    await rubricaCanvas.click({ position: { x: 50, y: 50 } });
    await rubricaCanvas.click({ position: { x: 60, y: 60 } });

    // Accept terms
    await page.getByLabel(/consentimento/i).check();

    // Finalize
    await page.getByRole('button', { name: /finalizar assinatura/i }).click();

    // 6. Success Step - garante que o fluxo avançou e contexto reflete concluído
    await expect(page.getByText(/assinatura confirmada/i)).toBeVisible();
    await expect(page.getByText(/documento foi assinado com sucesso/i)).toBeVisible();
  });

  test('Deve lidar com erro de API', async ({ page }) => {
    // Override mock to return error
    await page.route(`**/api/assinatura-digital/public/${token}`, (route) => {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Documento não encontrado',
        }),
      });
    });

    await page.goto(`/assinatura/${token}`);
    await expect(page.getByText('Erro ao carregar')).toBeVisible();
    await expect(page.getByText('Documento não encontrado')).toBeVisible();
  });
});
