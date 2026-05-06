const { test, expect } = require('@playwright/test');

test.describe('Clear Workspace Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Handle the hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('Clear button exists in settings dropdown', async ({ page }) => {
    // Open settings dropdown
    await page.click('#menuButton');

    const clearButton = page.locator('#clearButton');
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toHaveText(/Clear/i);
  });

  test('Clicking clear button and confirming clears the workspace', async ({ page }) => {
    // Add a block to the workspace
    await page.evaluate(() => {
      const workspace = Blockly.getMainWorkspace();
      const block = workspace.newBlock('math_number');
      block.initSvg();
      block.render();
    });

    let blockCountBefore = await page.evaluate(() => Blockly.getMainWorkspace().getAllBlocks(false).length);
    expect(blockCountBefore).toBeGreaterThan(0);

    // Set up dialog handler to accept the confirmation
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to clear the workspace');
      await dialog.accept();
    });

    // Open settings and click clear
    await page.click('#menuButton');
    await page.click('#clearButton');

    // Wait for the workspace to be cleared
    await expect.poll(async () => {
      return await page.evaluate(() => Blockly.getMainWorkspace().getAllBlocks(false).length);
    }).toBe(0);
  });

  test('Clicking clear button and canceling does not clear the workspace', async ({ page }) => {
    // Add a block to the workspace
    await page.evaluate(() => {
      const workspace = Blockly.getMainWorkspace();
      const block = workspace.newBlock('math_number');
      block.initSvg();
      block.render();
    });

    let blockCountBefore = await page.evaluate(() => Blockly.getMainWorkspace().getAllBlocks(false).length);
    expect(blockCountBefore).toBeGreaterThan(0);

    // Set up dialog handler to cancel the confirmation
    page.on('dialog', async dialog => {
      await dialog.dismiss();
    });

    // Open settings and click clear
    await page.click('#menuButton');
    await page.click('#clearButton');

    // Verify the block is still there
    const blockCountAfter = await page.evaluate(() => Blockly.getMainWorkspace().getAllBlocks(false).length);
    expect(blockCountAfter).toBe(blockCountBefore);
  });
});
