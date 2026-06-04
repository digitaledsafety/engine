const { test, expect } = require('@playwright/test');

test.describe('Light Property Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('set_light_property block correctly updates light intensity and color', async ({ page }) => {
    // Inject code to create a light and change its property
    await page.evaluate(async () => {
        const code = `
            const light = sceneManager.createAdvancedLight('point', 'testLight', 0, 10, 0, 0, -1, 0);
            sceneManager.setLightProperty(light, 'intensity', 5);
            sceneManager.setLightProperty(light, 'diffuse', '#ff0000');
        `;
        await window.doRun(code);
    });

    // Verify the changes in the Babylon scene
    const lightProperties = await page.evaluate(() => {
        const light = window.sceneManager.scene.getLightByName('testLight');
        if (!light) return null;
        return {
            intensity: light.intensity,
            diffuse: light.diffuse.toHexString()
        };
    });

    expect(lightProperties).not.toBeNull();
    expect(lightProperties.intensity).toBe(5);
    expect(lightProperties.diffuse.toLowerCase()).toBe('#ff0000');
  });

  test('set_light_property block is present in toolbox', async ({ page }) => {
    // Open toolbox if closed
    const toolboxCollapsed = await page.evaluate(() => document.getElementById('blocklyDiv').classList.contains('toolbox-collapsed'));
    if (toolboxCollapsed) {
        await page.click('#toggleToolboxButton');
    }

    // Check Scene category for set_light_property
    await page.click('text=Scene', { force: true });
    const lightPropBlock = page.locator('.blocklyBlockCanvas >> text=set property');
    await expect(lightPropBlock).toBeVisible();
  });
});
