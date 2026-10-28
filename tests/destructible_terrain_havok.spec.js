const { test, expect } = require('@playwright/test');

test.describe('Havok Physics Destructible Terrain Verification', () => {
  test('Destructible Terrain projectile impacts wall and reduces block count with Havok Physics', async ({ page }) => {
    await page.goto('/workspaces/destructible-terrain/', { waitUntil: 'domcontentloaded' });
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    await page.waitForFunction(() => window.sceneManager && window.Blockly);

    await page.click('#preview-tab');

    // Execute workspace script
    await page.evaluate(async () => {
      if (window.doRun) {
        await window.doRun();
      }
    });

    // Wait for objects to be populated
    await page.waitForFunction(() => {
      return window.sceneManager && Object.keys(window.sceneManager.objects).length > 2;
    });

    // Check initial count of destroyable wall blocks (all objects except ground & projectile)
    const initialWallBlockCount = await page.evaluate(() => {
      return Object.keys(window.sceneManager.objects).length;
    });

    expect(initialWallBlockCount).toBeGreaterThan(10);

    // Press button 'A' to spawn and launch projectile towards wall
    await page.evaluate(() => {
      if (window.sceneManager.buttonPressActions['A']) {
        window.sceneManager.buttonPressActions['A'].forEach(cb => cb());
      }
    });

    // Wait for impact and collision destruction
    await page.waitForTimeout(2500);

    const postImpactWallBlockCount = await page.evaluate(() => {
      return Object.keys(window.sceneManager.objects).length;
    });

    // Confirm that blocks were destroyed on collision impact
    expect(postImpactWallBlockCount).toBeLessThan(initialWallBlockCount);
  });
});
