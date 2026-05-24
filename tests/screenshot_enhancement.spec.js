const { test, expect } = require('@playwright/test');

test.describe('Enhanced Screenshot Functionality', () => {
  test('Screenshot block with ratio selection triggers download', async ({ page }) => {
    await page.goto('/');

    // Handle hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
        await startButton.click();
    }

    // Evaluate in the browser to trigger a screenshot with a specific ratio
    const downloadPromise = page.waitForEvent('download');

    await page.evaluate(async () => {
      // Create a dummy scene with a camera if not present
      if (!window.sceneManager.scene.activeCamera) {
          window.sceneManager.createBox('testBox', 0, 0, 0);
          window.sceneManager.setIsometricCamera();
      }

      // Trigger screenshot with 1:1 ratio
      await window.sceneManager.takeScreenshot('1:1');
    });

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^engine_1-1_.*\.png$/);
  });

  test('Screenshot block with ALL ratio selection triggers multiple downloads', async ({ page }) => {
    await page.goto('/');

    // Handle hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
        await startButton.click();
    }

    // Use a listener for all download events
    const downloads = [];
    page.on('download', (download) => downloads.push(download));

    await page.evaluate(async () => {
      if (!window.sceneManager.scene.activeCamera) {
          window.sceneManager.createBox('testBox', 0, 0, 0);
          window.sceneManager.setIsometricCamera();
      }
      // Trigger screenshot with ALL ratio
      await window.sceneManager.takeScreenshot('ALL');
    });

    // Wait for all 4 expected downloads (1:1, 16:9, 9:16, 4:3)
    await expect.poll(() => downloads.length, { timeout: 10000 }).toBe(4);

    const filenames = downloads.map(d => d.suggestedFilename());
    expect(filenames.some(f => f.includes('1-1'))).toBeTruthy();
    expect(filenames.some(f => f.includes('16-9'))).toBeTruthy();
    expect(filenames.some(f => f.includes('9-16'))).toBeTruthy();
    expect(filenames.some(f => f.includes('4-3'))).toBeTruthy();
  });
});
