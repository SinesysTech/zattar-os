import { test, expect } from '@playwright/test';

const API_PREFIX = 'http://localhost:3000';

test.describe('Formsign admin e assinatura', () => {
  test('lista templates e cria novo (mockado)', async ({ page }) => {
    await page.route('**/api/assinatura-digital/admin/templates', async (route, request) => {
      if (request.method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, template_uuid: 'tpl-123', nome: 'Template A', descricao: 'Desc', ativo: true },
              { id: 2, template_uuid: 'tpl-456', nome: 'Template B', descricao: null, ativo: false },
            ],
          }),
        });
      }
      // POST
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 3, template_uuid: 'tpl-new', nome: 'Novo', ativo: true } }),
      });
    });

    await page.goto(`${API_PREFIX}/assinatura-digital/admin/templates`);
    await expect(page.getByText('Templates de Assinatura')).toBeVisible();
    await expect(page.getByText('Template A')).toBeVisible();

    await page.getByLabel('Nome').fill('Meu Template');
    await page.getByLabel('Descrição').fill('Teste');
    await page.getByLabel('Arquivo (URL pública ou presign)').fill('https://example.com/test.pdf');
    await page.getByLabel('Nome do arquivo').fill('test.pdf');
    await page.getByLabel('Tamanho (bytes)').fill('1024');
    await page.getByRole('button', { name: 'Criar template' }).click();

    await expect(page.getByText('Template A')).toBeVisible();
  });

  test('fluxo de assinatura com preview e finalização (mockado)', async ({ page }) => {
    await page.route('**/api/assinatura-digital/admin/templates', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 1, template_uuid: 'tpl-123', nome: 'Template A', ativo: true }] }),
      })
    );
    await page.route('**/api/assinatura-digital/admin/segmentos', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 10, nome: 'Seg A', slug: 'seg-a', ativo: true }] }),
      })
    );
    await page.route('**/api/assinatura-digital/admin/formularios', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 100, formulario_uuid: 'form-100', nome: 'Form A', slug: 'form-a', segmento_id: 10, ativo: true }] }),
      })
    );
    await page.route('**/api/clientes/buscar/sugestoes**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ options: [{ id: 999, label: 'Cliente X', cpf: '11122233344' }] }),
      })
    );
    await page.route('**/api/assinatura-digital/signature/preview', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { pdf_url: 'https://example.com/preview.pdf' } }),
      })
    );
    await page.route('**/api/assinatura-digital/signature/finalizar', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { assinatura_id: 1, protocolo: 'FS-20250101-00001', pdf_url: 'https://example.com/final.pdf' },
        }),
      })
    );

    await page.goto(`${API_PREFIX}/assinatura-digital/assinatura`);
    await expect(page.getByText('Fluxo de Assinatura')).toBeVisible();

    await page.getByRole('button', { name: 'Selecione' }).first().click();
    await page.getByText('Cliente X').click();

    await page.getByLabel('Template ID/UUID').click();
    await page.getByText('Template A').click();

    await page.getByLabel('Segmento ID').click();
    await page.getByText('Seg A').click();

    await page.getByLabel('Formulário ID').click();
    await page.getByText('Form A').click();

    // anexar assinatura: criar file input with empty data URL (simulate via setInputFiles)
    const filePath = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAb0B9qB9viQAAAAASUVORK5CYII=';
    await page.evaluate((dataUrl) => {
      const file = new File([Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0))], 'sig.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, filePath);

    await page.getByRole('button', { name: 'Gerar preview' }).click();
    await expect(page.getByText('Preview do PDF')).toBeVisible();

    await page.getByRole('button', { name: 'Finalizar assinatura' }).click();
    await expect(page.getByText('Assinatura concluída')).toBeVisible();
    await expect(page.getByText('FS-20250101-00001')).toBeVisible();
  });
});
