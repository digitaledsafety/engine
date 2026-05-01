import { test, expect } from '@playwright/test';

test('verify new primitives and physics enhancements', async ({ page }) => {
  await page.goto('http://127.0.0.1:4000');
  await page.click('#start-button');
  await page.waitForFunction(() => typeof window.workspace !== 'undefined');

  // Verify new primitives in BabylonSceneManager
  const hasNewPrimitives = await page.evaluate(() => {
    return typeof window.sceneManager.createCone === 'function' &&
           typeof window.sceneManager.createTorus === 'function';
  });
  expect(hasNewPrimitives).toBe(true);

  // Verify enablePhysics accepts new parameters
  const physicsParams = await page.evaluate(async () => {
    const sm = window.sceneManager;
    sm.createBox('testBox', 0, 5, 0);
    sm.enablePhysics('testBox', 1, 'BoxImpostor', 0.5, 0.1);
    const impostor = sm.objects['testBox'].physicsImpostor;
    return {
        friction: impostor.friction,
        restitution: impostor.restitution
    };
  });
  expect(physicsParams.friction).toBeCloseTo(0.5);
  expect(physicsParams.restitution).toBeCloseTo(0.1);

  // Verify animation loop params helper (indirectly)
  const animationCode = await page.evaluate(() => {
    const block = window.workspace.newBlock('animate_position');
    block.setFieldValue('YES', 'LOOP');
    return javascript.javascriptGenerator.blockToCode(block);
  });
  expect(animationCode).toContain('true, \'CYCLE\'');

  const animationPingPongCode = await page.evaluate(() => {
    const block = window.workspace.newBlock('animate_position');
    block.setFieldValue('PINGPONG', 'LOOP');
    return javascript.javascriptGenerator.blockToCode(block);
  });
  expect(animationPingPongCode).toContain('true, \'PINGPONG\'');

  // Verify popup updates
  const popupResult = await page.evaluate(() => {
    const sm = window.sceneManager;
    sm.createPopup('testPopup', 'Initial Title', { text: 'Initial Text' });
    sm.setPopupTitle('testPopup', 'New Title');
    sm.setPopupText('testPopup', 'New Text');
    sm.setPopupImage('testPopup', 'https://cdn.digitaleducationsafety.org/assets/icons/gamepad-2.svg');

    const panel = sm.uiManager.controls['testPopup'].children[0];
    const title = panel.getChildByName('testPopup_title').text;
    const text = panel.getChildByName('testPopup_text').text;
    const image = panel.getChildByName('testPopup_image').source;

    return { title, text, image: !!image };
  });
  expect(popupResult.title).toBe('New Title');
  expect(popupResult.text).toBe('New Text');
  expect(popupResult.image).toBe(true);
});
