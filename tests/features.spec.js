const { test, expect } = require('@playwright/test');

test.describe('Engine New Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('Cylinder primitive creation works', async ({ page }) => {
    await page.click('#preview-tab');
    const result = await page.evaluate(async () => {
      await window.doRun("sceneManager.createCylinder('testCylinder', 0, 0, 0);");
      return !!window.sceneManager.objects['testCylinder'];
    });
    expect(result).toBe(true);
  });

  test('Robust jump check prevents mid-air jumping', async ({ page }) => {
    await page.click('#preview-tab');
    const jumpResult = await page.evaluate(async () => {
      // 1. Create a player and ground
      sceneManager.createGround('ground', 10, 10);
      const player = sceneManager.createBox('player', 0, 1, 0);
      sceneManager.setAsPlayer(player);
      sceneManager.enablePhysics(player, 1, 'BoxImpostor');

      // Wait for 30 frames to let physics settle the player on the ground
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => sceneManager.scene.onAfterRenderObservable.addOnce(resolve));
      }

      // 2. Initial jump (should work)
      const initialY = player.position.y;
      sceneManager.playerJump(10);

      // Wait for 15 frames to be in the air
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => sceneManager.scene.onAfterRenderObservable.addOnce(resolve));
      }
      const inAirY = player.position.y;
      const jump1Success = inAirY > initialY + 0.1;

      // 3. Try to jump again while in air
      const velBefore = player.physicsImpostor.getLinearVelocity().y;
      sceneManager.playerJump(10);
      const velAfter = player.physicsImpostor.getLinearVelocity().y;

      // If robust check works, velAfter should be same or less than velBefore (gravity acting)
      // and certainly not significantly increased by another impulse
      const jump2Prevented = velAfter <= velBefore + 1;

      return { jump1Success, jump2Prevented };
    });

    expect(jumpResult.jump1Success).toBe(true);
    expect(jumpResult.jump2Prevented).toBe(true);
  });
});
