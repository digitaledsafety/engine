const { test, expect } = require('@playwright/test');

test.describe('Loading Screen Bug Fix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Handle the hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('Multiple calls to show loading screen should not stack elements', async ({ page }) => {
    // Inject and execute code to show loading screen multiple times
    const testCode = `
        var loadingScreen = new CustomLoadingScreen('Testing...', 'black', 'white');
        sceneManager.engine.loadingScreen = loadingScreen;
        sceneManager.engine.displayLoadingUI();
        sceneManager.engine.displayLoadingUI();
        sceneManager.engine.displayLoadingUI();
    `;

    await page.evaluate((code) => {
        window.doRun(code);
    }, testCode);

    // Check number of elements with id "customLoadingScreen"
    const count = await page.evaluate(() => {
        return document.querySelectorAll('#customLoadingScreen').length;
    });

    expect(count).toBe(1);
  });
});
