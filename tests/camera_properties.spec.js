const { test, expect } = require('@playwright/test');

test.describe('Camera Properties Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    await page.click('#preview-tab');
  });

  test('setCameraProperties programmatically updates active camera inertia and wheelPrecision', async ({ page }) => {
    const result = await page.evaluate(() => {
      sceneManager.setCameraProperties(0.5, 25);
      const camera = sceneManager.scene.activeCamera;
      return {
        inertia: camera.inertia,
        wheelPrecision: camera.wheelPrecision
      };
    });

    expect(result.inertia).toBe(0.5);
    expect(result.wheelPrecision).toBe(25);
  });

  test('set_camera_properties block generates valid JavaScript and executes properly', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Create and load workspace with set_camera_properties block
      const workspaceState = {
        blocks: {
          languageVersion: 0,
          blocks: [
            {
              type: 'set_camera_properties',
              id: 'cam_props_1',
              x: 50,
              y: 50,
              inputs: {
                INERTIA: {
                  block: {
                    type: 'math_number',
                    fields: { NUM: 0.8 }
                  }
                },
                WHEEL_PRECISION: {
                  block: {
                    type: 'math_number',
                    fields: { NUM: 15 }
                  }
                }
              }
            }
          ]
        }
      };

      Blockly.serialization.workspaces.load(workspaceState, workspace);
      const code = generateCode();

      // Execute generated code via doRun
      await doRun(code);

      const camera = sceneManager.scene.activeCamera;
      return {
        generatedCode: code,
        inertia: camera.inertia,
        wheelPrecision: camera.wheelPrecision
      };
    });

    expect(result.generatedCode).toContain('sceneManager.setCameraProperties(0.8, 15);');
    expect(result.inertia).toBe(0.8);
    expect(result.wheelPrecision).toBe(15);
  });
});
