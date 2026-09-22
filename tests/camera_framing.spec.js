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

  test('cameraFollow and setFpsCamera resolve target using _getMesh with string names, mesh instances, and lazy functions', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const box1 = sceneManager.createBox('box1', 0, 0, 0);
      const box2 = sceneManager.createBox('box2', 10, 0, 0);

      // 1. Test cameraFollow with string name
      sceneManager.cameraFollow('box1');
      const lockedByString = sceneManager.scene.activeCamera.lockedTarget === box1;

      // 2. Test cameraFollow with mesh object
      sceneManager.cameraFollow(box2);
      const lockedByObject = sceneManager.scene.activeCamera.lockedTarget === box2;

      // 3. Test cameraFollow with lazy getter function
      sceneManager.cameraFollow(() => box1);
      const lockedByFunction = sceneManager.scene.activeCamera.lockedTarget === box1;

      // 4. Test setFpsCamera with string name
      sceneManager.setFpsCamera('box1');
      const fpsParentByString = sceneManager.scene.activeCamera.parent === box1;

      // 5. Test setFpsCamera with mesh object
      sceneManager.setFpsCamera(box2);
      const fpsParentByObject = sceneManager.scene.activeCamera.parent === box2;

      // 6. Test setFpsCamera with lazy getter function
      sceneManager.setFpsCamera(() => box1);
      const fpsParentByFunction = sceneManager.scene.activeCamera.parent === box1;

      return {
        lockedByString,
        lockedByObject,
        lockedByFunction,
        fpsParentByString,
        fpsParentByObject,
        fpsParentByFunction
      };
    });

    expect(result.lockedByString).toBe(true);
    expect(result.lockedByObject).toBe(true);
    expect(result.lockedByFunction).toBe(true);
    expect(result.fpsParentByString).toBe(true);
    expect(result.fpsParentByObject).toBe(true);
    expect(result.fpsParentByFunction).toBe(true);
  });
});
