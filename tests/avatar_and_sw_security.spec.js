const { test, expect } = require('@playwright/test');

test.describe('Avatar and Service Worker Security Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    await page.click('#preview-tab');
  });

  test('importRobloxAvatar rejects non-positive-integer user IDs', async ({ page }) => {
    const maliciousInputs = [
      '../escape',
      '123&action=steal',
      'javascript:alert(1)',
      '-5',
      '0',
      'abc',
      '12.34',
      ' ',
      null,
      undefined
    ];

    for (const input of maliciousInputs) {
      const errorMsg = await page.evaluate(async (userId) => {
        try {
          await window.sceneManager.importRobloxAvatar('testAvatar', userId, 0, 0, 0);
          return null;
        } catch (e) {
          return e.message;
        }
      }, input);

      expect(errorMsg).not.toBeNull();
      expect(errorMsg).toContain('Invalid Roblox user ID');
    }
  });

  test('Service Worker dynamic manifest sanitizes malicious scope and icon parameters', async ({ page }) => {
    // Register a test service worker with malicious params directly in the browser context
    const manifest = await page.evaluate(async () => {
      // Unregister any existing test service workers under /tests/
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (reg.scope.includes('/workspaces/test-security/')) {
          await reg.unregister();
        }
      }

      // Register sw.js with malicious parameters under a distinct test scope
      const evilParams = new URLSearchParams({
        title: 'SecurityTest',
        desc: 'Testing SW sanitization',
        icon: 'javascript:alert(1)',
        scope: '//evil.com/phish/'
      });

      const reg = await navigator.serviceWorker.register(
        `/sw.js?${evilParams.toString()}`,
        { scope: '/workspaces/test-security/' }
      );

      // Wait until the service worker is active
      const sw = reg.installing || reg.waiting || reg.active;
      if (sw.state !== 'activated') {
        await new Promise((resolve) => {
          sw.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') {
              resolve();
            }
          });
        });
      }

      // Fetch manifest.json intercepted by the service worker under the test scope
      const res = await fetch('/workspaces/test-security/manifest.json');
      const data = await res.json();

      // Clean up after test
      await reg.unregister();

      return data;
    });

    // Verify sanitized outputs:
    // 1. scope='//evil.com/phish/' was rejected, falling back to root start_url
    expect(manifest.start_url).toBe('/?mode=app&fullscreen=true');
    // 2. icon='javascript:alert(1)' was rejected, falling back to default gamepad svg icon
    expect(manifest.icons[0].src).toBe('/assets/icons/gamepad-2.svg');
  });
});
