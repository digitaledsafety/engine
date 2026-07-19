const { test, expect } = require('@playwright/test');

test.describe('Mesh Lifecycle and Resource Cleanup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Handle the hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    // Switch to preview tab so we can run and verify Babylon changes
    await page.click('#preview-tab');
  });

  test('Re-creating primitive with same name disposes old mesh', async ({ page }) => {
    // 1. Create a box named 'testBox'
    await page.evaluate(() => {
      window.sceneManager.createBox('testBox', 0, 0, 0);
    });

    const boxCreated = await page.evaluate(() => {
      const mesh = window.sceneManager.objects['testBox'];
      return !!mesh && !mesh.isDisposed();
    });
    expect(boxCreated).toBe(true);

    // Keep track of the internal unique id of the first box
    const oldUniqueId = await page.evaluate(() => {
      return window.sceneManager.objects['testBox'].uniqueId;
    });

    // 2. Create another box named 'testBox' at a different position
    await page.evaluate(() => {
      window.sceneManager.createBox('testBox', 1, 2, 3);
    });

    // Verify the second box is created and has a new unique id
    const newUniqueId = await page.evaluate(() => {
      return window.sceneManager.objects['testBox'].uniqueId;
    });
    expect(newUniqueId).not.toBe(oldUniqueId);

    // Verify the old box is disposed in Babylon.js scene
    const isOldDisposed = await page.evaluate((id) => {
      const mesh = window.sceneManager.scene.getMeshByUniqueId(id);
      return !mesh || mesh.isDisposed();
    }, oldUniqueId);
    expect(isOldDisposed).toBe(true);
  });

  test('Disposing/re-creating mesh cleans up associated perFrameFunctions', async ({ page }) => {
    // 1. Create a sphere named 'testSphere' and register an everyFrame callback
    await page.evaluate(() => {
      window.sceneManager.createSphere('testSphere', 0, 0, 0);
      window.sceneManager.everyFrame('testSphere', () => {
        // dummy callback
      });
    });

    // Verify there is exactly 1 perFrameFunction registered
    let perFrameCount = await page.evaluate(() => {
      return window.sceneManager.perFrameFunctions.length;
    });
    expect(perFrameCount).toBe(1);

    // 2. Re-create 'testSphere', which should trigger _cleanupExisting and destroyObject,
    // which in turn should filter out the old task from perFrameFunctions!
    await page.evaluate(() => {
      window.sceneManager.createSphere('testSphere', 2, 2, 2);
    });

    // Verify that the task array was filtered, meaning the count went back to 0
    // (since the old sphere task was removed and no new task was registered yet!)
    perFrameCount = await page.evaluate(() => {
      return window.sceneManager.perFrameFunctions.length;
    });
    expect(perFrameCount).toBe(0);
  });
});
