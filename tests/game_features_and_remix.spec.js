const { test, expect } = require('@playwright/test');

test.describe('Game Rules, Remixing, Starter Templates & Collaborative Workspace Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const hero = document.getElementById('hero-overlay');
      if (hero) hero.remove();
    });
  });

  test('High-Level Game Rules & State engine methods work correctly', async ({ page }) => {
    const gameStateResult = await page.evaluate(() => {
      const sm = window.sceneManager;
      sm.setGameState('playing');
      const state = sm.getGameState();

      sm.setGameScore(100);
      sm.addGameScore(50);
      const score = sm.getGameScore();

      sm.setGameHealth(80);
      sm.changeGameHealth(-20);
      const health = sm.getGameHealth();

      sm.displayGameHUD(true, true, 100);
      const hudVisible = !!(sm.hudElements && sm.hudElements.container);

      return { state, score, health, hudVisible };
    });

    expect(gameStateResult.state).toBe('playing');
    expect(gameStateResult.score).toBe(150);
    expect(gameStateResult.health).toBe(60);
    expect(gameStateResult.hudVisible).toBe(true);
  });

  test('Game over popup can be triggered programmatically', async ({ page }) => {
    const gameOverTriggered = await page.evaluate(() => {
      const sm = window.sceneManager;
      sm.setGameScore(250);
      sm.triggerGameOver(true, 'Test Victory Message');
      return sm.getGameState();
    });

    expect(gameOverTriggered).toBe('victory');
  });

  test('Project Remix button creates a copy and displays toast', async ({ page }) => {
    await page.locator('#menuButton').click();
    await page.locator('#remixButton').click();

    await page.waitForTimeout(500);

    const toastText = await page.locator('#remix-toast').textContent();
    expect(toastText).toContain('Remixed!');

    const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
    const hasRemixKey = localStorageKeys.some(k => k.startsWith('engine_project_remix-'));
    expect(hasRemixKey).toBe(true);
  });

  test('Visiting URL with ?remix=true triggers automatic remixing', async ({ page }) => {
    await page.goto('/?remix=true', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const toastVisible = await page.locator('#remix-toast').isVisible();
    expect(toastVisible).toBe(true);
  });

  test('Starter Templates Modal opens and closes properly', async ({ page }) => {
    await page.locator('#menuButton').click();
    await page.locator('#templatesButton').click();

    const isVisible = await page.locator('#templates-modal').isVisible();
    expect(isVisible).toBe(true);

    const cardsCount = await page.locator('#templates-grid .template-card').count();
    expect(cardsCount).toBeGreaterThanOrEqual(6);

    await page.locator('#close-templates-modal').click();
    const isHidden = await page.locator('#templates-modal').isHidden();
    expect(isHidden).toBe(true);
  });

  test('Collaborative Workspace Modal opens and CollabWorkspaceManager exists', async ({ page }) => {
    await page.locator('#menuButton').click();
    await page.locator('#collabButton').click();

    const isVisible = await page.locator('#collab-modal').isVisible();
    expect(isVisible).toBe(true);

    const managerExists = await page.evaluate(() => {
      return !!window.collabWorkspaceManager && typeof window.collabWorkspaceManager.hostSession === 'function';
    });
    expect(managerExists).toBe(true);

    await page.locator('#close-collab-modal').click();
    const isHidden = await page.locator('#collab-modal').isHidden();
    expect(isHidden).toBe(true);
  });

  test('Game over popup cancels out pointer actions on objects beneath the screen', async ({ page }) => {
    await page.goto('/workspaces/click-it', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const hero = document.getElementById('hero-overlay');
      if (hero) hero.remove();
    });

    await page.click('#preview-tab');
    await page.evaluate(() => window.doRun());

    // Wait for the round timer to finish and display the game over / victory popup
    await page.waitForTimeout(5500);

    const popupInfo = await page.evaluate(() => {
      const sm = window.sceneManager;
      const popupName = Object.keys(sm.uiManager.controls).find(k => k.startsWith('game_over_popup_'));
      const container = sm.uiManager.controls[popupName];
      return {
        popupExists: !!container,
        isPointerBlocker: container ? container.isPointerBlocker : false
      };
    });

    expect(popupInfo.popupExists).toBe(true);
    expect(popupInfo.isPointerBlocker).toBe(true);

    // Find screen position of an underlying 3D target sphere
    const targetSphereScreenPos = await page.evaluate(() => {
      const sm = window.sceneManager;
      const meshNames = Object.keys(sm.objects);
      for (const name of meshNames) {
        const mesh = sm.objects[name];
        if (mesh && !mesh.isDisposed()) {
          const screenPos = BABYLON.Vector3.Project(
            mesh.getAbsolutePosition(),
            BABYLON.Matrix.Identity(),
            sm.scene.getTransformMatrix(),
            sm.scene.activeCamera.viewport.toGlobal(
              sm.engine.getRenderWidth(),
              sm.engine.getRenderHeight()
            )
          );
          return { name, x: screenPos.x, y: screenPos.y };
        }
      }
      return null;
    });

    expect(targetSphereScreenPos).not.toBeNull();

    const initialScore = await page.evaluate(() => window.sceneManager.getGameScore());

    // Click directly where the underlying sphere is located
    const canvasBox = await page.locator('#gameCanvas').boundingBox();
    await page.mouse.click(canvasBox.x + targetSphereScreenPos.x, canvasBox.y + targetSphereScreenPos.y);

    // Verify score did not increase while game over screen is active
    const scoreAfterClick = await page.evaluate(() => window.sceneManager.getGameScore());
    expect(scoreAfterClick).toBe(initialScore);
  });

});
