const { test, expect } = require('@playwright/test');

test.describe('Camera Properties Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    await page.click('#preview-tab');
  });

  test('setCameraProperties updates active camera inertia and wheel precision', async ({ page }) => {
    const result = await page.evaluate(async () => {
      window.sceneManager.setCameraProperties(0.8, 25);
      const camera = window.sceneManager.scene.activeCamera;
      return {
        inertia: camera.inertia,
        wheelPrecision: camera.wheelPrecision
      };
    });

    expect(result.inertia).toBeCloseTo(0.8);
    expect(result.wheelPrecision).toBe(25);
  });

  test('set_camera_properties block generates valid code and executes in workspace', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const workspace = window.workspace;
      workspace.clear();
      workspace.clearUndo();

      const block = workspace.newBlock('set_camera_properties');

      const inertiaBlock = workspace.newBlock('math_number');
      inertiaBlock.setFieldValue('0.5', 'NUM');
      block.getInput('INERTIA').connection.connect(inertiaBlock.outputConnection);

      const precisionBlock = workspace.newBlock('math_number');
      precisionBlock.setFieldValue('15', 'NUM');
      block.getInput('WHEEL_PRECISION').connection.connect(precisionBlock.outputConnection);

      const code = Blockly.JavaScript.workspaceToCode(workspace);
      await window.doRun(code);

      const camera = window.sceneManager.scene.activeCamera;
      return {
        generatedCode: code,
        inertia: camera.inertia,
        wheelPrecision: camera.wheelPrecision
      };
    });

    expect(result.generatedCode).toContain('sceneManager.setCameraProperties(0.5, 15);');
    expect(result.inertia).toBeCloseTo(0.5);
    expect(result.wheelPrecision).toBe(15);
  });
});
