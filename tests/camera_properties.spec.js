const { test, expect } = require('@playwright/test');

test.describe('Camera Properties Block & API Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    await page.click('#preview-tab');
  });

  test('setCameraProperty sets active camera properties correctly', async ({ page }) => {
    const result = await page.evaluate(async () => {
      sceneManager.setCameraProperty('inertia', 0.5);
      sceneManager.setCameraProperty('wheelPrecision', 25);
      sceneManager.setCameraProperty('speed', 2);
      sceneManager.setCameraProperty('fov', 0.9);

      const camera = sceneManager.scene.activeCamera;

      return {
        inertia: camera.inertia,
        wheelPrecision: camera.wheelPrecision,
        speed: camera.speed,
        fov: camera.fov
      };
    });

    expect(result.inertia).toBeCloseTo(0.5);
    expect(result.wheelPrecision).toBe(25);
    expect(result.speed).toBe(2);
    expect(result.fov).toBeCloseTo(0.9);
  });

  test('set_camera_property Blockly generator emits valid JavaScript code', async ({ page }) => {
    const generatedCode = await page.evaluate(() => {
      const workspace = window.workspace || Blockly.getMainWorkspace();
      const block = workspace.newBlock('set_camera_property');
      block.setFieldValue('inertia', 'PROPERTY');

      const valBlock = workspace.newBlock('math_number');
      valBlock.setFieldValue('0.35', 'NUM');
      block.getInput('VALUE').connection.connect(valBlock.outputConnection);

      return javascript.javascriptGenerator.blockToCode(block);
    });

    expect(generatedCode).toContain("sceneManager.setCameraProperty('inertia', 0.35);");
  });
});
