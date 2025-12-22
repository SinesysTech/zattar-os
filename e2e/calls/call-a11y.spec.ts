import { test, expect } from '../../e2e/fixtures/call-fixtures';
import { injectAxe, checkA11y } from 'axe-core/playwright';

test.describe('Call Accessibility', () => {
  test('deve passar nos testes de acessibilidade (axe)', async ({ page }) => {
    await page.goto('/chat');
    await page.getByTestId('chat-room-item').first().click();
    await page.getByLabel('Iniciar chamada de vídeo').click();

    await expect(page.locator('div[role="dialog"]')).toBeVisible();

    await injectAxe(page);
    
    // Check accessibility of the dialog content
    await checkA11y(page, 'div[role="dialog"]', {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });
});
