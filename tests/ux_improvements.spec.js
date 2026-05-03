const { test, expect } = require('@playwright/test');

test.describe('UX Improvements', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.goto('/');
    // Handle the hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('Enhanced search finds blocks by type', async ({ page }) => {
    const toggleToolboxButton = page.locator('#toggleToolboxButton');
    await toggleToolboxButton.click();

    const searchInput = page.locator('#search-input');

    // Search by type "take_screenshot"
    await searchInput.fill('take_screenshot');

    // Check if the flyout is visible (Blockly internals use SVG)
    const flyout = page.locator('.blocklyToolboxFlyout');
    await expect(flyout).toBeVisible();

    // Check if "take screenshot" is in the flyout (now "take all screenshot" by default)
    const screenshotBlockText = page.locator('.blocklyText:has-text("take")');
    await expect(screenshotBlockText.first()).toBeVisible();
  });

  test('Global keyboard shortcuts trigger Run and Save', async ({ page }) => {
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.evaluate(() => {
        window.workspace.clear();
        const block = window.workspace.newBlock('console_log');
        const textBlock = window.workspace.newBlock('text');
        textBlock.setFieldValue('SHORTCUT_RUN_SUCCESS', 'TEXT');
        block.getInput('VALUE').connection.connect(textBlock.outputConnection);
    });

    await page.keyboard.press('Control+Enter');
    await expect.poll(() => consoleMessages).toContain('SHORTCUT_RUN_SUCCESS');

    await page.evaluate(() => {
        window.projectManager.saveProject = () => console.log('SHORTCUT_SAVE_SUCCESS');
    });
    await page.keyboard.press('Control+s');
    await expect.poll(() => consoleMessages).toContain('SHORTCUT_SAVE_SUCCESS');
  });

  test('Asset deletion requires confirmation', async ({ page }) => {
    // Switch to assets view
    await page.click('#menuButton');
    await page.click('#assetsViewButton');

    // Mock an asset
    await page.evaluate(async () => {
        const file = new File(['test'], 'test-asset.txt', { type: 'text/plain' });
        await window.assetManager.addAsset(file);
        window.loadAssetsIntoView();
    });

    const assetItem = page.locator('#asset-list li:has-text("test-asset.txt")');
    await expect(assetItem).toBeVisible();

    const deleteButton = assetItem.locator('button:has-text("Delete")');

    // Test Cancel deletion
    page.once('dialog', dialog => dialog.dismiss());
    await deleteButton.click();
    await expect(assetItem).toBeVisible();

    // Test Confirm deletion
    page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();
    await expect(assetItem).not.toBeVisible();
  });
});
