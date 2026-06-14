const { test, expect } = require('@playwright/test');

test.describe('Physics and Creation Standards V2', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.goto('/');
    // Handle the hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('Velocity methods exist in BabylonSceneManager', async ({ page }) => {
    const methodsExist = await page.evaluate(() => {
        return typeof window.sceneManager.setLinearVelocity === 'function' &&
               typeof window.sceneManager.setAngularVelocity === 'function' &&
               typeof window.sceneManager.clearCollisionCache === 'function';
    });
    expect(methodsExist).toBe(true);
  });

  test('Refactored creation blocks return unique IDs', async ({ page }) => {
    const ids = await page.evaluate(async () => {
        window.workspace.clear();

        // Test create_primitive
        const primitiveBlock = window.workspace.newBlock('create_primitive');
        primitiveBlock.setFieldValue('box', 'TYPE');
        const primId = await eval(`(async () => {
            const generator = javascript.javascriptGenerator;
            const code = generator.blockToCode(primitiveBlock);
            return code;
        })()`);

        // Test create_box
        const boxBlock = window.workspace.newBlock('create_box');
        const boxIdCode = javascript.javascriptGenerator.blockToCode(boxBlock);

        return { primId, boxIdCode };
    });

    // Check if the generated code contains 'id_'
    expect(ids.primId[0]).toMatch(/sceneManager\.createBox\('id_/);
    expect(ids.boxIdCode[0]).toMatch(/sceneManager\.createBox\('id_/);
  });

  test('importModel handles Roblox URLs', async ({ page }) => {
    const callDetails = await page.evaluate(async () => {
        let called = false;
        let capturedUserId = null;
        const original = window.sceneManager.importRobloxAvatar;
        window.sceneManager.importRobloxAvatar = (name, userId) => {
            called = true;
            capturedUserId = userId;
            return Promise.resolve({});
        };

        await window.sceneManager.importModel('testRoblox', 'https://www.roblox.com/users/12345/profile', 0, 0, 0);

        window.sceneManager.importRobloxAvatar = original;
        return { called, capturedUserId };
    });

    expect(callDetails.called).toBe(true);
    expect(callDetails.capturedUserId).toBe('12345');
  });

  test('get_scene_object block generates correct code', async ({ page }) => {
    const generatedCodes = await page.evaluate(() => {
        window.workspace.clear();

        const results = {};
        ['player', 'camera', 'scene'].forEach(objType => {
            const block = window.workspace.newBlock('get_scene_object');
            block.setFieldValue(objType, 'OBJECT');
            results[objType] = javascript.javascriptGenerator.blockToCode(block)[0];
        });

        return results;
    });

    expect(generatedCodes.player).toContain('sceneManager.player');
    expect(generatedCodes.camera).toContain('sceneManager.scene.activeCamera');
    expect(generatedCodes.scene).toContain('sceneManager.scene');
  });
});
