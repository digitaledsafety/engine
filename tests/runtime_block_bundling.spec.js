const { test, expect } = require('@playwright/test');

test.describe('Runtime Block Bundling Architecture (Option 1)', () => {
    test('EngineRuntime registers bundled blocks for Babylon and Canvas2D runtimes', async ({ page }) => {
        await page.goto('about:blank');

        await page.evaluate(() => {
            // Mock Blockly environment
            window.Blockly = {
                Blocks: {}
            };
            window.javascriptGenerator = {
                forBlock: {},
                ORDER_ATOMIC: 0
            };
        });

        // Load runtime scripts
        await page.addScriptTag({ path: './assets/js/runtime-base.js' });
        await page.addScriptTag({ path: './assets/js/babylon-runtime.js' });
        await page.addScriptTag({ path: './assets/js/runtime-canvas2d.js' });

        const testResult = await page.evaluate(() => {
            const registeredRuntimes = [];
            if (window.EngineRuntime.getRegistered('babylon')) registeredRuntimes.push('babylon');
            if (window.EngineRuntime.getRegistered('canvas2d')) registeredRuntimes.push('canvas2d');

            // Register blocks across all runtimes
            window.EngineRuntime.registerAllBlocks(window.Blockly, window.javascriptGenerator);

            const babylonBlockExists = !!window.Blockly.Blocks['babylon_set_background_color'];
            const babylonGenExists = !!window.javascriptGenerator.forBlock['babylon_set_background_color'];
            const canvasRectBlockExists = !!window.Blockly.Blocks['canvas2d_draw_rect'];
            const canvasClearBlockExists = !!window.Blockly.Blocks['canvas2d_clear'];
            const canvasGenExists = !!window.javascriptGenerator.forBlock['canvas2d_draw_rect'];

            return {
                registeredRuntimes,
                babylonBlockExists,
                babylonGenExists,
                canvasRectBlockExists,
                canvasClearBlockExists,
                canvasGenExists
            };
        });

        expect(testResult.registeredRuntimes).toContain('babylon');
        expect(testResult.registeredRuntimes).toContain('canvas2d');
        expect(testResult.babylonBlockExists).toBe(true);
        expect(testResult.babylonGenExists).toBe(true);
        expect(testResult.canvasRectBlockExists).toBe(true);
        expect(testResult.canvasClearBlockExists).toBe(true);
        expect(testResult.canvasGenExists).toBe(true);
    });

    test('Canvas2DRuntimeEngine initializes canvas and executes draw commands', async ({ page }) => {
        await page.setContent('<canvas id="testCanvas" width="400" height="300"></canvas>');

        await page.addScriptTag({ path: './assets/js/runtime-base.js' });
        await page.addScriptTag({ path: './assets/js/runtime-canvas2d.js' });

        const drawResult = await page.evaluate(async () => {
            const canvasElement = document.getElementById('testCanvas');
            const runtime = window.EngineRuntime.createRuntime('canvas2d', canvasElement);
            await runtime.init();

            runtime.drawRect(10, 20, 50, 60, '#00FF00');

            return {
                isInitialized: runtime.isInitialized,
                activeRuntimeName: window.sceneManager.constructor.name,
                drawCommandCount: runtime.drawCommands.length,
                lastCommand: runtime.drawCommands[0]
            };
        });

        expect(drawResult.isInitialized).toBe(true);
        expect(drawResult.activeRuntimeName).toBe('Canvas2DRuntimeEngine');
        expect(drawResult.drawCommandCount).toBe(1);
        expect(drawResult.lastCommand).toEqual({
            type: 'rect',
            x: 10,
            y: 20,
            width: 50,
            height: 60,
            color: '#00FF00'
        });
    });
});
