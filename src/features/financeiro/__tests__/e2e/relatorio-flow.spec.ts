import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast } from '@/testing/e2e/helpers';

test.describe('Financeiro - Relatório Flow', () => {
  test('deve gerar relatório de fluxo de caixa', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const relatoriosTab = page.getByRole('tab', { name: /relatórios/i });
    if (await relatoriosTab.isVisible({ timeout: 1000 })) {
      await relatoriosTab.click();
      await page.waitForTimeout(500);
    }

    await page.getByLabel(/tipo de relatório/i).click();
    await page.getByText('Fluxo de Caixa').click();

    await page.getByLabel(/período inicial|data início/i).fill('01/01/2025');
    await page.getByLabel(/período final|data fim/i).fill('31/01/2025');

    const contaBancariaSelect = page.getByLabel(/conta bancária/i);
    if (await contaBancariaSelect.isVisible({ timeout: 1000 })) {
      await contaBancariaSelect.click();
      await page.getByText('Todas').click();
    }

    await page.getByLabel(/agrupamento/i).click();
    await page.getByText('Por Categoria').click();

    await page.getByRole('button', { name: /gerar relatório/i }).click();

    await page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 10000 });

    await waitForToast(page, /relatório gerado com sucesso/i);

    await expect(page.getByText('Fluxo de Caixa')).toBeVisible();
    await expect(page.getByText(/total de receitas.*r\$.*50\.000,00/i)).toBeVisible();
    await expect(page.getByText(/total de despesas.*r\$.*20\.000,00/i)).toBeVisible();
    await expect(page.getByText(/saldo.*r\$.*30\.000,00/i)).toBeVisible();
  });

  test('deve visualizar gráficos no relatório', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const relatoriosTab = page.getByRole('tab', { name: /relatórios/i });
    if (await relatoriosTab.isVisible({ timeout: 1000 })) {
      await relatoriosTab.click();
      await page.waitForTimeout(500);
    }

    await page.getByLabel(/tipo de relatório/i).click();
    await page.getByText('Fluxo de Caixa').click();

    await page.getByRole('button', { name: /gerar relatório/i }).click();
    await page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 10000 });

    const grafico = page.locator('canvas, svg[class*="recharts"], [data-testid="chart"]');
    const count = await grafico.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve gerar relatório DRE', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const relatoriosTab = page.getByRole('tab', { name: /relatórios/i });
    if (await relatoriosTab.isVisible({ timeout: 1000 })) {
      await relatoriosTab.click();
      await page.waitForTimeout(500);
    }

    await page.getByLabel(/tipo de relatório/i).click();

    const dreOption = page.getByText(/DRE|demonstração.*resultado/i);
    if (await dreOption.isVisible({ timeout: 1000 })) {
      await dreOption.click();

      await page.getByLabel(/período/i).fill('01/01/2025');
      await page.getByRole('button', { name: /gerar/i }).click();

      await page.waitForTimeout(1000);
      await expect(page.getByText(/receitas|despesas|lucro/i)).toBeVisible();
    }
  });

  test('deve filtrar relatório por categoria', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const relatoriosTab = page.getByRole('tab', { name: /relatórios/i });
    if (await relatoriosTab.isVisible({ timeout: 1000 })) {
      await relatoriosTab.click();
      await page.waitForTimeout(500);
    }

    await page.getByLabel(/tipo/i).click();
    await page.getByText('Fluxo de Caixa').click();

    const categoriaFilter = page.getByLabel(/categoria|filtrar por categoria/i);
    if (await categoriaFilter.isVisible({ timeout: 1000 })) {
      await categoriaFilter.click();
      await page.getByText('Honorários').click();
    }

    await page.getByRole('button', { name: /gerar/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText('Honorários')).toBeVisible();
  });
});

test.describe('Financeiro - Relatório Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve gerar relatório de fluxo de caixa em mobile', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const relatoriosTab = page.getByRole('tab', { name: /relatórios/i });
    if (await relatoriosTab.isVisible({ timeout: 1000 })) {
      await relatoriosTab.scrollIntoViewIfNeeded();
      await relatoriosTab.click();
      await page.waitForTimeout(500);
    }

    const tipoRelatorioSelect = page.getByLabel(/tipo de relatório/i);
    await tipoRelatorioSelect.scrollIntoViewIfNeeded();
    await tipoRelatorioSelect.click();
    await page.getByText('Fluxo de Caixa').click();

    const periodoInicioInput = page.getByLabel(/período inicial|data início/i);
    await periodoInicioInput.scrollIntoViewIfNeeded();
    await periodoInicioInput.fill('01/01/2025');

    const periodoFinalInput = page.getByLabel(/período final|data fim/i);
    await periodoFinalInput.scrollIntoViewIfNeeded();
    await periodoFinalInput.fill('31/01/2025');

    const contaBancariaSelect = page.getByLabel(/conta bancária/i);
    if (await contaBancariaSelect.isVisible({ timeout: 1000 })) {
      await contaBancariaSelect.scrollIntoViewIfNeeded();
      await contaBancariaSelect.click();
      await page.getByText('Todas').click();
    }

    const agrupamentoSelect = page.getByLabel(/agrupamento/i);
    await agrupamentoSelect.scrollIntoViewIfNeeded();
    await agrupamentoSelect.click();
    await page.getByText('Por Categoria').click();

    const gerarButton = page.getByRole('button', { name: /gerar relatório/i });
    await gerarButton.scrollIntoViewIfNeeded();
    await gerarButton.click();

    await page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 10000 });

    await waitForToast(page, /relatório gerado com sucesso/i);

    await page.getByText('Fluxo de Caixa').scrollIntoViewIfNeeded();
    await expect(page.getByText('Fluxo de Caixa')).toBeVisible();

    await page.getByText(/total de receitas.*r\$.*50\.000,00/i).scrollIntoViewIfNeeded();
    await expect(page.getByText(/total de receitas.*r\$.*50\.000,00/i)).toBeVisible();

    await page.getByText(/total de despesas.*r\$.*20\.000,00/i).scrollIntoViewIfNeeded();
    await expect(page.getByText(/total de despesas.*r\$.*20\.000,00/i)).toBeVisible();

    await page.getByText(/saldo.*r\$.*30\.000,00/i).scrollIntoViewIfNeeded();
    await expect(page.getByText(/saldo.*r\$.*30\.000,00/i)).toBeVisible();
  });

  test('deve visualizar gráficos em mobile', async ({ financeiroMockedPage: page }) => {
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    const relatoriosTab = page.getByRole('tab', { name: /relatórios/i });
    if (await relatoriosTab.isVisible({ timeout: 1000 })) {
      await relatoriosTab.scrollIntoViewIfNeeded();
      await relatoriosTab.click();
      await page.waitForTimeout(500);
    }

    const tipoRelatorioSelect = page.getByLabel(/tipo de relatório/i);
    await tipoRelatorioSelect.scrollIntoViewIfNeeded();
    await tipoRelatorioSelect.click();
    await page.getByText('Fluxo de Caixa').click();

    const gerarButton = page.getByRole('button', { name: /gerar relatório/i });
    await gerarButton.scrollIntoViewIfNeeded();
    await gerarButton.click();
    await page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 10000 });

    const grafico = page.locator('canvas, svg[class*="recharts"], [data-testid="chart"]');
    const count = await grafico.count();
    expect(count).toBeGreaterThan(0);

    // Scroll to make sure charts are visible
    if (count > 0) {
      await grafico.first().scrollIntoViewIfNeeded();
    }
  });
});
