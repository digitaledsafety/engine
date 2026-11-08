const { test, expect } = require('@playwright/test');

test.describe('Default Workspace 3D Numbers Rotation', () => {
  test('3D number meshes start at 0 rotation and animate to 360 degrees', async ({ page }) => {
    await page.goto('/workspaces/default/');

    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Switch to preview tab
    await page.click('#preview-tab');

    // Run the scene
    await page.evaluate(async () => {
      await window.doRun();
    });

    // Check that 3d coin numbers exist and their rotation is animated from 0 to 360
    await page.waitForFunction(() => {
      const scene = window.sceneManager && window.sceneManager.scene;
      if (!scene) return false;
      const coinMeshes = scene.meshes.filter(m => m.name && m.name.startsWith('coin_'));
      return coinMeshes.length > 0;
    }, { timeout: 30000 });

    const result = await page.evaluate(() => {
      const scene = window.sceneManager.scene;
      const coin = scene.meshes.find(m => m.name && m.name.startsWith('coin_'));
      const animatables = scene.getAllAnimatables ? scene.getAllAnimatables() : (scene.animatables || []);
      const coinAnimatable = animatables.find(a => a.target === coin);
      const runtimeAnim = coinAnimatable && coinAnimatable.getAnimations ? coinAnimatable.getAnimations()[0] : null;
      const anim = runtimeAnim ? (runtimeAnim.animation || runtimeAnim) : null;
      const keys = (anim && typeof anim.getKeys === 'function') ? anim.getKeys() : [];

      return {
        coinName: coin ? coin.name : null,
        hasAnim: !!anim,
        startKey: keys[0] ? { x: keys[0].value.x, y: keys[0].value.y, z: keys[0].value.z, w: keys[0].value.w } : null,
        endKey: keys[keys.length - 1] ? { x: keys[keys.length - 1].value.x, y: keys[keys.length - 1].value.y, z: keys[keys.length - 1].value.z, w: keys[keys.length - 1].value.w } : null
      };
    });

    expect(result.coinName).not.toBeNull();
    expect(result.hasAnim).toBe(true);

    // Initial rotation Euler angles were (0, 0, 0), so Quaternion is (0, 0, 0, 1)
    expect(Math.abs(result.startKey.x)).toBeLessThan(0.001);
    expect(Math.abs(result.startKey.y)).toBeLessThan(0.001);
    expect(Math.abs(result.startKey.z)).toBeLessThan(0.001);
    expect(Math.abs(result.startKey.w - 1)).toBeLessThan(0.001);

    // Target rotation Euler angles are (0, 360, 0)
    expect(Math.abs(result.endKey.x)).toBeLessThan(0.001);
    expect(Math.abs(result.endKey.y)).toBeLessThan(0.001);
    expect(Math.abs(result.endKey.z)).toBeLessThan(0.001);
  });
});
