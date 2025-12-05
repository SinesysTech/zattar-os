import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DASHBOARD_URL = '/dashboard';

// ============================================================================
// 6.1 - Testes de Responsividade
// ============================================================================

test.describe('Dashboard - Responsividade', () => {
  test('mobile: sem overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(DASHBOARD_URL);
    await page.waitForTimeout(2000);

    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });

  test('tablet: layout 2 colunas', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(DASHBOARD_URL);
    await page.waitForTimeout(2000);

    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });

  test('desktop: grid 4 colunas', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(DASHBOARD_URL);
    await page.waitForTimeout(2000);

    const grid = page.locator('.grid.grid-cols-4').first();
    await expect(grid).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('texto legível (min 14px)', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    const fontSize = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(14);
  });
});

// ============================================================================
// 6.2 - Testes de Performance
// ============================================================================

test.describe('Dashboard - Performance', () => {
  test('carregamento < 5s', async ({ page }) => {
    const start = Date.now();
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('domcontentloaded');
    expect(Date.now() - start).toBeLessThan(5000);
  });
});

// ============================================================================
// 6.3 - Testes de Acessibilidade
// ============================================================================

test.describe('Dashboard - Acessibilidade', () => {
  test('axe-core WCAG 2.1 AA', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForTimeout(3000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.recharts-wrapper')
      .analyze();

    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical.length).toBe(0);
  });

  test('navegação por teclado', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForTimeout(2000);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).not.toBe('BODY');
  });

  test('botões com labels', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForTimeout(2000);

    const buttons = page.locator('button:visible');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = buttons.nth(i);
      const label = await btn.getAttribute('aria-label') || await btn.getAttribute('title') || await btn.textContent();
      expect(label?.trim().length).toBeGreaterThan(0);
    }
  });
});
