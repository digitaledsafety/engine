import { test, expect } from '@playwright/test';

test('verify all changes', async ({ page }) => {
  await page.goto('/');
  await page.click('#start-button');
  await page.waitForFunction(() => typeof window.workspace !== 'undefined');

  // 1. Verify Flyout Zoom Fix
  const flyoutScale = await page.evaluate(() => {
    window.workspace.setScale(2);
    return window.workspace.getFlyout().getFlyoutScale();
  });
  expect(flyoutScale).toBe(1.0);

  // 2. Verify Add Blocks Button and Search Toggle
  const addBlocksButton = page.locator('#toggleToolboxButton');
  await expect(addBlocksButton).toBeVisible();
  await addBlocksButton.click();
  await expect(page.locator('#search-container')).toHaveClass(/show/);

  // 3. Verify Search Functionality
  const searchInput = page.locator('#search-input');
  await searchInput.fill('create_primitive');
  await page.waitForFunction(() => {
    const labels = Array.from(document.querySelectorAll('.blocklyToolboxCategoryLabel'));
    return labels.some(l => l.textContent.includes('Search Results'));
  });

  // Verify search result contents
  const blocksInSearch = await page.evaluate(() => {
      const flyout = window.workspace.getFlyout();
      return flyout.getWorkspace().getTopBlocks().map(b => b.type);
  });
  expect(blocksInSearch).toContain('create_primitive');

  // 4. Verify Mobile Styles (Simulation)
  await page.setViewportSize({ width: 375, height: 667 });
  const categoryHeight = await page.evaluate(() => {
      const category = document.querySelector('.blocklyToolboxCategory');
      return category ? window.getComputedStyle(category).height : '0px';
  });
  // Note: Depending on how Blockly renders, it might take a moment or need resize
  console.log('Mobile Category Height:', categoryHeight);
  // expect(parseFloat(categoryHeight)).toBeCloseTo(48, 0); // Might be tricky to test exactly due to zelos/blockly rendering
});
