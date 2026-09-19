const { test, expect } = require('@playwright/test');

test.describe('Camera Framing Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    await page.click('#preview-tab');
  });

  test('frameCameraOnMesh transitions to perspective and frames target mesh', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // 1. Create a test box at custom coordinates
      const box = sceneManager.createBox('frameTestBox', 5, 10, -5);

      // 2. Set camera to isometric (orthographic) mode first to test transition
      sceneManager.setIsometricCamera();
      const wasOrthographic = sceneManager.scene.activeCamera.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

      // 3. Frame the camera on the test box
      sceneManager.frameCameraOnMesh('frameTestBox');

      const camera = sceneManager.scene.activeCamera;
      const target = camera.target || camera.getTarget();

      return {
        wasOrthographic,
        cameraType: camera.getClassName(),
        cameraMode: camera.mode, // 0 is PERSPECTIVE_CAMERA
        targetX: target.x,
        targetY: target.y,
        targetZ: target.z,
        radius: camera.radius
      };
    });

    expect(result.wasOrthographic).toBe(true);
    expect(result.cameraType).toBe('ArcRotateCamera');
    expect(result.cameraMode).toBe(0); // BABYLON.Camera.PERSPECTIVE_CAMERA is 0
    expect(result.targetX).toBeCloseTo(5);
    expect(result.targetY).toBeCloseTo(10);
    expect(result.targetZ).toBeCloseTo(-5);
    expect(result.radius).toBeGreaterThan(0);
  });

  test('cameraFollow locks camera target using string name, object instance, and target getter', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const box = sceneManager.createBox('followTestBox', 0, 0, 0);

      // 1. Follow using string name
      sceneManager.cameraFollow('followTestBox');
      const lockedByString = sceneManager.scene.activeCamera.lockedTarget === box;

      // 2. Follow using direct mesh reference
      sceneManager.cameraFollow(null); // reset first
      sceneManager.cameraFollow(box);
      const lockedByObject = sceneManager.scene.activeCamera.lockedTarget === box;

      // 3. Follow using target getter function
      sceneManager.cameraFollow(null); // reset first
      sceneManager.cameraFollow(() => box);
      const lockedByGetter = sceneManager.scene.activeCamera.lockedTarget === box;

      return {
        lockedByString,
        lockedByObject,
        lockedByGetter
      };
    });

    expect(result.lockedByString).toBe(true);
    expect(result.lockedByObject).toBe(true);
    expect(result.lockedByGetter).toBe(true);
  });
});
