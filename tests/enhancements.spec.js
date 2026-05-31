const { test, expect } = require('@playwright/test');

test.describe('Engine Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('Toggle Grid button exists and toggles grid', async ({ page }) => {
    // Open dropdown menu
    await page.click('#menuButton');
    const gridBtn = page.locator('#toggleGridButton');
    await expect(gridBtn).toBeVisible();

    // Check if toggleGrid was called (we can check for the gridGround mesh in Babylon)
    await gridBtn.click();
    const hasGrid = await page.evaluate(() => {
        return window.sceneManager.scene.getMeshByName('gridGround') !== null;
    });
    expect(hasGrid).toBe(true);

    // Re-open menu if it closed
    if (!await gridBtn.isVisible()) {
        await page.click('#menuButton');
    }
    await gridBtn.click();
    const hasGridAfter = await page.evaluate(() => {
        return window.sceneManager.scene.getMeshByName('gridGround') !== null;
    });
    expect(hasGridAfter).toBe(false);
  });

  test('View Code button exists and triggers alert', async ({ page }) => {
    await page.click('#menuButton');
    const viewCodeBtn = page.locator('#viewCodeButton');
    await expect(viewCodeBtn).toBeVisible();

    // Catch alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Generated Code:');
      await dialog.dismiss();
    });

    await viewCodeBtn.click();
  });

  test('New blocks are present in toolbox', async ({ page }) => {
    // Open toolbox if closed
    const toolboxCollapsed = await page.evaluate(() => document.getElementById('blocklyDiv').classList.contains('toolbox-collapsed'));
    if (toolboxCollapsed) {
        await page.click('#toggleToolboxButton');
    }

    // Check Scene category for set_skybox_url
    await page.click('text=Scene', { force: true });
    const skyboxBlock = page.locator('.blocklyBlockCanvas >> text=set skybox to URL');
    await expect(skyboxBlock).toBeVisible();

    // Check Utils category for get_distance_between
    await page.click('text=Utils', { force: true });
    const distanceBlock = page.locator('.blocklyBlockCanvas >> text=distance between');
    await expect(distanceBlock).toBeVisible();
  });

  test('Asset manager displays previews', async ({ page }) => {
    // Switch to assets view
    await page.click('#menuButton');
    await page.click('#assetsViewButton');

    // Mock an image asset
    await page.evaluate(async () => {
        const blob = new Blob([''], { type: 'image/png' });
        const file = new File([blob], 'test-image.png', { type: 'image/png' });
        await window.assetManager.addAsset(file);
        // Trigger view refresh
        await loadAssetsIntoView();
    });

    const assetItem = page.locator('#asset-list li:has-text("test-image.png")');
    await expect(assetItem).toBeVisible();
    const previewImg = assetItem.locator('img');
    await expect(previewImg).toBeVisible();
  });
});
