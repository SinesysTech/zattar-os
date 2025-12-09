import { test, expect } from '@playwright/test';

const viewports = [
  { w: 360, h: 640 },
  { w: 390, h: 844 },
  { w: 768, h: 1024 },
  { w: 1024, h: 768 },
  { w: 1280, h: 800 },
  { w: 1440, h: 900 },
];

const pages = [
  '/',
  '/auth/login',
  '/dashboard/dashboard',
  '/dashboard/processos',
  '/dashboard/audiencias',
  '/dashboard/expedientes',
  '/dashboard/usuarios',
];

for (const vp of viewports) {
  test.describe(`viewport ${vp.w}x${vp.h}`, () => {
    for (const path of pages) {
      test(`should render ${path} without layout overflow`, async ({ page }) => {
        await page.setViewportSize({ width: vp.w, height: vp.h });
        await page.goto(path);

        const bodyOverflowX = await page.evaluate(() => getComputedStyle(document.body).overflowX);
        expect(bodyOverflowX).not.toBe('scroll');

        const htmlOverflowX = await page.evaluate(() => getComputedStyle(document.documentElement).overflowX);
        expect(htmlOverflowX).not.toBe('scroll');
      });

      test(`texts remain legible on ${path}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.w, height: vp.h });
        await page.goto(path);

        const fontSize = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
        expect(fontSize).toBeGreaterThanOrEqual(14);
      });
    }
  });
}

test.describe('touch targets and motion reduce', () => {
  test('buttons meet minimum touch size on coarse pointer', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/auth/login');
    const buttons = page.locator('button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const bb = await buttons.nth(i).boundingBox();
      if (bb) {
        expect(bb.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
