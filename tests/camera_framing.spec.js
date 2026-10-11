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

  test('setCameraInertia and setCameraWheelPrecision update active camera properties', async ({ page }) => {
    const result = await page.evaluate(async () => {
      sceneManager.setCameraInertia(0.5);
      sceneManager.setCameraWheelPrecision(25);

      const camera = sceneManager.scene.activeCamera;
      return {
        inertia: camera.inertia,
        wheelPrecision: camera.wheelPrecision
      };
    });

    expect(result.inertia).toBe(0.5);
    expect(result.wheelPrecision).toBe(25);
  });

  test('set_camera_inertia and set_camera_wheel_precision Blockly blocks exist and generate correct code', async ({ page }) => {
    const codeResult = await page.evaluate(() => {
      const inertiaBlock = workspace.newBlock('set_camera_inertia');
      const precisionBlock = workspace.newBlock('set_camera_wheel_precision');

      const valInertia = workspace.newBlock('math_number');
      valInertia.setFieldValue('0.15', 'NUM');
      inertiaBlock.getInput('INERTIA').connection.connect(valInertia.outputConnection);

      const valPrecision = workspace.newBlock('math_number');
      valPrecision.setFieldValue('15', 'NUM');
      precisionBlock.getInput('PRECISION').connection.connect(valPrecision.outputConnection);

      const inertiaCode = javascript.javascriptGenerator.blockToCode(inertiaBlock);
      const precisionCode = javascript.javascriptGenerator.blockToCode(precisionBlock);

      return {
        inertiaCode,
        precisionCode
      };
    });

    expect(codeResult.inertiaCode).toContain('sceneManager.setCameraInertia(0.15);');
    expect(codeResult.precisionCode).toContain('sceneManager.setCameraWheelPrecision(15);');
  });
});
