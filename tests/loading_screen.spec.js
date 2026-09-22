const { test, expect } = require('@playwright/test');

test.describe('Engine Custom Loading Screen Verification', () => {
  test('Creating, displaying, re-displaying, and hiding custom loading screen works cleanly', async ({ page }) => {
    await page.goto('/');
    await page.click('#start-button');

    const result = await page.evaluate(async () => {
      const workspace = window.workspace;
      workspace.clear();
      workspace.clearUndo();

      // Execute code creating loading screen, showing it, re-showing it, and checking DOM counts
      const code = `
        var loadingScreen = new CustomLoadingScreen('Loading World...', '#111111', '#00ff00');
        window.sceneManager.engine.loadingScreen = loadingScreen;
        window.sceneManager.engine.displayLoadingUI();
      `;

      await window.doRun(code);

      // 1. Initial display check
      const loadingDiv1 = document.getElementById('customLoadingScreen');
      const text1 = loadingDiv1 ? loadingDiv1.textContent : null;
      const count1 = document.querySelectorAll('#customLoadingScreen').length;

      // 2. Re-display loading UI multiple times
      window.sceneManager.engine.displayLoadingUI();
      window.sceneManager.engine.displayLoadingUI();
      const count2 = document.querySelectorAll('#customLoadingScreen').length;

      // 3. Hide loading UI
      window.sceneManager.engine.hideLoadingUI();
      const loadingDiv3 = document.getElementById('customLoadingScreen');
      const count3 = document.querySelectorAll('#customLoadingScreen').length;

      return {
        text1,
        count1,
        count2,
        count3,
        hasDivAfterHide: loadingDiv3 !== null
      };
    });

    expect(result.text1).toBe('Loading World...');
    expect(result.count1).toBe(1);
    expect(result.count2).toBe(1);
    expect(result.count3).toBe(0);
    expect(result.hasDivAfterHide).toBe(false);
  });
});
