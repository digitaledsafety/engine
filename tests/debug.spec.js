const { test, expect } = require('@playwright/test');

test('debug dom', async ({ page }) => {
  await page.goto('/');
  const html = await page.content();
  console.log('HTML Length:', html.length);
  const hero = await page.evaluate(() => document.getElementById('hero-overlay') ? 'FOUND' : 'MISSING');
  console.log('Hero Overlay:', hero);
  const bodyChildren = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
  console.log('Body start:', bodyChildren);
});
