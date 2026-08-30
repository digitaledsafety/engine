const { test, expect } = require('@playwright/test');

test.describe('Engine Features V2', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
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

    test('should enable physics with friction and restitution and handle qualified impostor types', async ({ page }) => {
        await page.evaluate(async () => {
            const sm = window.sceneManager;
            sm.createBox('physBox', 0, 5, 0);
            sm.enablePhysics('physBox', 1, 0.5, 0.1, 'BoxImpostor');

            sm.createBox('physBox2', 1, 5, 0);
            sm.enablePhysics('physBox2', 1, 0.5, 0.1, 'BABYLON.PhysicsImpostor.BoxImpostor');
        });

        const physicsValid = await page.evaluate(() => {
            const box1 = window.sceneManager.objects['physBox'];
            const impostor1 = box1.physicsImpostor;

            const box2 = window.sceneManager.objects['physBox2'];
            const impostor2 = box2.physicsImpostor;

            return impostor1.getParam('mass') === 1 &&
                   impostor1.getParam('friction') === 0.5 &&
                   impostor1.getParam('restitution') === 0.1 &&
                   !!impostor2;
        });
        expect(physicsValid).toBe(true);
    });

    test('play_note block should support C3 to C6 dropdown values', async ({ page }) => {
        const noteValues = await page.evaluate(() => {
            const workspace = window.workspace;
            const block = workspace.newBlock('play_note');
            const dropdown = block.getField('NOTE');
            const options = dropdown.getOptions().map(opt => opt[1]);
            block.dispose();
            return options;
        });

        expect(noteValues).toContain('130.81'); // C3
        expect(noteValues).toContain('261.63'); // C4
        expect(noteValues).toContain('523.25'); // C5
        expect(noteValues).toContain('1046.50'); // C6
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
