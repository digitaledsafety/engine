const { test, expect } = require('@playwright/test');

test.describe('STEM Blocks', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.goto('/');
    const startButton = page.getByRole("button", { name: "Start Coding" });
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('getDistance calculates distance correctly', async ({ page }) => {
    const distance = await page.evaluate(async () => {
      window.workspace.clear();
      sceneManager.createBox('box1', 0, 0, 0);
      sceneManager.createBox('box2', 0, 10, 0);
      // Wait for matrices to be updated
      sceneManager.objects['box1'].computeWorldMatrix(true);
      sceneManager.objects['box2'].computeWorldMatrix(true);
      return sceneManager.getDistance('box1', 'box2');
    });
    expect(distance).toBeCloseTo(10);
  });

  test('lookAt rotates object correctly', async ({ page }) => {
    const rotationY = await page.evaluate(async () => {
      window.workspace.clear();
      const box1 = sceneManager.createBox('box1', 0, 0, 0);
      sceneManager.createBox('box2', 10, 0, 0);
      sceneManager.lookAt('box1', 'box2');
      return box1.rotation.y;
    });
    expect(rotationY).not.toBe(0);
  });

  test('moveTowards moves object correctly', async ({ page }) => {
    const finalPos = await page.evaluate(async () => {
      window.workspace.clear();
      const box1 = sceneManager.createBox('box1', 0, 0, 0);
      sceneManager.createBox('box2', 10, 0, 0);

      const originalGetDeltaTime = sceneManager.engine.getDeltaTime;
      sceneManager.engine.getDeltaTime = () => 1000;

      sceneManager.moveTowards('box1', 'box2', 5);

      sceneManager.engine.getDeltaTime = originalGetDeltaTime;
      return box1.position.x;
    });
    expect(finalPos).toBeCloseTo(5);
  });
});
