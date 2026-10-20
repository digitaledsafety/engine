const { test, expect } = require('@playwright/test');

test.describe('Camera Properties & Safe Fallback Verification', () => {
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
      // 1. Initial default camera properties
      const initialInertia = sceneManager.scene.activeCamera.inertia;
      const initialWheelPrecision = sceneManager.scene.activeCamera.wheelPrecision;

      // 2. Dynamically set new camera properties
      sceneManager.setCameraProperties(0.8, 25);

      const updatedInertia = sceneManager.scene.activeCamera.inertia;
      const updatedWheelPrecision = sceneManager.scene.activeCamera.wheelPrecision;

      return {
        initialInertia,
        initialWheelPrecision,
        updatedInertia,
        updatedWheelPrecision
      };
    });

    expect(result.initialInertia).toBeCloseTo(0.2);
    expect(result.initialWheelPrecision).toBe(10);
    expect(result.updatedInertia).toBeCloseTo(0.8);
    expect(result.updatedWheelPrecision).toBe(25);
  });

  test('set_camera_properties block generates valid sceneManager.setCameraProperties code', async ({ page }) => {
    const generatedCode = await page.evaluate(() => {
      const workspace = Blockly.getMainWorkspace();
      const block = workspace.newBlock('set_camera_properties');

      const inertiaBlock = workspace.newBlock('math_number');
      inertiaBlock.setFieldValue(0.5, 'NUM');
      block.getInput('INERTIA').connection.connect(inertiaBlock.outputConnection);

      const precisionBlock = workspace.newBlock('math_number');
      precisionBlock.setFieldValue(15, 'NUM');
      block.getInput('WHEEL_PRECISION').connection.connect(precisionBlock.outputConnection);

      const code = javascript.javascriptGenerator.blockToCode(block);
      return Array.isArray(code) ? code[0] : code;
    });

    expect(generatedCode).toContain('sceneManager.setCameraProperties(0.5, 15);');
  });

  test('fallback isValidAssetURL and getProxiedUrl functions handle asset sanitization correctly', async ({ page }) => {
    const result = await page.evaluate(() => {
      const validHttps = isValidAssetURL('https://example.com/model.glb');
      const validBlob = isValidAssetURL('blob:http://localhost/1234');
      const invalidProtocolRelative = isValidAssetURL('//evil.com/script.js');
      const invalidHtmlData = isValidAssetURL('data:text/html,<script>alert(1)</script>');

      const proxiedHttps = getProxiedUrl('https://example.com/asset.png');
      const proxiedBlob = getProxiedUrl('blob:http://localhost/1234');

      return {
        validHttps,
        validBlob,
        invalidProtocolRelative,
        invalidHtmlData,
        proxiedHttps,
        proxiedBlob
      };
    });

    expect(result.validHttps).toBe(true);
    expect(result.validBlob).toBe(true);
    expect(result.invalidProtocolRelative).toBe(false);
    expect(result.invalidHtmlData).toBe(false);
    expect(result.proxiedHttps).toBe('https://proxy.functions.io/?url=https%3A%2F%2Fexample.com%2Fasset.png');
    expect(result.proxiedBlob).toBe('blob:http://localhost/1234');
  });
});
