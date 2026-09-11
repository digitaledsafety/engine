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

    test('should clean up duplicate loading screens and remove from DOM when hidden', async ({ page }) => {
        const result = await page.evaluate(() => {
            const loader1 = new window.CustomLoadingScreen("Loading 1");
            loader1.displayLoadingUI();
            const countAfterFirst = document.querySelectorAll('#customLoadingScreen').length;

            const loader2 = new window.CustomLoadingScreen("Loading 2");
            loader2.displayLoadingUI();
            const countAfterSecond = document.querySelectorAll('#customLoadingScreen').length;

            loader2.hideLoadingUI();
            const countAfterHide = document.querySelectorAll('#customLoadingScreen').length;

            return { countAfterFirst, countAfterSecond, countAfterHide };
        });

        expect(result.countAfterFirst).toBe(1);
        expect(result.countAfterSecond).toBe(1);
        expect(result.countAfterHide).toBe(0);
    });

    test('should support setting camera inertia and wheel precision via methods and blocks', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const sm = window.sceneManager;
            sm.setCameraInertia(0.8);
            sm.setCameraWheelPrecision(25);

            const directInertia = sm.scene.activeCamera.inertia;
            const directPrecision = sm.scene.activeCamera.wheelPrecision;

            // Test via generated code from blocks
            const ws = window.Blockly.getMainWorkspace();
            const inertiaBlock = ws.newBlock('set_camera_inertia');
            const numBlock1 = ws.newBlock('math_number');
            numBlock1.setFieldValue(0.4, 'NUM');
            inertiaBlock.getInput('INERTIA').connection.connect(numBlock1.outputConnection);

            const precisionBlock = ws.newBlock('set_camera_wheel_precision');
            const numBlock2 = ws.newBlock('math_number');
            numBlock2.setFieldValue(12, 'NUM');
            precisionBlock.getInput('PRECISION').connection.connect(numBlock2.outputConnection);

            const codeInertia = window.javascript.javascriptGenerator.blockToCode(inertiaBlock);
            const codePrecision = window.javascript.javascriptGenerator.blockToCode(precisionBlock);

            eval(codeInertia);
            eval(codePrecision);

            const blockInertia = sm.scene.activeCamera.inertia;
            const blockPrecision = sm.scene.activeCamera.wheelPrecision;

            inertiaBlock.dispose();
            precisionBlock.dispose();

            return {
                directInertia,
                directPrecision,
                blockInertia,
                blockPrecision,
                codeInertia: codeInertia.trim(),
                codePrecision: codePrecision.trim()
            };
        });

        expect(result.directInertia).toBe(0.8);
        expect(result.directPrecision).toBe(25);
        expect(result.blockInertia).toBe(0.4);
        expect(result.blockPrecision).toBe(12);
        expect(result.codeInertia).toBe('sceneManager.setCameraInertia(0.4);');
        expect(result.codePrecision).toBe('sceneManager.setCameraWheelPrecision(12);');
    });
});
