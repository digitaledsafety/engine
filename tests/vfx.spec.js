const { test, expect } = require('@playwright/test');

test.describe('VFX and Lighting Demo', () => {
  test('New VFX demo workspace loads and runs without errors', async ({ page }) => {
    // Navigate to the specific demo workspace
    await page.goto('/workspaces/vfx-demo/');

    // Handle the hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Switch to preview tab
    await page.click('#preview-tab');

    // Check if the canvas is present
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible();

    // Check console for errors
    const logs = [];
    page.on('console', msg => {
        logs.push(msg.text());
        console.log(`BROWSER: ${msg.text()}`);
    });

    // Wait for scene to be ready (custom log from our doRun)
    await page.waitForFunction(() => {
        return window.sceneManager && window.sceneManager.scene && window.sceneManager.scene.isReady();
    }, { timeout: 30000 });

    // Verify that our new methods were called (we can't easily check internal state, but we can check if they exist)
    const methodsExist = await page.evaluate(() => {
        return typeof sceneManager.createParticleSystem === 'function' &&
               typeof sceneManager.setFog === 'function' &&
               typeof sceneManager.setOutline === 'function' &&
               typeof sceneManager.createAdvancedLight === 'function' &&
               typeof sceneManager.enableShadows === 'function';
    });
    expect(methodsExist).toBe(true);

    // Verify no major errors were logged
    const errorLogs = logs.filter(log => log.toLowerCase().includes('error') && !log.includes('favicon.ico'));
    expect(errorLogs.length).toBe(0);
  });
});
