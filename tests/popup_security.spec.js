const { test, expect } = require('@playwright/test');

test.describe('Popup Image URL Security Validation', () => {
  test('createPopup and setPopupImage validate URLs correctly', async ({ page }) => {
    await page.goto('/');
    await page.click("#start-button");

    const result = await page.evaluate(async () => {
        const uiManager = window.sceneManager.uiManager;

        // 1. Create a popup with an insecure HTTP image URL
        uiManager.createPopup('insecurePopup', 'Insecure Title', {
            image: 'http://example.com/malicious.png',
            text: 'Test Text'
        });

        // Verify that the image control was NOT added because of the invalid URL
        const insecurePopup = uiManager.getControlByName('insecurePopup');
        const insecurePanel = insecurePopup.children[0];
        const insecureImage = insecurePanel.children.find(c => c.name === 'insecurePopup_image');

        // 2. Create a popup with a secure HTTPS image URL
        uiManager.createPopup('securePopup', 'Secure Title', {
            image: 'https://example.com/safe.png',
            text: 'Test Text'
        });

        const securePopup = uiManager.getControlByName('securePopup');
        const securePanel = securePopup.children[0];
        const secureImage = securePanel.children.find(c => c.name === 'securePopup_image');

        // 3. Test setPopupImage with an insecure URL on the securePopup
        // Wait, secureImage has an initial source of proxy'd safe.png
        const initialSource = secureImage ? secureImage.source : '';
        window.sceneManager.setPopupImage('securePopup', 'http://example.com/another-malicious.png');
        const sourceAfterInsecureSet = secureImage ? secureImage.source : '';

        // 4. Test setPopupImage with a secure HTTPS URL
        window.sceneManager.setPopupImage('securePopup', 'https://example.com/another-safe.png');
        const sourceAfterSecureSet = secureImage ? secureImage.source : '';

        return {
            insecureImageExists: !!insecureImage,
            secureImageExists: !!secureImage,
            initialSource: initialSource,
            sourceAfterInsecureSet: sourceAfterInsecureSet,
            sourceAfterSecureSet: sourceAfterSecureSet
        };
    });

    expect(result.insecureImageExists).toBe(false);
    expect(result.secureImageExists).toBe(true);
    expect(result.initialSource).toContain('proxy.functions.io');
    expect(result.initialSource).toContain('safe.png');
    expect(result.sourceAfterInsecureSet).toBe(result.initialSource); // Should not have changed
    expect(result.sourceAfterSecureSet).toContain('proxy.functions.io');
    expect(result.sourceAfterSecureSet).toContain('another-safe.png');
  });
});
