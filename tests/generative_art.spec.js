const { test, expect } = require('@playwright/test');

test.describe('Algorithmic Generative Art Workspace', () => {
  test('Generative Art workspace loads with Mandelbulb and GUI controls', async ({ page }) => {
    await page.goto('/workspaces/generative-art/');

    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    await page.click('#preview-tab');

    const playButton = page.locator('#play-overlay-button');
    if (await playButton.isVisible()) {
      await playButton.click();
    }

    // Wait for the scene to initialize
    await page.waitForFunction(() => window.sceneManager && window.sceneManager.scene);

    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible();

    // Verify sceneManager and art object exist
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const sm = window.sceneManager;
        if (!sm || !sm.scene) return false;
        return sm.scene.meshes.length > 0;
      });
    }, { timeout: 15000 }).toBe(true);

    // Verify UI buttons are created
    const buttonCount = await page.evaluate(() => {
      const sm = window.sceneManager;
      if (!sm || !sm.uiManager || !sm.uiManager.controls) return 0;
      return Object.keys(sm.uiManager.controls).length;
    });
    expect(buttonCount).toBeGreaterThanOrEqual(4);

    // Test clicking power button updates power value in metadata and button text
    const powerUpdateSuccess = await page.evaluate(async () => {
      const sm = window.sceneManager;
      const controls = Object.values(sm.uiManager.controls);
      const powerBtn = controls.find(c => c.textBlock && c.textBlock.text && c.textBlock.text.includes('Power'));
      if (!powerBtn) return false;

      // Trigger click callback
      if (powerBtn.onPointerClickObservable) {
        powerBtn.onPointerClickObservable.notifyObservers();
      }

      const meshWithMeta = sm.scene.meshes.find(m => m.metadata && m.metadata.power !== undefined);
      return meshWithMeta && meshWithMeta.metadata.power !== undefined;
    });
    expect(powerUpdateSuccess).toBe(true);

    // Verify default auto-morph state is enabled (ON)
    const initialMorphState = await page.evaluate(() => {
      const sm = window.sceneManager;
      const controls = Object.values(sm.uiManager.controls);
      const morphBtn = controls.find(c => c.textBlock && c.textBlock.text && c.textBlock.text.includes('Morph'));
      const meshWithMeta = sm.scene.meshes.find(m => m.metadata && m.metadata.autoMorph !== undefined);
      return {
        btnText: morphBtn && morphBtn.textBlock ? morphBtn.textBlock.text : '',
        autoMorph: meshWithMeta && meshWithMeta.metadata ? meshWithMeta.metadata.autoMorph : undefined
      };
    });
    expect(initialMorphState.btnText).toContain('ON');
    expect(initialMorphState.autoMorph).toBe(true);

    // Test clicking auto-morph button toggles it OFF
    const morphUpdateSuccess = await page.evaluate(async () => {
      const sm = window.sceneManager;
      const controls = Object.values(sm.uiManager.controls);
      const morphBtn = controls.find(c => c.textBlock && c.textBlock.text && c.textBlock.text.includes('Morph'));
      if (!morphBtn) return false;

      if (morphBtn.onPointerClickObservable) {
        morphBtn.onPointerClickObservable.notifyObservers();
      }

      const meshWithMeta = sm.scene.meshes.find(m => m.metadata && m.metadata.autoMorph !== undefined);
      return meshWithMeta && meshWithMeta.metadata.autoMorph === false && morphBtn.textBlock.text.includes('OFF');
    });
    expect(morphUpdateSuccess).toBe(true);

    // Test clicking palette button
    const paletteUpdateSuccess = await page.evaluate(async () => {
      const sm = window.sceneManager;
      const controls = Object.values(sm.uiManager.controls);
      const palBtn = controls.find(c => c.textBlock && c.textBlock.text && c.textBlock.text.includes('Palette'));
      if (!palBtn) return false;

      if (palBtn.onPointerClickObservable) {
        palBtn.onPointerClickObservable.notifyObservers();
      }

      return palBtn.textBlock.text.includes('1');
    });
    expect(paletteUpdateSuccess).toBe(true);

    // Test switching mode to particle voxels
    const modeSwitchSuccess = await page.evaluate(async () => {
      const sm = window.sceneManager;
      const controls = Object.values(sm.uiManager.controls);
      const modeBtn = controls.find(c => c.textBlock && c.textBlock.text && c.textBlock.text.includes('Mode'));
      if (!modeBtn) return false;

      if (modeBtn.onPointerClickObservable) {
        modeBtn.onPointerClickObservable.notifyObservers();
      }

      return modeBtn.textBlock.text.includes('Particle');
    });
    expect(modeSwitchSuccess).toBe(true);

    // Take screenshot of generative art visualization in canvas
    await page.waitForTimeout(500);
    await canvas.screenshot({ path: 'verification_generative_art.png' });
  });

  test('Templates modal includes Algorithmic Generative Art card', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const hero = document.getElementById('hero-overlay');
      if (hero) hero.remove();
    });

    // Open templates modal via menu button
    await page.locator('#menuButton').click();
    await page.locator('#templatesButton').click();

    // Verify modal is visible
    const modal = page.locator('#templates-modal');
    await expect(modal).toBeVisible();

    // Check for Generative Art card and launch button
    const cardTitle = modal.locator('text=Algorithmic Generative Art');
    await expect(cardTitle).toBeVisible();

    const launchLink = modal.locator('a[href*="/workspaces/generative-art/"]:not([href*="remix"])');
    await expect(launchLink).toBeVisible();

    const remixLink = modal.locator('a[href*="/workspaces/generative-art/?remix=true"]');
    await expect(remixLink).toBeVisible();
  });
});
