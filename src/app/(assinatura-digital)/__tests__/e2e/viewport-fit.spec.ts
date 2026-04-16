import { test, expect } from '@/testing/e2e/fixtures'
import { mockPublicFlow, formularioUrl } from './helpers/mocks'

/**
 * Testes de viewport-fit: garantem que o shell público renderiza sem scroll
 * externo em 3 viewports principais (mobile, tablet, desktop).
 *
 * Requer seed (E2E_SEED=1) para carregar o server component real.
 * Sem seed, os testes são skipados automaticamente.
 *
 * Três verificações por viewport:
 *   1. body.scrollHeight <= viewport.height (com tolerância de 2px)
 *   2. touch targets (botões visíveis) >= 44px de altura
 *   3. font-size mínimo em inputs >= 16px (evita zoom no iOS)
 */

const requiresSeed = !process.env.E2E_SEED

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const

test.describe('Viewport-fit do wizard público', () => {
  test.skip(requiresSeed, 'Defina E2E_SEED=1 após seed do formulário fixture')

  for (const vp of viewports) {
    test(`${vp.name} (${vp.width}x${vp.height}) — não gera scroll externo no CPF step`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await mockPublicFlow(page)
      await page.goto(formularioUrl())
      await page.waitForLoadState('networkidle')

      const scrollHeight = await page.evaluate(() => document.body.scrollHeight)
      const innerHeight = await page.evaluate(() => window.innerHeight)

      expect(scrollHeight, `body.scrollHeight ${scrollHeight} deve caber em viewport ${innerHeight}`)
        .toBeLessThanOrEqual(innerHeight + 2)
    })

    test(`${vp.name} — todos os botões visíveis têm ≥44px de altura`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await mockPublicFlow(page)
      await page.goto(formularioUrl())
      await page.waitForLoadState('networkidle')

      const buttons = await page.locator('button:visible').all()
      for (const btn of buttons) {
        const box = await btn.boundingBox()
        if (box && box.height > 0) {
          expect(
            box.height,
            `Botão "${(await btn.textContent()) ?? '<sem texto>'}" com ${box.height}px`,
          ).toBeGreaterThanOrEqual(44)
        }
      }
    })

    test(`${vp.name} — inputs visíveis têm font-size ≥16px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await mockPublicFlow(page)
      await page.goto(formularioUrl())
      await page.waitForLoadState('networkidle')

      const fontSize = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'))
        const sizes = inputs
          .filter((el) => (el as HTMLElement).offsetParent !== null)
          .map((el) => {
            const fs = window.getComputedStyle(el).fontSize
            return parseFloat(fs)
          })
        return sizes
      })

      for (const size of fontSize) {
        expect(size, `font-size ${size}px em input`).toBeGreaterThanOrEqual(16)
      }
    })
  }
})
