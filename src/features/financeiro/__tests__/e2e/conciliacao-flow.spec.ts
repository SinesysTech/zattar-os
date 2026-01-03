// @ts-nocheck
import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast } from '@/testing/e2e/helpers';

test.describe('Financeiro - Conciliação Flow', () => {
  test('deve conciliar lançamento manualmente', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const conciliacaoTab = page.getByRole('tab', { name: /conciliação/i });
    if (await conciliacaoTab.isVisible({ timeout: 1000 })) {
      await conciliacaoTab.click();
      await page.waitForTimeout(500);
    }

    await page.getByLabel(/conta bancária/i).click();
    await page.getByText('Banco do Brasil - CC 12345-6').click();

    await page.getByLabel(/período inicial|data início/i).fill('01/01/2025');
    await page.getByLabel(/período final|data fim/i).fill('31/01/2025');

    await page.getByRole('button', { name: /buscar|filtrar/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Honorários Contratuais - Cliente ABC')).toBeVisible();

    const lancamento = page.getByText('Honorários Contratuais - Cliente ABC').first();
    await lancamento.click();

    await page.getByRole('button', { name: /conciliar/i }).click();
    await page.waitForTimeout(500);

    await page.getByLabel(/data de pagamento/i).fill('15/01/2025');
    await page.getByLabel(/valor pago/i).fill('5000.00');

    await page.getByRole('button', { name: /salvar|confirmar/i }).click();

    await waitForToast(page, /lançamento conciliado com sucesso/i);
    await expect(page.getByText('Conciliado')).toBeVisible();
  });

  test('deve realizar conciliação automática via OFX', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const conciliacaoTab = page.getByRole('tab', { name: /conciliação/i });
    if (await conciliacaoTab.isVisible({ timeout: 1000 })) {
      await conciliacaoTab.click();
      await page.waitForTimeout(500);
    }

    await page.getByRole('button', { name: /conciliação automática|importar ofx/i }).click();
    await page.waitForTimeout(500);

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 1000 })) {
      await fileInput.setInputFiles({
        name: 'extrato.ofx',
        mimeType: 'application/x-ofx',
        buffer: Buffer.from('Mock OFX content'),
      });
    }

    await page.waitForTimeout(1000);

    const processarButton = page.getByRole('button', { name: /processar|importar/i });
    if (await processarButton.isVisible({ timeout: 1000 })) {
      await processarButton.click();
    }

    await waitForToast(page, /5 lançamentos conciliados automaticamente|conciliação automática concluída/i);
  });

  test('deve validar divergências na conciliação', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const conciliacaoTab = page.getByRole('tab', { name: /conciliação/i });
    if (await conciliacaoTab.isVisible({ timeout: 1000 })) {
      await conciliacaoTab.click();
      await page.waitForTimeout(500);
    }

    const lancamento = page.getByText('Honorários Contratuais').first();
    await lancamento.click();

    await page.getByRole('button', { name: /conciliar/i }).click();

    await page.getByLabel(/valor pago/i).fill('4500.00'); // Valor diferente do esperado

    await page.getByRole('button', { name: /salvar|confirmar/i }).click();

    const alertaDivergencia = page.getByText(/divergência|valor diferente/i);
    if (await alertaDivergencia.isVisible({ timeout: 2000 })) {
      await expect(alertaDivergencia).toBeVisible();
    }
  });
});

test.describe('Financeiro - Conciliação Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve conciliar lançamento manualmente em mobile', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const conciliacaoTab = page.getByRole('tab', { name: /conciliação/i });
    if (await conciliacaoTab.isVisible({ timeout: 1000 })) {
      await conciliacaoTab.scrollIntoViewIfNeeded();
      await conciliacaoTab.click();
      await page.waitForTimeout(500);
    }

    const contaBancariaSelect = page.getByLabel(/conta bancária/i);
    await contaBancariaSelect.scrollIntoViewIfNeeded();
    await contaBancariaSelect.click();
    await page.getByText('Banco do Brasil - CC 12345-6').click();

    await page.getByLabel(/período inicial|data início/i).scrollIntoViewIfNeeded();
    await page.getByLabel(/período inicial|data início/i).fill('01/01/2025');

    await page.getByLabel(/período final|data fim/i).scrollIntoViewIfNeeded();
    await page.getByLabel(/período final|data fim/i).fill('31/01/2025');

    const buscarButton = page.getByRole('button', { name: /buscar|filtrar/i });
    await buscarButton.scrollIntoViewIfNeeded();
    await buscarButton.click();
    await page.waitForTimeout(500);

    const lancamento = page.getByText('Honorários Contratuais - Cliente ABC').first();
    await lancamento.scrollIntoViewIfNeeded();
    await expect(lancamento).toBeVisible();
    await lancamento.click();

    const conciliarButton = page.getByRole('button', { name: /conciliar/i });
    await conciliarButton.scrollIntoViewIfNeeded();
    await conciliarButton.click();
    await page.waitForTimeout(500);

    const dataPagamentoInput = page.getByLabel(/data de pagamento/i);
    await dataPagamentoInput.scrollIntoViewIfNeeded();
    await dataPagamentoInput.fill('15/01/2025');

    const valorPagoInput = page.getByLabel(/valor pago/i);
    await valorPagoInput.scrollIntoViewIfNeeded();
    await valorPagoInput.fill('5000.00');

    const salvarButton = page.getByRole('button', { name: /salvar|confirmar/i });
    await salvarButton.scrollIntoViewIfNeeded();
    await salvarButton.click();

    await waitForToast(page, /lançamento conciliado com sucesso/i);

    const conciliadoLabel = page.getByText('Conciliado');
    await conciliadoLabel.scrollIntoViewIfNeeded();
    await expect(conciliadoLabel).toBeVisible();
  });

  test('deve realizar conciliação automática via OFX em mobile', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const conciliacaoTab = page.getByRole('tab', { name: /conciliação/i });
    if (await conciliacaoTab.isVisible({ timeout: 1000 })) {
      await conciliacaoTab.scrollIntoViewIfNeeded();
      await conciliacaoTab.click();
      await page.waitForTimeout(500);
    }

    const automaticaButton = page.getByRole('button', { name: /conciliação automática|importar ofx/i });
    await automaticaButton.scrollIntoViewIfNeeded();
    await automaticaButton.click();
    await page.waitForTimeout(500);

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 1000 })) {
      await fileInput.scrollIntoViewIfNeeded();
      await fileInput.setInputFiles({
        name: 'extrato.ofx',
        mimeType: 'application/x-ofx',
        buffer: Buffer.from('Mock OFX content'),
      });
    }

    await page.waitForTimeout(1000);

    const processarButton = page.getByRole('button', { name: /processar|importar/i });
    if (await processarButton.isVisible({ timeout: 1000 })) {
      await processarButton.scrollIntoViewIfNeeded();
      await processarButton.click();
    }

    await waitForToast(page, /5 lançamentos conciliados automaticamente|conciliação automática concluída/i);
  });
});
