const { test, expect } = require('@playwright/test');

test.describe('Scene and Camera Features', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => window.sceneManager && window.Blockly);
    });

    test('setCameraProperty updates camera parameters safely', async ({ page }) => {
        const result = await page.evaluate(() => {
            const sm = window.sceneManager;
            if (!sm.scene || !sm.scene.activeCamera) return null;

            sm.setCameraProperty('inertia', 0.5);
            sm.setCameraProperty('wheelPrecision', 20);
            sm.setCameraProperty('speed', 2);
            sm.setCameraProperty('fov', 0.9);

            const cam = sm.scene.activeCamera;
            return {
                inertia: cam.inertia,
                wheelPrecision: cam.wheelPrecision,
                speed: cam.speed,
                fov: cam.fov
            };
        });

        expect(result).not.toBeNull();
        expect(result.inertia).toBe(0.5);
        expect(result.wheelPrecision).toBe(20);
        expect(result.speed).toBe(2);
        expect(result.fov).toBe(0.9);
    });

    test('getDistance calculates distance between objects correctly', async ({ page }) => {
        const distance = await page.evaluate(() => {
            const sm = window.sceneManager;
            sm.createBox('boxA', 0, 0, 0);
            sm.createBox('boxB', 3, 4, 0);

            return sm.getDistance('boxA', 'boxB');
        });

        // Distance from (0,0,0) to (3,4,0) is sqrt(3^2 + 4^2) = 5
        expect(distance).toBeCloseTo(5, 4);
    });

    test('setSkyboxUrl validates asset URL and sets skybox background', async ({ page }) => {
        const validRes = await page.evaluate(() => {
            const sm = window.sceneManager;
            sm.setSkyboxUrl('https://example.com/textures/skybox.jpg');
            return sm.background && sm.background.name === 'customSkyBox';
        });

        expect(validRes).toBe(true);

        const invalidRes = await page.evaluate(() => {
            const sm = window.sceneManager;
            const bgBefore = sm.background;
            // Attempt unsafe protocol
            sm.setSkyboxUrl('javascript:alert(1)');
            return sm.background === bgBefore;
        });

        expect(invalidRes).toBe(true);
    });

    test('setLightProperty updates light properties safely', async ({ page }) => {
        const result = await page.evaluate(() => {
            const sm = window.sceneManager;
            if (!sm.scene || !sm.scene.lights || sm.scene.lights.length === 0) return null;

            const light = sm.scene.lights[0];
            sm.setLightProperty(light.name, 'intensity', 2.5);

            return {
                intensity: light.intensity
            };
        });

        expect(result).not.toBeNull();
        expect(result.intensity).toBe(2.5);
    });

    test('Blockly block definitions and generators produce valid code for new scene/camera blocks', async ({ page }) => {
        const generatedCode = await page.evaluate(() => {
            const workspace = window.Blockly.getMainWorkspace();

            const camBlock = workspace.newBlock('set_camera_property');
            camBlock.setFieldValue('inertia', 'PROPERTY');

            const valBlock = workspace.newBlock('math_number');
            valBlock.setFieldValue('0.5', 'NUM');
            camBlock.getInput('VALUE').connection.connect(valBlock.outputConnection);

            const code1 = window.Blockly.JavaScript.blockToCode(camBlock);

            const distBlock = workspace.newBlock('get_distance_between');
            const code2Array = window.Blockly.JavaScript.blockToCode(distBlock);

            const skyBlock = workspace.newBlock('set_skybox_url');
            const code3 = window.Blockly.JavaScript.blockToCode(skyBlock);

            const lightBlock = workspace.newBlock('set_light_property');
            lightBlock.setFieldValue('intensity', 'PROPERTY');
            const code4 = window.Blockly.JavaScript.blockToCode(lightBlock);

            camBlock.dispose();
            valBlock.dispose();
            distBlock.dispose();
            skyBlock.dispose();
            lightBlock.dispose();

            return {
                code1,
                code2: Array.isArray(code2Array) ? code2Array[0] : code2Array,
                code3,
                code4
            };
        });

        expect(generatedCode.code1).toContain("sceneManager.setCameraProperty('inertia', 0.5)");
        expect(generatedCode.code2).toContain("sceneManager.getDistance");
        expect(generatedCode.code3).toContain("sceneManager.setSkyboxUrl");
        expect(generatedCode.code4).toContain("sceneManager.setLightProperty");
    });
});
