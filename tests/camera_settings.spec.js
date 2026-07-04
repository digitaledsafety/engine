const { test, expect } = require('@playwright/test');

test.describe('Camera Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Handle the hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    // Switch to preview tab to ensure canvas and scene are ready
    await page.click('#preview-tab');

    // Wait for sceneManager to be ready
    await page.waitForFunction(() => window.sceneManager && window.sceneManager.scene);
  });

  test('Camera inertia and wheel precision can be set', async ({ page }) => {
    const testInertia = 0.55;
    const testPrecision = 42;

    const testCode = `
      sceneManager.setCameraInertia(${testInertia});
      sceneManager.setCameraWheelPrecision(${testPrecision});
    `;

    await page.evaluate(async (code) => {
        // doRun disposes old scene and creates a new one,
        // so we need to wait for it to be fully ready if it's async.
        // BabylonSceneManager constructor is synchronous but it starts the render loop.
        await window.doRun(code);
    }, testCode);

    // Verify properties on the active camera
    const cameraProps = await page.evaluate(() => {
        const camera = window.sceneManager.scene.activeCamera;
        return {
            inertia: camera.inertia,
            wheelPrecision: camera.wheelPrecision
        };
    });

    expect(cameraProps.inertia).toBeCloseTo(testInertia);
    expect(cameraProps.wheelPrecision).toBe(testPrecision);
  });

  test('Camera blocks are present in the toolbox', async ({ page }) => {
    // Open the toolbox
    await page.click('#workspace-tab');
    await page.click('#toggleToolboxButton');

    // Search for the camera inertia block
    await page.fill('#search-input', 'set camera inertia');

    const inertiaBlock = page.locator('.blocklyDraggable:has-text("set camera inertia")');
    await expect(inertiaBlock).toBeVisible();

    // Search for the wheel precision block
    await page.fill('#search-input', 'set camera wheel precision');
    const precisionBlock = page.locator('.blocklyDraggable:has-text("set camera wheel precision")');
    await expect(precisionBlock).toBeVisible();
  });
});
