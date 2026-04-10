const { test, expect } = require('@playwright/test');

test('Dump Flyout DOM', async ({ page }) => {
  await page.goto('http://localhost:4000/engine/');

  const startButton = page.locator('#start-button');
  if (await startButton.isVisible()) {
    await startButton.click();
  }

  await page.waitForFunction(() => typeof Blockly !== 'undefined' && Blockly.getMainWorkspace());
  await page.waitForTimeout(2000);

  // Click on 'Objects' category
  await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('.blocklyTreeLabel'));
      const objects = labels.find(el => el.innerText === 'Objects');
      if (objects) objects.click();
  });
  await page.waitForTimeout(2000);

  const domInfo = await page.evaluate(() => {
    const flyout = document.querySelector('.blocklyFlyout');
    if (!flyout) return 'No flyout found';

    return {
        tagName: flyout.tagName,
        className: flyout.className.baseVal || flyout.className,
        parentElement: {
            tagName: flyout.parentElement.tagName,
            className: flyout.parentElement.className.baseVal || flyout.parentElement.className,
            parentElement: {
                tagName: flyout.parentElement.parentElement.tagName,
                className: flyout.parentElement.parentElement.className.baseVal || flyout.parentElement.parentElement.className,
            }
        },
        rect: flyout.getBoundingClientRect()
    };
  });

  console.log('Flyout Info:', JSON.stringify(domInfo, null, 2));
  await page.screenshot({ path: '/home/jules/verification/screenshots/dom_dump.png' });
});
