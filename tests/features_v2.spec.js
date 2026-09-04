const { test, expect } = require('@playwright/test');

test.describe('Engine Features V2', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
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

            const panelInfo = sm._getPopupPanel(mockPopup);
            return panelInfo && panelInfo.name === 'testPopup';
        });
        expect(popupText).toBe(true);
    });

    test('should resolve impostor types via _resolveImpostorType and support full & short names', async ({ page }) => {
        const result = await page.evaluate(() => {
            const sm = window.sceneManager;
            const resShort = sm._resolveImpostorType('SphereImpostor');
            const resFull = sm._resolveImpostorType('BABYLON.PhysicsImpostor.SphereImpostor');
            const resPlane = sm._resolveImpostorType('PlaneImpostor');
            return {
                resShort,
                resFull,
                resPlane,
                isSphere: resShort === BABYLON.PhysicsImpostor.SphereImpostor && resFull === BABYLON.PhysicsImpostor.SphereImpostor,
                isPlane: resPlane === BABYLON.PhysicsImpostor.PlaneImpostor
            };
        });
        expect(result.isSphere).toBe(true);
        expect(result.isPlane).toBe(true);
    });

    test('should play note across expanded C3-C5 frequency range in play_note block', async ({ page }) => {
        const hasNotes = await page.evaluate(() => {
            const block = window.Blockly.Blocks['play_note'];
            if (!block) return false;
            // Get dropdown options from the block definition dummy or init
            const dummyBlock = window.Blockly.getMainWorkspace().newBlock('play_note');
            const field = dummyBlock.getField('NOTE');
            const options = field.getOptions().map(opt => opt[1]);
            dummyBlock.dispose();
            return options.includes('130.81') && options.includes('523.25') && options.includes('261.63');
        });
        expect(hasNotes).toBe(true);
    });
});
