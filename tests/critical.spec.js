const { test, expect } = require('@playwright/test');

test.describe('Engine Critical Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Handle the hero overlay
    const startButton = page.locator('#start-button');
    await expect(startButton).toBeVisible({ timeout: 10000 });
    await startButton.click();
    // Wait for overlay to be hidden
    const heroOverlay = page.locator('#hero-overlay');
    await expect(heroOverlay).toHaveClass(/hidden/, { timeout: 10000 });
    await expect(heroOverlay).not.toBeVisible();
  });

  test('Page loads and Hero overlay is dismissed', async ({ page }) => {
    await expect(page).toHaveTitle(/Engine/i);
    const heroOverlay = page.locator('#hero-overlay');
    await expect(heroOverlay).toHaveClass(/hidden/);
  });

  test('Blockly workspace is initialized', async ({ page }) => {
    const blocklyDiv = page.locator('#blocklyDiv');
    await expect(blocklyDiv).toBeVisible();
    const isBlocklyDefined = await page.evaluate(() => typeof Blockly !== 'undefined');
    expect(isBlocklyDefined).toBe(true);
  });

  test('Babylon.js canvas is present in preview', async ({ page }) => {
    await page.click('#preview-tab');
    const gameCanvas = page.locator('#gameCanvas');
    await expect(gameCanvas).toBeVisible();
  });

  test('Simple block program can be executed', async ({ page }) => {
    // Switch to preview tab
    await page.click('#preview-tab');

    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    const testCode = "console.log('TEST_LOG_SUCCESS');";

    // We use doRun to execute code directly for testing purposes
    await page.evaluate((code) => {
        window.doRun(code);
    }, testCode);

    // Wait for the log message
    await expect.poll(() => consoleMessages).toContain('TEST_LOG_SUCCESS');
  });

  test('PWA manifest and service worker are linked', async ({ page }) => {
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /\/manifest\.json$/);

    // Check if Service Worker is registered
    const scripts = await page.locator('script').allInnerTexts();
    const hasSWScript = scripts.some(s => s.includes('serviceWorker') && s.includes('register'));
    expect(hasSWScript).toBe(true);
  });
});
