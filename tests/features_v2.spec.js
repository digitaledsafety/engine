const { test, expect } = require('@playwright/test');

test.describe('Engine Features V2', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:4000/');
        // Wait for Blockly and Babylon to initialize
        await page.waitForFunction(() => window.sceneManager && window.Blockly);
    });

    test('should create cone and torus primitives', async ({ page }) => {
        await page.evaluate(async () => {
            const sm = window.sceneManager;
            sm.createCone('myCone', 0, 0, 0);
            sm.createTorus('myTorus', 2, 0, 0);
        });

        const objectsCount = await page.evaluate(() => {
            return Object.keys(window.sceneManager.objects).length;
        });
        expect(objectsCount).toBeGreaterThanOrEqual(2);

        const primitivesExist = await page.evaluate(() => {
            const cone = window.sceneManager.objects['myCone'];
            const torus = window.sceneManager.objects['myTorus'];
            return !!cone && !!torus;
        });
        expect(primitivesExist).toBe(true);
    });

    test('should enable physics with friction and restitution', async ({ page }) => {
        await page.evaluate(async () => {
            const sm = window.sceneManager;
            sm.createBox('physBox', 0, 5, 0);
            sm.enablePhysics('physBox', 1, 0.5, 0.1, 'BoxImpostor');
        });

        const physicsValid = await page.evaluate(() => {
            const box = window.sceneManager.objects['physBox'];
            const impostor = box.physicsImpostor;
            return impostor.getParam('mass') === 1 &&
                   impostor.getParam('friction') === 0.5 &&
                   impostor.getParam('restitution') === 0.1;
        });
        expect(physicsValid).toBe(true);
    });

    test('should use refactored popup methods', async ({ page }) => {
        const popupText = await page.evaluate(async () => {
            const sm = window.sceneManager;
            // Create a mock popup structure since we don't want to rely on full UI init for this unit-like test
            const mockPopup = {
                name: 'testPopup',
                children: [{
                    getChildByName: (name) => {
                        if (name === 'testPopup_title') return { text: '' };
                        if (name === 'testPopup_text') return { text: '' };
                        return null;
                    }
                }]
            };
            // Manually inject into uiManager mock or similar if needed,
            // but let's try to use the real one if possible or just check if the methods exist and don't crash.

            // Testing that _getPopupPanel exists and works if called with correct structure
            const panelInfo = sm._getPopupPanel(mockPopup);
            return panelInfo && panelInfo.name === 'testPopup';
        });
        expect(popupText).toBe(true);
    });
});
