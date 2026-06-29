const { test, expect } = require('@playwright/test');

test('Verify Order Independent Transparency can be enabled via block', async ({ page }) => {
    await page.goto('/');

    // Click 'Start Coding' to initialize the scene
    const startButton = page.locator('#start-button');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Wait for sceneManager to be initialized
    await page.waitForFunction(() => window.sceneManager && window.sceneManager.scene);

    // Verify it is disabled by default
    let isOITEnabled = await page.evaluate(() => {
        return window.sceneManager.scene.useOrderIndependentTransparency || false;
    });
    expect(isOITEnabled).toBe(false);

    // Enable it via block
    await page.evaluate(async () => {
        const code = "sceneManager.scene.useOrderIndependentTransparency = true;";
        await window.doRun(code);
    });

    // Wait for doRun to complete and potentially re-initialize sceneManager
    await page.waitForFunction(() => window.sceneManager && window.sceneManager.scene);

    isOITEnabled = await page.evaluate(() => {
        return window.sceneManager.scene.useOrderIndependentTransparency;
    });
    expect(isOITEnabled).toBe(true);
});
