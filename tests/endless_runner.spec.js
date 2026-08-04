const { test, expect } = require('@playwright/test');

test.describe('Endless Runner MVP & Swipe Verification', () => {
  test('Page loads and Endless Runner is correctly configured', async ({ page }) => {
    page.on('console', msg => {
      console.log(`PAGE_CONSOLE: [${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      console.error(`PAGE_ERROR: ${err.stack}`);
    });

    // 1. Navigate to the endless runner workspace page
    await page.goto('/workspaces/endless-runner/');

    // Validate the page title
    const pageTitle = await page.title();
    expect(pageTitle).toContain('Endless Runner');

    // Click "Start Coding" / "Start Game" overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Go to preview tab
    await page.click('#preview-tab');

    // Clicking Play Scene on WebGL canvas to execute workspace code
    const playButton = page.locator('#play-overlay-button');
    if (await playButton.isVisible()) {
      await playButton.click();
    }

    // 2. Wait for BabylonSceneManager and the scene execution to prepare the player mesh
    await expect.poll(async () => {
      return await page.evaluate(() => {
        return !!window.sceneManager && !!window.sceneManager.objects['player'];
      });
    }, { timeout: 20000 }).toBe(true);

    // Verify player exists and is an object
    const playerExists = await page.evaluate(() => {
      const playerMesh = window.sceneManager.objects['player'];
      return typeof playerMesh === 'object' && playerMesh !== null;
    });
    expect(playerExists).toBe(true);

    // 3. Verify that swipe event blocks have registered listeners in BabylonSceneManager
    const hasSwipeCallbacks = await page.evaluate(() => {
      return !!window.sceneManager.swipeCallbacks &&
             window.sceneManager.swipeCallbacks['LEFT'].length > 0 &&
             window.sceneManager.swipeCallbacks['RIGHT'].length > 0 &&
             window.sceneManager.swipeCallbacks['UP'].length > 0;
    });
    expect(hasSwipeCallbacks).toBe(true);

    // 4. Simulate swipe LEFT and verify player's lane shifts
    // Initial lane should be 0 (center)
    const initialLane = await page.evaluate(() => {
      return window.workspace.getVariableMap().getVariable('lane').value;
    });

    // Let's invoke the swipe trigger directly via the engine
    await page.evaluate(() => {
      window.sceneManager.triggerSwipe('LEFT');
    });

    // Let's verify that the lane shifted and player moved to left lane
    const shiftedLane = await page.evaluate(() => {
      const playerX = window.sceneManager.objects['player'].position.x;
      return playerX;
    });
    expect(shiftedLane).toBeCloseTo(-3, 1);
  });
});
