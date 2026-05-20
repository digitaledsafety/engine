const { test, expect } = require('@playwright/test');

test.describe('Engine Jump Functionality', () => {
  test('playerJump precision verification', async ({ page }) => {
    await page.goto('/');
    await page.click("#start-button");
    await page.click("#preview-tab");

    // Initialize scene with ground and player
    await page.evaluate(async () => {
        sceneManager.createGround('ground', 10, 10);
        sceneManager.enablePhysics('ground', 0); // mass 0 for static ground

        const player = sceneManager.createBox('player', 0, 0.5, 0);
        sceneManager.enablePhysics('player', 1); // mass 1
        sceneManager.setAsPlayer('player');

        // Wait for physics to be ready
        await new Promise(r => setTimeout(r, 500));
    });

    // Test 1: Jump while on ground (Y=0.5)
    const canJumpOnGround = await page.evaluate(async () => {
        const player = sceneManager.player;
        const initialVelocity = player.physicsImpostor.getLinearVelocity().y;
        sceneManager.playerJump(5);
        // Step engine manually or wait
        await new Promise(r => setTimeout(r, 100));
        const postJumpVelocity = player.physicsImpostor.getLinearVelocity().y;
        return postJumpVelocity > initialVelocity;
    });
    expect(canJumpOnGround).toBe(true);

    // Test 2: Jump while in mid-air (Y=1.0)
    const canJumpInAir = await page.evaluate(async () => {
        const player = sceneManager.player;
        // Move player to 1.0 (0.5 units above ground)
        player.position.y = 1.0;
        player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));

        const initialVelocity = player.physicsImpostor.getLinearVelocity().y;
        sceneManager.playerJump(5);
        await new Promise(r => setTimeout(r, 100));
        const postJumpVelocity = player.physicsImpostor.getLinearVelocity().y;
        return postJumpVelocity > initialVelocity;
    });
    expect(canJumpInAir).toBe(false);

    // Test 3: Jump while very close to ground (Y=0.55)
    const canJumpNearGround = await page.evaluate(async () => {
        const player = sceneManager.player;
        // Move player to 0.55 (0.05 units above ground)
        player.position.y = 0.55;
        player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));

        const initialVelocity = player.physicsImpostor.getLinearVelocity().y;
        sceneManager.playerJump(5);
        await new Promise(r => setTimeout(r, 100));
        const postJumpVelocity = player.physicsImpostor.getLinearVelocity().y;
        return postJumpVelocity > initialVelocity;
    });
    expect(canJumpNearGround).toBe(true);
  });
});
