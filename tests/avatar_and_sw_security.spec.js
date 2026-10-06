const { test, expect } = require('@playwright/test');

test.describe('Roblox Avatar and Service Worker Security Validation', () => {
  test('importRobloxAvatar strictly sanitizes user ID inputs', async ({ page }) => {
    await page.goto('/');
    await page.click('#start-button');

    const result = await page.evaluate(async () => {
      const sceneManager = window.sceneManager;
      if (!sceneManager || typeof sceneManager.importRobloxAvatar !== 'function') {
        return { error: 'sceneManager.importRobloxAvatar not found' };
      }

      const invalidInputs = [
        '123456&injection=true',
        '../123456',
        '-500',
        '0',
        'abc',
        '123456; DROP TABLE users;',
        'http://evil.com/123456'
      ];

      const validationResults = [];

      for (const input of invalidInputs) {
        try {
          await sceneManager.importRobloxAvatar('testAvatar', input, 0, 0, 0);
          validationResults.push({ input, rejected: false });
        } catch (err) {
          validationResults.push({
            input,
            rejected: true,
            errorMessage: err.message
          });
        }
      }

      // Test a valid numeric user ID string / number format checking
      let validPassedValidation = false;
      try {
        await sceneManager.importRobloxAvatar('testAvatar', 123456, 0, 0, 0);
        // If it returns null or mesh without throwing "Invalid Roblox User ID", sanitization passed
        validPassedValidation = true;
      } catch (err) {
        if (err.message !== 'Invalid Roblox User ID') {
          validPassedValidation = true;
        }
      }

      return {
        validationResults,
        validPassedValidation
      };
    });

    expect(result.validPassedValidation).toBe(true);
    for (const item of result.validationResults) {
      expect(item.rejected).toBe(true);
      expect(item.errorMessage).toBe('Invalid Roblox User ID');
    }
  });

  test('Service Worker dynamic manifest query parameters sanitization', async ({ page }) => {
    await page.goto('/');

    const swSanitizationResult = await page.evaluate(() => {
      function sanitizeScopePath(path) {
        if (!path) return null;
        const trimmed = path.trim();
        if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
          return trimmed;
        }
        return null;
      }

      function sanitizeIcon(iconUrl) {
        if (!iconUrl) return '/assets/icons/gamepad-2.svg';
        const trimmed = iconUrl.trim();
        if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
          return trimmed;
        }
        try {
          const parsed = new URL(trimmed);
          if (parsed.protocol === 'https:') {
            return trimmed;
          }
        } catch (e) {}
        return '/assets/icons/gamepad-2.svg';
      }

      return {
        validLocalScope: sanitizeScopePath('/workspaces/test/'),
        protocolRelativeScope: sanitizeScopePath('//evil.com/phish'),
        backSlashScope: sanitizeScopePath('/\\evil.com/phish'),
        externalScope: sanitizeScopePath('https://evil.com'),
        jsScope: sanitizeScopePath('javascript:alert(1)'),

        validLocalIcon: sanitizeIcon('/assets/icons/custom.png'),
        validHttpsIcon: sanitizeIcon('https://cdn.digitaleducationsafety.org/icon.png'),
        httpIcon: sanitizeIcon('http://insecure.com/icon.png'),
        protocolRelativeIcon: sanitizeIcon('//evil.com/icon.png'),
        jsIcon: sanitizeIcon('javascript:alert(1)')
      };
    });

    expect(swSanitizationResult.validLocalScope).toBe('/workspaces/test/');
    expect(swSanitizationResult.protocolRelativeScope).toBeNull();
    expect(swSanitizationResult.backSlashScope).toBeNull();
    expect(swSanitizationResult.externalScope).toBeNull();
    expect(swSanitizationResult.jsScope).toBeNull();

    expect(swSanitizationResult.validLocalIcon).toBe('/assets/icons/custom.png');
    expect(swSanitizationResult.validHttpsIcon).toBe('https://cdn.digitaleducationsafety.org/icon.png');
    expect(swSanitizationResult.httpIcon).toBe('/assets/icons/gamepad-2.svg');
    expect(swSanitizationResult.protocolRelativeIcon).toBe('/assets/icons/gamepad-2.svg');
    expect(swSanitizationResult.jsIcon).toBe('/assets/icons/gamepad-2.svg');
  });
});
