import { test, expect } from '../../e2e/fixtures/call-fixtures';

test.describe('Call Initialization', () => {
  test('deve exibir botão de chamada de vídeo na sala', async ({ page }) => {
    await page.goto('/chat');
    
    // Select a room (assuming list is visible)
    // Adjust selector based on real UI
    const firstRoom = page.locator('[data-testid="chat-list-item"]').first();
    await firstRoom.click();
    
    // Check for video call button
    const videoBtn = page.locator('button[aria-label="Iniciar chamada de vídeo"]');
    await expect(videoBtn).toBeVisible();
  });

  test('deve abrir dialogo de chamada ao clicar', async ({ page }) => {
    await page.goto('/chat');
    const firstRoom = page.locator('[data-testid="chat-list-item"]').first();
    await firstRoom.click();
    
    const videoBtn = page.locator('button[aria-label="Iniciar chamada de vídeo"]');
    await videoBtn.click();
    
    // Check if dialog opens
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.getByText(/Video Call:/i)).toBeVisible();
  });
});
