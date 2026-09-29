const { test, expect } = require('@playwright/test');

test.describe('Webcam Object Recognition Verification', () => {

    test('event_on_object_detected block definition and generator in workspace', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const blockExists = await page.evaluate(() => {
            return typeof Blockly.Blocks['event_on_object_detected'] === 'object' &&
                   typeof javascript.javascriptGenerator.forBlock['event_on_object_detected'] === 'function';
        });
        expect(blockExists).toBe(true);

        // Verify generated JS code
        const generatedCode = await page.evaluate(() => {
            const workspace = Blockly.getMainWorkspace();
            const block = workspace.newBlock('event_on_object_detected');
            block.setFieldValue('person', 'OBJECT');
            const code = javascript.javascriptGenerator.forBlock['event_on_object_detected'](block, javascript.javascriptGenerator);
            block.dispose();
            return code;
        });

        expect(generatedCode).toContain("sceneManager.onObjectDetected('person'");
    });

    test('startObjectRecognition initializes camera preview and handles predictions', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        // Mock getUserMedia
        await page.evaluate(() => {
            if (!navigator.mediaDevices) navigator.mediaDevices = {};
            navigator.mediaDevices.getUserMedia = async () => {
                const canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 240;
                return canvas.captureStream ? canvas.captureStream(30) : new MediaStream();
            };
        });

        // Trigger onObjectDetected
        const state = await page.evaluate(async () => {
            let callbackFired = false;
            let detectedClass = '';

            window.sceneManager.onObjectDetected('person', (cls, score) => {
                callbackFired = true;
                detectedClass = cls;
            });

            const previewExists = !!document.getElementById('webcam-preview-container');
            const videoExists = !!document.getElementById('webcam-preview-video');

            // Simulate prediction processing
            window.sceneManager._processPredictions([
                { class: 'person', score: 0.95 }
            ]);

            const firedFirstTime = callbackFired;
            callbackFired = false;

            // Immediate second prediction should be throttled by cooldown
            window.sceneManager._processPredictions([
                { class: 'person', score: 0.95 }
            ]);
            const firedSecondTime = callbackFired;

            // Stop recognition and verify cleanup
            window.sceneManager.stopObjectRecognition();
            const previewRemoved = !document.getElementById('webcam-preview-container');

            return {
                previewExists,
                videoExists,
                firedFirstTime,
                detectedClass,
                firedSecondTime,
                previewRemoved
            };
        });

        expect(state.previewExists).toBe(true);
        expect(state.videoExists).toBe(true);
        expect(state.firedFirstTime).toBe(true);
        expect(state.detectedClass).toBe('person');
        expect(state.firedSecondTime).toBe(false);
        expect(state.previewRemoved).toBe(true);
    });

    test('digital-cohost workspace loads with event_on_object_detected block', async ({ page }) => {
        await page.goto('/workspaces/digital-cohost/', { waitUntil: 'domcontentloaded' });

        const workspaceHasBlock = await page.evaluate(() => {
            const workspace = Blockly.getMainWorkspace();
            if (!workspace) return false;
            const blocks = workspace.getAllBlocks(false);
            return blocks.some(b => b.type === 'event_on_object_detected');
        });

        expect(workspaceHasBlock).toBe(true);
    });

});
