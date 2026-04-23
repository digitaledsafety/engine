const { test, expect } = require('@playwright/test');

test.describe('UI Property Manipulation', () => {
  test('setProperty works on UI elements', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await page.click("#start-button");

    const result = await page.evaluate(async () => {
        const workspace = window.workspace;
        workspace.clear();
        workspace.clearUndo();

        // 1. Create a UI Text Block
        // sceneManager.uiManager.createText(name, text, options)
        window.sceneManager.uiManager.createText('testText', 'Initial', { color: 'white' });

        // 2. Use setProperty via BabylonSceneManager to change its color
        // sceneManager.setProperty(target, property, value)
        window.sceneManager.setProperty('testText', 'color', 'red');

        // 3. Verify the change
        const control = window.sceneManager.uiManager.getControlByName('testText');
        return {
            text: control.text,
            color: control.color
        };
    });

    expect(result.text).toBe('Initial');
    expect(result.color).toBe('red');
  });
});
