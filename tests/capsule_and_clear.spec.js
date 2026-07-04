const { test, expect, devices } = require('@playwright/test');

test('Capsule primitive creation works', async ({ page }) => {
  await page.goto('/');
  const startButton = page.locator('#start-button');
  if (await startButton.isVisible()) {
    await startButton.click();
  }

  await page.click('#preview-tab');
  const result = await page.evaluate(async () => {
    sceneManager.createCapsule('testCapsule', 0, 0, 0);
    return !!window.sceneManager.objects['testCapsule'];
  });
  expect(result).toBe(true);

  const isCapsule = await page.evaluate(() => {
      const mesh = window.sceneManager.objects['testCapsule'];
      // Capsule might be a wrapper or the mesh itself
      return mesh && (mesh.name.toLowerCase().includes('capsule') || mesh.getDescendants(false).some(d => d.name.toLowerCase().includes('capsule')));
  });
  expect(isCapsule).toBe(true);
});

test.describe('Mobile Viewport Tests', () => {
  test('Joystick persists after clearing workspace', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 13'].viewport);
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    await page.click('#preview-tab');

    // Check for jump button (part of joystick init)
    const jumpButton = page.locator('#jump-button-container');
    await expect(jumpButton).toBeVisible();

    // Clear workspace
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await page.click('#menuButton');
    await page.click('#clearButton');

    // Re-verify joystick re-initialization by checking jump button
    await expect(jumpButton).toBeVisible();
  });
});
