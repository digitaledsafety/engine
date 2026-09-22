const { test, expect } = require('@playwright/test');

test.describe('Camera Property Block & API Functionality', () => {
  test('setCameraProperty sets active camera properties directly and via Blockly code execution', async ({ page }) => {
    await page.goto('/');

    // Dismiss hero overlay if present
    const startButton = page.locator('#start-building-btn');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Wait for engine and sceneManager to be ready
    await page.waitForFunction(() => window.sceneManager && window.sceneManager.scene && window.sceneManager.scene.activeCamera);

    // Test direct call to setCameraProperty
    await page.evaluate(() => {
      window.sceneManager.setCameraProperty('inertia', 0.5);
      window.sceneManager.setCameraProperty('wheelPrecision', 20);
      window.sceneManager.setCameraProperty('angularSensibility', 1500);
      window.sceneManager.setCameraProperty('speed', 3);
      window.sceneManager.setCameraProperty('fov', 0.8);
    });

    const cameraProps = await page.evaluate(() => {
      const cam = window.sceneManager.scene.activeCamera;
      return {
        inertia: cam.inertia,
        wheelPrecision: cam.wheelPrecision,
        angularSensibilityX: cam.angularSensibilityX,
        angularSensibilityY: cam.angularSensibilityY,
        speed: cam.speed,
        fov: cam.fov
      };
    });

    expect(cameraProps.inertia).toBe(0.5);
    expect(cameraProps.wheelPrecision).toBe(20);
    expect(cameraProps.angularSensibilityX).toBe(1500);
    expect(cameraProps.angularSensibilityY).toBe(1500);
    expect(cameraProps.speed).toBe(3);
    expect(cameraProps.fov).toBe(0.8);

    // Test Blockly block creation and code generation
    const blockExecutionResult = await page.evaluate(() => {
      const workspace = window.workspace;
      const block = workspace.newBlock('set_camera_property');
      block.setFieldValue('speed', 'PROPERTY');

      const valBlock = workspace.newBlock('math_number');
      valBlock.setFieldValue('10', 'NUM');
      block.getInput('VALUE').connection.connect(valBlock.outputConnection);

      const generator = window.javascript.javascriptGenerator;
      const code = generator.blockToCode(block);

      // Execute generated code
      eval(code);

      return {
        generatedCode: code,
        newSpeed: window.sceneManager.scene.activeCamera.speed
      };
    });

    expect(blockExecutionResult.generatedCode).toContain("sceneManager.setCameraProperty('speed', 10);");
    expect(blockExecutionResult.newSpeed).toBe(10);
  });
});
