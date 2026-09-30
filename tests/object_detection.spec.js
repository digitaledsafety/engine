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
            const canvasExists = !!document.getElementById('webcam-preview-canvas');

            // Simulate prediction processing with bounding box
            window.sceneManager._processPredictions([
                { class: 'person', score: 0.95, bbox: [20, 30, 100, 80] }
            ]);

            const canvasElement = document.getElementById('webcam-preview-canvas');
            const canvasHasDimensions = canvasElement && canvasElement.width > 0 && canvasElement.height > 0;

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
                canvasExists,
                canvasHasDimensions,
                firedFirstTime,
                detectedClass,
                firedSecondTime,
                previewRemoved
            };
        });

        expect(state.previewExists).toBe(true);
        expect(state.videoExists).toBe(true);
        expect(state.canvasExists).toBe(true);
        expect(state.canvasHasDimensions).toBe(true);
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

    test('loadObjectRecognitionDependencies uses ESM imports without injecting script elements into DOM', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const scriptCountBefore = await page.evaluate(() => document.querySelectorAll('script').length);

        await page.evaluate(async () => {
            try {
                await window.sceneManager.loadObjectRecognitionDependencies();
            } catch (e) {
                // Catch any network errors in offline test runner environments
            }
        });

        const scriptCountAfter = await page.evaluate(() => document.querySelectorAll('script').length);
        expect(scriptCountAfter).toBe(scriptCountBefore);
    });

    test('object detection listeners and logic are cleared and rebuilt on workspace re-run (doRun)', async ({ page }) => {
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

        // Run 1: Code with event_on_object_detected logic
        const run1State = await page.evaluate(async () => {
            window.testObjectDetectedCount = 0;
            const code = `
                sceneManager.onObjectDetected('cup', () => {
                    window.testObjectDetectedCount++;
                });
            `;
            await window.doRun(code);

            // Simulate prediction
            window.sceneManager._processPredictions([
                { class: 'cup', score: 0.9, bbox: [10, 10, 50, 50] }
            ]);

            return {
                listenersCount: window.sceneManager.objectRecognition.listeners.length,
                detectedCount: window.testObjectDetectedCount
            };
        });

        expect(run1State.listenersCount).toBe(1);
        expect(run1State.detectedCount).toBe(1);

        // Run 2: Re-run doRun without object detected logic (simulating user deleting the block)
        const run2State = await page.evaluate(async () => {
            const emptyCode = `// Object detected block deleted`;
            await window.doRun(emptyCode);

            // Verify active status and listeners on new sceneManager
            const activeStatus = window.sceneManager.objectRecognition.active;
            const listenersCount = window.sceneManager.objectRecognition.listeners.length;

            // Attempt to trigger prediction
            window.sceneManager._processPredictions([
                { class: 'cup', score: 0.9, bbox: [10, 10, 50, 50] }
            ]);

            return {
                activeStatus,
                listenersCount,
                detectedCount: window.testObjectDetectedCount
            };
        });

        expect(run2State.activeStatus).toBe(false);
        expect(run2State.listenersCount).toBe(0);
        // Count should still be 1 from run 1 and NOT increment to 2
        expect(run2State.detectedCount).toBe(1);
    });

});
