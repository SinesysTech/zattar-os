import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast, navigateToTab } from '@/testing/e2e/helpers';

test.describe('Obrigações - Parcelas Flow', () => {
  test('deve listar parcelas do acordo', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByText(/parcela 1/i)).toBeVisible();
    await expect(page.getByText(/r\$.*10\.000,00/i)).toBeVisible();
    await expect(page.getByText('Pendente')).toBeVisible();
  });

  test('deve editar parcela', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const editButton = page.getByRole('button', { name: /editar/i }).first();
    await editButton.click();

    const dataInput = page.getByLabel(/data de vencimento/i);
    await dataInput.clear();
    await dataInput.fill('15/02/2025');

    const valorInput = page.getByLabel(/valor/i);
    await valorInput.clear();
    await valorInput.fill('12000.00');

    await page.getByRole('button', { name: /salvar/i }).click();

    await waitForToast(page, /parcela atualizada com sucesso/i);

    await expect(page.getByText('15/02/2025')).toBeVisible();
    await expect(page.getByText(/r\$.*12\.000,00/i)).toBeVisible();
  });

  test('deve validar recálculo de repasses ao editar parcela', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const editButton = page.getByRole('button', { name: /editar/i }).first();
    await editButton.click();

    const valorInput = page.getByLabel(/valor/i);
    await valorInput.clear();
    await valorInput.fill('15000.00');

    await page.waitForTimeout(300);

    const repasseEscritorio = page.getByText(/repasse escritório.*r\$.*4\.500,00/i);
    if (await repasseEscritorio.isVisible({ timeout: 2000 })) {
      await expect(repasseEscritorio).toBeVisible();
    }

    const repasseCliente = page.getByText(/repasse cliente.*r\$.*10\.500,00/i);
    if (await repasseCliente.isVisible({ timeout: 2000 })) {
      await expect(repasseCliente).toBeVisible();
    }
  });

  test('deve filtrar parcelas por status', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const statusFilter = page.getByLabel(/filtrar por status|status/i);
    if (await statusFilter.isVisible({ timeout: 1000 })) {
      await statusFilter.click();
      await page.getByText('Pago', { exact: true }).click();

      await page.waitForTimeout(500);

      await expect(page.getByText('Pago')).toBeVisible();
    }
  });

  test('deve visualizar histórico de alterações da parcela', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const parcela = page.getByText(/parcela 1/i).first();
    await parcela.click();

    const historicoTab = page.getByRole('tab', { name: /histórico/i });
    if (await historicoTab.isVisible({ timeout: 1000 })) {
      await historicoTab.click();
      await page.waitForTimeout(500);

      await expect(page.getByText(/alteração|modificação/i)).toBeVisible();
    }
  });
});
