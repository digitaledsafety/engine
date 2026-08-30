const { test, expect } = require('@playwright/test');

test.describe('Roblox Avatar and SW Manifest Security Validation', () => {
  test('importRobloxAvatar rejects insecure user IDs and processes valid ones', async ({ page }) => {
    await page.goto('/');
    // Handle the hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Wait for sceneManager to be initialized
    await page.waitForFunction(() => window.sceneManager);

    // Track console error messages to verify rejection logs
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const result = await page.evaluate(async () => {
      const sm = window.sceneManager;

      // 1. Valid numeric user ID
      // We don't want to actually perform the full network request or throw network failures in tests,
      // so we can mock/stub the fetch function during this specific call, or catch the expected network error.
      // Since a valid ID gets past the sanity check and attempts a fetch, it should fail on network or throw,
      // but not trigger the "Invalid Roblox User ID" console error.
      let validPassedCheck = false;
      const originalFetch = window.fetch;
      window.fetch = async (url) => {
        // Since url gets encoded via getProxiedUrl, check for either encoded or decoded userId
        if (url.includes('userId%3D12345') || url.includes('userId=12345')) {
          validPassedCheck = true;
          // Return a dummy empty response to stop the execution cleanly
          return { ok: false, status: 404 };
        }
        return originalFetch(url);
      };

      try {
        await sm.importRobloxAvatar('testAvatar1', '12345');
      } catch (e) {
        // network fetch or other parts might fail, which is fine
      }
      window.fetch = originalFetch;

      // 2. Malicious user ID: non-numeric string
      const resInsecure1 = await sm.importRobloxAvatar('testAvatar2', 'http://tracking-pixel.com/attack');

      // 3. Malicious user ID: path traversal
      const resInsecure2 = await sm.importRobloxAvatar('testAvatar3', '../12345');

      // 4. Malicious user ID: query parameter injection
      const resInsecure3 = await sm.importRobloxAvatar('testAvatar4', '12345&evilParam=true');

      return {
        validPassedCheck,
        resInsecure1,
        resInsecure2,
        resInsecure3
      };
    });

    // Assertions
    expect(result.validPassedCheck).toBe(true);
    expect(result.resInsecure1).toBeNull();
    expect(result.resInsecure2).toBeNull();
    expect(result.resInsecure3).toBeNull();

    // Verify console error logs for each malicious user ID
    expect(consoleErrors.some(err => err.includes('Invalid Roblox User ID: http://tracking-pixel.com/attack'))).toBe(true);
    expect(consoleErrors.some(err => err.includes('Invalid Roblox User ID: ../12345'))).toBe(true);
    expect(consoleErrors.some(err => err.includes('Invalid Roblox User ID: 12345&evilParam=true'))).toBe(true);
  });

  test('Service Worker dynamic manifest sanitizes insecure icon and redirect scope', async ({ page }) => {
    // Navigate to local workspaces page (or root) to trigger SW registration
    await page.goto('/');

    // Register and wait for activation
    await page.evaluate(async () => {
      // Unregister any existing service worker to ensure a clean state
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
      }

      // Register the service worker at root scope with a malicious scope path and insecure icon
      const swUrl = '/sw.js?title=SecurityPWA&desc=Test&icon=http://insecure-host.com/evil.png&scope=https://evil.com/redirect/';
      const scope = '/';

      await navigator.serviceWorker.register(swUrl, { scope });

      // Wait for service worker to activate
      let activeReg = null;
      for (let i = 0; i < 20; i++) {
        const regs = await navigator.serviceWorker.getRegistrations();
        const found = regs.find(r => r.scope.endsWith('/'));
        if (found && found.active) {
          activeReg = found;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      if (!activeReg) {
        throw new Error('Service Worker failed to activate within timeout');
      }
    });

    // 4. Reload the page to ensure the document is fully loaded under the service worker controller
    await page.reload();

    const manifest = await page.evaluate(async () => {
      const response = await fetch('/manifest.json');
      return await response.json();
    });

    // Verify the insecure icon URL got sanitized to default gamepad icon
    expect(manifest.name).toBe('SecurityPWA');
    expect(manifest.icons[0].src).toBe('/assets/icons/gamepad-2.svg');

    // Verify that scope redirect was sanitized (should be '/' because evil.com starts with absolute scheme)
    // Since 'https://evil.com/redirect/' was invalid, safeScopePath becomes '/'
    // startUrl = safeScopePath + '?mode=app&fullscreen=true' => '/?mode=app&fullscreen=true'
    expect(manifest.start_url).toBe('/?mode=app&fullscreen=true');
  });
});
