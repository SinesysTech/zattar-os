import { test, expect } from '@playwright/test'

test.describe('Rota pública força tema light', () => {
  test('mantém tema light mesmo com prefers-color-scheme dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })

    // Mock 404 para entrar na rota sem depender de seed
    await page.route('**/api/assinatura-digital/public/force-light-probe', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Link inválido ou expirado.' }),
      })
    })

    await page.goto('/assinatura/force-light-probe')

    const html = page.locator('html')
    await expect(html).toHaveClass(/light/)
    await expect(html).toHaveAttribute('data-theme', 'light')

    const colorScheme = await html.evaluate((el) => (el as HTMLElement).style.colorScheme)
    expect(colorScheme).toBe('light')
  })
})
