const { test, expect } = require('@playwright/test');

test.describe('Block Code Generation for Value Blocks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Handle the hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('create_ground block generator does not append semicolon or newline', async ({ page }) => {
    const code = await page.evaluate(() => {
      const workspace = window.workspace;
      const block = workspace.newBlock('create_ground');
      block.initSvg();
      block.render();
      const code = javascript.javascriptGenerator.blockToCode(block);
      return code;
    });

    expect(Array.isArray(code)).toBe(true);
    const expression = code[0];
    expect(expression).not.toContain(';');
    expect(expression).not.toContain('\n');
    expect(expression).toMatch(/^sceneManager\.createGround/);
  });

  test('parse_number_from block generator does not append semicolon or newline', async ({ page }) => {
    const code = await page.evaluate(() => {
      const workspace = window.workspace;
      const block = workspace.newBlock('parse_number_from');
      block.initSvg();
      block.render();
      const code = javascript.javascriptGenerator.blockToCode(block);
      return code;
    });

    expect(Array.isArray(code)).toBe(true);
    const expression = code[0];
    expect(expression).not.toContain(';');
    expect(expression).not.toContain('\n');
    expect(expression).toMatch(/^parseFloat/);
  });
});
