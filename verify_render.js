const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  try {
    await page.goto('http://127.0.0.1:4000');
    await page.waitForTimeout(2000);
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    await browser.close();
  }
})();
