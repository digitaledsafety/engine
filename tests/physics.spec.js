const { test, expect } = require('@playwright/test');

test.describe('Engine Physics Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('applyForce moves an object with physics', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const sceneManager = window.sceneManager;
      const box = sceneManager.createBox('forceBox', 0, 1, 0);
      sceneManager.enablePhysics(box, 1, 'BoxImpostor');

      // Wait for physics to stabilize
      await new Promise(resolve => setTimeout(resolve, 200));
      const initialPosition = box.getAbsolutePosition().clone();

      // Apply a VERY large force continuously for a short duration
      // Cannon.js forces can be large depending on mass and gravity
      const forceVector = new BABYLON.Vector3(0, 1000, 0);
      const contactPoint = box.getAbsolutePosition();

      const interval = setInterval(() => {
        sceneManager.applyForce(box, forceVector, contactPoint);
      }, 16);

      await new Promise(resolve => setTimeout(resolve, 1000));
      clearInterval(interval);

      const newPosition = box.getAbsolutePosition();
      console.log(`Initial Y: ${initialPosition.y}, New Y: ${newPosition.y}`);
      return {
        initialY: initialPosition.y,
        newY: newPosition.y,
        moved: newPosition.y > initialPosition.y
      };
    });

    expect(result.moved).toBe(true);
  });

  test('applyImpulse moves an object with physics', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const sceneManager = window.sceneManager;
      const box = sceneManager.createBox('impulseBox', 0, 1, 0);
      sceneManager.enablePhysics(box, 1, 'BoxImpostor');

      // Wait for physics to stabilize
      await new Promise(resolve => setTimeout(resolve, 200));
      const initialPosition = box.getAbsolutePosition().clone();

      // Apply a large impulse upwards
      sceneManager.applyImpulse(box, new BABYLON.Vector3(0, 100, 0), box.getAbsolutePosition());

      // Wait for movement
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newPosition = box.getAbsolutePosition();
      return {
        initialY: initialPosition.y,
        newY: newPosition.y,
        moved: newPosition.y > (initialPosition.y + 0.1)
      };
    });

    expect(result.moved).toBe(true);
  });
});
