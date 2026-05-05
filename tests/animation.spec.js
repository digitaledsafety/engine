const { test, expect } = require('@playwright/test');

test.describe('GLB Animation Playback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('Animations play when importing a model', async ({ page }) => {
    const glbUrl = 'https://cdn.digitaleducationsafety.org/assets/models/HVGirl.glb';

    // Switch to preview tab
    await page.click('#preview-tab');

    // Monitor console for scene ready and potential errors
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push(msg.text());
        console.log('BROWSER:', msg.text());
    });

    // Code to import model and play animation
    const testCode = `
        const model = await sceneManager.importModel('testGirl', '${glbUrl}', 0, 0, 0);
        if (model && model.animationGroups && model.animationGroups.length > 0) {
            console.log('ANIMATION_GROUPS_FOUND: ' + model.animationGroups.length);
            // Play the first animation
            sceneManager.playAnimationByIndex('testGirl', 0, true);

            const activeAnimations = model.animationGroups.filter(ag => ag.isPlaying);
            if (activeAnimations.length > 0) {
                console.log('ANIMATION_IS_PLAYING');
            }
        } else {
            console.log('NO_ANIMATIONS_FOUND');
        }
    `;

    await page.evaluate(async (code) => {
        await window.doRun(code);
    }, testCode);

    // Wait for markers
    await expect.poll(() => consoleMessages, { timeout: 60000 }).toContain('ANIMATION_GROUPS_FOUND: 4');
    await expect.poll(() => consoleMessages, { timeout: 20000 }).toContain('ANIMATION_IS_PLAYING');
  });
});
