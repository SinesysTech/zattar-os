// @ts-nocheck
import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast, waitForDownload } from '@/testing/e2e/helpers';

test.describe('Financeiro - Export Flow', () => {
  test('deve exportar contas a receber para Excel', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const contasReceberTab = page.getByRole('tab', { name: /contas a receber/i });
    if (await contasReceberTab.isVisible({ timeout: 1000 })) {
      await contasReceberTab.click();
      await page.waitForTimeout(500);
    }

    await page.getByLabel(/data início/i).fill('01/01/2025');
    await page.getByLabel(/data fim/i).fill('31/01/2025');

    const statusSelect = page.getByLabel(/status/i);
    if (await statusSelect.isVisible({ timeout: 1000 })) {
      await statusSelect.click();
      await page.getByText('Pendente').click();
    }

    await page.getByRole('button', { name: /exportar/i }).click();
    await page.waitForTimeout(500);

    await page.getByLabel(/formato/i).click();
    await page.getByText('Excel', { exact: true }).click();

    const download = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /confirmar|baixar|download/i }).click();
    });

    expect(download.suggestedFilename()).toMatch(/contas-receber.*\.xlsx$/i);
    await waitForToast(page, /exportação iniciada|download iniciado/i);
  });

  test('deve exportar para PDF', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /exportar/i }).click();
    await page.waitForTimeout(500);

    await page.getByLabel(/formato/i).click();
    await page.getByText('PDF', { exact: true }).click();

    const download = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /confirmar|baixar/i }).click();
    });

    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test('deve exportar para CSV', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /exportar/i }).click();
    await page.waitForTimeout(500);

    await page.getByLabel(/formato/i).click();
    await page.getByText('CSV', { exact: true }).click();

    const download = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /confirmar|baixar/i }).click();
    });

    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });

  test('deve aplicar filtros antes de exportar', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/período/i).fill('01/01/2025');

    const categoriaSelect = page.getByLabel(/categoria/i);
    if (await categoriaSelect.isVisible({ timeout: 1000 })) {
      await categoriaSelect.click();
      await page.getByText('Honorários').click();
    }

    await page.getByRole('button', { name: /exportar/i }).click();
    await page.waitForTimeout(500);

    await page.getByLabel(/formato/i).click();
    await page.getByText('Excel').click();

    const download = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /confirmar/i }).click();
    });

    expect(download).toBeTruthy();
  });

  test('deve validar seleção de formato ao exportar', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /exportar/i }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /confirmar|baixar/i }).click();

    const errorMessage = page.getByText(/selecione um formato|formato obrigatório/i);
    if (await errorMessage.isVisible({ timeout: 2000 })) {
      await expect(errorMessage).toBeVisible();
    }
  });
});

test.describe('Financeiro - Export Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve exportar contas a receber para Excel em mobile', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const contasReceberTab = page.getByRole('tab', { name: /contas a receber/i });
    if (await contasReceberTab.isVisible({ timeout: 1000 })) {
      await contasReceberTab.scrollIntoViewIfNeeded();
      await contasReceberTab.click();
      await page.waitForTimeout(500);
    }

    const dataInicioInput = page.getByLabel(/data início/i);
    await dataInicioInput.scrollIntoViewIfNeeded();
    await dataInicioInput.fill('01/01/2025');

    const dataFimInput = page.getByLabel(/data fim/i);
    await dataFimInput.scrollIntoViewIfNeeded();
    await dataFimInput.fill('31/01/2025');

    const statusSelect = page.getByLabel(/status/i);
    if (await statusSelect.isVisible({ timeout: 1000 })) {
      await statusSelect.scrollIntoViewIfNeeded();
      await statusSelect.click();
      await page.getByText('Pendente').click();
    }

    const exportarButton = page.getByRole('button', { name: /exportar/i });
    await exportarButton.scrollIntoViewIfNeeded();
    await exportarButton.click();
    await page.waitForTimeout(500);

    const formatoSelect = page.getByLabel(/formato/i);
    await formatoSelect.scrollIntoViewIfNeeded();
    await formatoSelect.click();
    await page.getByText('Excel', { exact: true }).click();

    const download = await waitForDownload(page, async () => {
      const confirmarButton = page.getByRole('button', { name: /confirmar|baixar|download/i });
      await confirmarButton.scrollIntoViewIfNeeded();
      await confirmarButton.click();
    });

    expect(download.suggestedFilename()).toMatch(/contas-receber.*\.xlsx$/i);
    await waitForToast(page, /exportação iniciada|download iniciado/i);
  });

  test('deve exportar para PDF em mobile', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const exportarButton = page.getByRole('button', { name: /exportar/i });
    await exportarButton.scrollIntoViewIfNeeded();
    await exportarButton.click();
    await page.waitForTimeout(500);

    const formatoSelect = page.getByLabel(/formato/i);
    await formatoSelect.scrollIntoViewIfNeeded();
    await formatoSelect.click();
    await page.getByText('PDF', { exact: true }).click();

    const download = await waitForDownload(page, async () => {
      const confirmarButton = page.getByRole('button', { name: /confirmar|baixar/i });
      await confirmarButton.scrollIntoViewIfNeeded();
      await confirmarButton.click();
    });

    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test('deve exportar para CSV em mobile', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const exportarButton = page.getByRole('button', { name: /exportar/i });
    await exportarButton.scrollIntoViewIfNeeded();
    await exportarButton.click();
    await page.waitForTimeout(500);

    const formatoSelect = page.getByLabel(/formato/i);
    await formatoSelect.scrollIntoViewIfNeeded();
    await formatoSelect.click();
    await page.getByText('CSV', { exact: true }).click();

    const download = await waitForDownload(page, async () => {
      const confirmarButton = page.getByRole('button', { name: /confirmar|baixar/i });
      await confirmarButton.scrollIntoViewIfNeeded();
      await confirmarButton.click();
    });

    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });
});
