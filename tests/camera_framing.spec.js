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

  test('target resolution in setAsPlayer, cameraFollow, setFpsCamera, onClick, and everyFrame supports string and object references', async ({ page }) => {
    const testResult = await page.evaluate(async () => {
      const boxMesh = sceneManager.createBox('resolutionTestBox', 1, 2, 3);

      // Test cameraFollow with mesh object directly
      sceneManager.cameraFollow(boxMesh);
      const followWithObject = sceneManager.scene.activeCamera.lockedTarget === boxMesh;

      // Test cameraFollow with string name
      sceneManager.cameraFollow('resolutionTestBox');
      const followWithString = sceneManager.scene.activeCamera.lockedTarget === boxMesh;

      // Test setAsPlayer with mesh object
      sceneManager.setAsPlayer(boxMesh);
      const playerWithObject = sceneManager.player === boxMesh;

      // Test setAsPlayer with string name
      sceneManager.setAsPlayer('resolutionTestBox');
      const playerWithString = sceneManager.player === boxMesh;

      // Test setFpsCamera with direct mesh object
      sceneManager.setFpsCamera(boxMesh);
      const fpsCameraCreated = sceneManager.scene.activeCamera.name === 'fpsCamera';

      // Test onClick with direct mesh object
      let clickRegistered = false;
      sceneManager.onClick(boxMesh, () => { clickRegistered = true; });

      // Test everyFrame with direct mesh object
      let frameFuncRegistered = false;
      sceneManager.everyFrame(boxMesh, (m) => { frameFuncRegistered = true; });

      const lastFrameFunc = sceneManager.perFrameFunctions[sceneManager.perFrameFunctions.length - 1];
      if (lastFrameFunc && lastFrameFunc.targetMesh === boxMesh) {
        lastFrameFunc.func(boxMesh, 16);
      }

      return {
        followWithObject,
        followWithString,
        playerWithObject,
        playerWithString,
        fpsCameraCreated,
        frameFuncRegistered
      };
    });

    expect(testResult.followWithObject).toBe(true);
    expect(testResult.followWithString).toBe(true);
    expect(testResult.playerWithObject).toBe(true);
    expect(testResult.playerWithString).toBe(true);
    expect(testResult.fpsCameraCreated).toBe(true);
    expect(testResult.frameFuncRegistered).toBe(true);
  });

  test('point_camera_at_mesh block generator passes mesh variable directly', async ({ page }) => {
    const generatorResult = await page.evaluate(() => {
      javascript.javascriptGenerator.init(window.workspace);
      const myVar = window.workspace.createVariable('myMeshVar');
      const block = window.workspace.newBlock('point_camera_at_mesh');
      block.setFieldValue(myVar.getId(), 'MESH');
      const code = javascript.javascriptGenerator.forBlock['point_camera_at_mesh'](block, javascript.javascriptGenerator);
      block.dispose();
      return code;
    });

    expect(generatorResult).toBe('sceneManager.cameraFollow(myMeshVar);\n');
  });
});
