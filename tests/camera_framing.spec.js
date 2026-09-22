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

  test('setCameraProperty sets active camera properties correctly', async ({ page }) => {
    const result = await page.evaluate(() => {
      sceneManager.setCameraProperty('inertia', 0.5);
      sceneManager.setCameraProperty('wheelPrecision', 20);
      sceneManager.setCameraProperty('angularSensibility', 1500);
      sceneManager.setCameraProperty('fov', 1.2);

      const camera = sceneManager.scene.activeCamera;
      return {
        inertia: camera.inertia,
        wheelPrecision: camera.wheelPrecision,
        angularSensibilityX: camera.angularSensibilityX,
        angularSensibilityY: camera.angularSensibilityY,
        fov: camera.fov
      };
    });

    expect(result.inertia).toBe(0.5);
    expect(result.wheelPrecision).toBe(20);
    expect(result.angularSensibilityX).toBe(1500);
    expect(result.angularSensibilityY).toBe(1500);
    expect(result.fov).toBeCloseTo(1.2);
  });

  test('cameraFollow points camera at mesh safely with string name or mesh reference', async ({ page }) => {
    const result = await page.evaluate(() => {
      const box = sceneManager.createBox('followTestBox', 1, 2, 3);
      sceneManager.cameraFollow('followTestBox');
      const camera = sceneManager.scene.activeCamera;
      const lockedNameString = camera.lockedTarget ? camera.lockedTarget.name : null;

      sceneManager.cameraFollow(box);
      const lockedNameObj = camera.lockedTarget ? camera.lockedTarget.name : null;

      return {
        lockedNameString,
        lockedNameObj
      };
    });

    expect(result.lockedNameString).toBe('followTestBox');
    expect(result.lockedNameObj).toBe('followTestBox');
  });
});
