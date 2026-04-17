const { test, expect } = require('@playwright/test');

test.describe('Engine STEM Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Handle the hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('Distance measurement and move towards work', async ({ page }) => {
    // Switch to preview tab
    await page.click('#preview-tab');

    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    const testCode = `
      (async () => {
        const box1 = sceneManager.createBox('box1', 0, 0, 0);
        const box2 = sceneManager.createBox('box2', 10, 0, 0);

        // Force world matrix update to get correct absolute positions
        box1.computeWorldMatrix(true);
        box2.computeWorldMatrix(true);

        const dist = sceneManager.getDistance('box1', 'box2');
        console.log('DISTANCE_INITIAL: ' + dist);

        sceneManager.everyFrame('box1', (mesh) => {
           sceneManager.moveTowards('box1', 'box2', 10); // increased speed
        });

        // Wait a bit
        await new Promise(r => setTimeout(r, 500));

        // Again force update for measurement
        box1.computeWorldMatrix(true);
        box2.computeWorldMatrix(true);

        const distMid = sceneManager.getDistance('box1', 'box2');
        console.log('DISTANCE_MID: ' + distMid);

        if (distMid < dist && dist > 0) {
           console.log('STEM_MOVE_SUCCESS');
        } else {
           console.log('STEM_MOVE_FAILURE: initial=' + dist + ' mid=' + distMid);
        }
      })();
    `;

    await page.evaluate((code) => {
        window.doRun(code);
    }, testCode);

    await expect.poll(() => consoleMessages).toContain('STEM_MOVE_SUCCESS');
  });

  test('Look at works', async ({ page }) => {
    await page.click('#preview-tab');

    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    const testCode = `
      (async () => {
        const box1 = sceneManager.createBox('box1', 0, 0, 0);
        const box2 = sceneManager.createBox('box2', 10, 0, 10); // placed at an angle

        box1.computeWorldMatrix(true);
        box2.computeWorldMatrix(true);

        const initialRot = box1.rotation.clone();
        const initialQuat = box1.rotationQuaternion ? box1.rotationQuaternion.clone() : null;

        sceneManager.lookAt('box1', 'box2');

        const finalRot = box1.rotation;
        const finalQuat = box1.rotationQuaternion;

        console.log('ROTATION_INITIAL: ' + initialRot);
        console.log('ROTATION_FINAL: ' + finalRot);

        let changed = !finalRot.equals(initialRot);
        if (finalQuat) {
           if (!initialQuat || !finalQuat.equals(initialQuat)) {
               changed = true;
           }
        }

        if (changed) {
           console.log('STEM_LOOKAT_SUCCESS');
        } else {
           console.log('STEM_LOOKAT_FAILURE');
        }
      })();
    `;

    await page.evaluate((code) => {
        window.doRun(code);
    }, testCode);

    await expect.poll(() => consoleMessages).toContain('STEM_LOOKAT_SUCCESS');
  });
});
