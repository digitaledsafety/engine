const { test, expect } = require('@playwright/test');

test.describe('Camera and Stop Button Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('Stop button exists and disposes sceneManager', async ({ page }) => {
    const stopButton = page.locator('#stopButton');
    await expect(stopButton).toBeVisible();

    await page.evaluate(() => {
      window.sceneManager.testProp = "still here";
    });

    await stopButton.click();

    const isDisposed = await page.evaluate(() => {
        // sceneManager is re-created on doRun, but dispose should at least clear the scene
        // However, our implementation of stopButton just calls sceneManager.dispose()
        // Let's check if the scene is disposed
        return window.sceneManager.scene === null || window.sceneManager.scene.isDisposed;
    });
    expect(isDisposed).toBe(true);
  });

  test('Camera configuration blocks set properties', async ({ page }) => {
    await page.click('#preview-tab');

    // Test Inertia
    await page.evaluate(async () => {
      await window.doRun("sceneManager.setCameraInertia(0.5);");
    });
    const inertia = await page.evaluate(() => window.sceneManager.scene.activeCamera.inertia);
    expect(inertia).toBe(0.5);

    // Test Wheel Precision
    await page.evaluate(async () => {
      await window.doRun("sceneManager.setCameraWheelPrecision(50);");
    });
    const precision = await page.evaluate(() => window.sceneManager.scene.activeCamera.wheelPrecision);
    expect(precision).toBe(50);
  });

  test('New particle types are supported', async ({ page }) => {
    await page.click('#preview-tab');

    const snowResult = await page.evaluate(async () => {
      sceneManager.createBox('emitter', 0, 0, 0);
      const ps = sceneManager.createParticleSystem('emitter', 'snow');
      return ps && ps.isStarted();
    });
    expect(snowResult).toBe(true);

    const explosionResult = await page.evaluate(async () => {
        sceneManager.createBox('emitter2', 0, 0, 0);
        const ps = sceneManager.createParticleSystem('emitter2', 'explosion');
        return ps && ps.isStarted();
      });
      expect(explosionResult).toBe(true);
  });
});
