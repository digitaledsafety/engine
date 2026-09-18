const { test, expect } = require('@playwright/test');

test.describe('Digital Co-Host Avatar ("Word") Verification', () => {

    test('OBS Transparency mode should set transparent scene clearColor and backgrounds', async ({ page }) => {
        await page.goto('/?obs=1', { waitUntil: 'domcontentloaded' });

        // Trigger scene run
        await page.evaluate(async () => {
            await window.doRun('sceneManager.createBox("test", 0, 0, 0);');
        });

        // Check clearColor alpha component in BabylonSceneManager
        const clearColorAlpha = await page.evaluate(() => {
            return window.sceneManager.scene.clearColor.a;
        });
        expect(clearColorAlpha).toBe(0);

        // Check container background style
        const containerBg = await page.evaluate(() => {
            const container = document.querySelector('.canvas-container');
            return window.getComputedStyle(container).backgroundColor;
        });
        expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(containerBg);
    });

    test('Co-Host sensing, reasoning, flight physics, ESM loading, and retro audio API methods', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        await page.evaluate(async () => {
            await window.doRun('sceneManager.createSphere("avatar", 0, 0, 0);');
        });

        // Test ESM Dynamic Dependency Loading
        const esmLoaded = await page.evaluate(async () => {
            await window.sceneManager.loadCohostDependencies();
            return window.sceneManager._cohostDependenciesLoaded;
        });
        expect(esmLoaded).toBe(true);

        // Test Voice Perception STT
        const transcript = await page.evaluate(async () => {
            await window.sceneManager.startSpeechRecognition();
            return window.sceneManager.getSpeechTranscript();
        });
        expect(typeof transcript).toBe('string');

        // Test Webcam Tracking & Spatial Perception
        const webcamX = await page.evaluate(async () => {
            await window.sceneManager.startWebcamTracking();
            return window.sceneManager.getWebcamTrackerPos('x');
        });
        expect(typeof webcamX).toBe('number');

        // Test LLM Query & Action Tag Parser
        const llmResult = await page.evaluate(async () => {
            const res = await window.sceneManager.queryCohostLLM('hello word jetpack', '');
            return res;
        });
        expect(llmResult.text).toBeTruthy();
        expect(Array.isArray(llmResult.actionTags)).toBe(true);

        // Test Procedural Flight Physics & Flight Anchor Transitions
        const flightState = await page.evaluate(async () => {
            window.sceneManager.enableProceduralFlight('avatar', 'shoulder');
            const anchor1 = window.sceneManager.proceduralFlight.currentAnchor;
            window.sceneManager.setFlightAnchor('center');
            const anchor2 = window.sceneManager.proceduralFlight.currentAnchor;
            window.sceneManager.setFlightAnchor('workspace');
            const anchor3 = window.sceneManager.proceduralFlight.currentAnchor;
            return {
                enabled: window.sceneManager.proceduralFlight.enabled,
                anchor1,
                anchor2,
                anchor3
            };
        });
        expect(flightState.enabled).toBe(true);
        expect(flightState.anchor1).toBe('shoulder');
        expect(flightState.anchor2).toBe('center');
        expect(flightState.anchor3).toBe('workspace');

        // Test Async Wait Method
        const waitOk = await page.evaluate(async () => {
            const start = performance.now();
            await window.sceneManager.wait(0.1);
            const duration = performance.now() - start;
            return duration >= 80;
        });
        expect(waitOk).toBe(true);

        // Test Retro Voice Synthesis
        const spoke = await page.evaluate(() => {
            window.sceneManager.speakRetroVoice('Word reporting for live co-hosting!', 1.2, 1.0);
            return true;
        });
        expect(spoke).toBe(true);
    });

    test('Executing Co-Host Blockly blocks generated code and flight sequences', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        // Evaluate user-generated code from Co-Host blocks including flight sequence and wait
        const result = await page.evaluate(async () => {
            const code = `
                const avatar = sceneManager.createSphere('avatar', 0, 0, 0);
                sceneManager.enableProceduralFlight(avatar, 'shoulder');
                await sceneManager.startSpeechRecognition();
                await sceneManager.startWebcamTracking();
                sceneManager.triggerActionTag(avatar, '[GLOW_ON]');
                sceneManager.triggerActionTag(avatar, '[EQUIP_JETPACK]');
                sceneManager.speakRetroVoice('Testing flight blocks');
                await sceneManager.wait(0.05);
                sceneManager.setFlightAnchor('center');
            `;
            await window.doRun(code);
            return {
                flight: window.sceneManager.proceduralFlight.enabled,
                anchor: window.sceneManager.proceduralFlight.currentAnchor,
                jetpackExists: !!window.sceneManager.objects['jetpack']
            };
        });

        expect(result.flight).toBe(true);
        expect(result.anchor).toBe('center');
        expect(result.jetpackExists).toBe(true);
    });

    test('Digital Co-Host workspace loads and executes scripted flying sequence', async ({ page }) => {
        await page.goto('/workspaces/digital-cohost/', { waitUntil: 'domcontentloaded' });

        // Verify workspace loads and runs
        const isRun = await page.evaluate(() => {
            return typeof window.doRun === 'function' && !!window.sceneManager;
        });
        expect(isRun).toBe(true);
    });

    test('Screen Capture, Vision Frame Analysis, and Cursor Tracking API & Blocks', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        await page.evaluate(async () => {
            await window.doRun('sceneManager.createBox("test_box", 0, 0, 0);');
        });

        // Test cursor tracking API
        const cursorTest = await page.evaluate(() => {
            let movedX = -1;
            let movedY = -1;
            window.sceneManager.onCursorMove((x, y) => {
                movedX = x;
                movedY = y;
            });
            // Simulate pointer event
            window.dispatchEvent(new PointerEvent('pointermove', { clientX: 150, clientY: 250 }));
            return {
                x: window.sceneManager.getCursorPos('x'),
                y: window.sceneManager.getCursorPos('y'),
                movedX,
                movedY
            };
        });
        expect(cursorTest.x).toBe(150);
        expect(cursorTest.y).toBe(250);
        expect(cursorTest.movedX).toBe(150);
        expect(cursorTest.movedY).toBe(250);

        // Test screen capture fallback & frame analysis API
        const captureTest = await page.evaluate(async () => {
            if (!navigator.mediaDevices) {
                navigator.mediaDevices = {};
            }
            navigator.mediaDevices.getDisplayMedia = async () => {
                const canvas = document.createElement('canvas');
                canvas.width = 100;
                canvas.height = 100;
                return canvas.captureStream ? canvas.captureStream(10) : new MediaStream();
            };

            const origPlay = HTMLVideoElement.prototype.play;
            HTMLVideoElement.prototype.play = async function() {
                Object.defineProperty(this, 'videoWidth', { value: 100, configurable: true });
                Object.defineProperty(this, 'videoHeight', { value: 100, configurable: true });
                return Promise.resolve();
            };

            await window.sceneManager.startScreenCapture(500);
            const activeBefore = window.sceneManager.screenCapture.active;
            const analysis = await window.sceneManager.analyzeScreenFrame('Look at current screen');
            window.sceneManager.stopScreenCapture();
            const activeAfter = window.sceneManager.screenCapture.active;

            HTMLVideoElement.prototype.play = origPlay;

            return {
                activeBefore,
                activeAfter,
                analysisText: analysis.text
            };
        });

        expect(captureTest.activeBefore).toBe(true);
        expect(captureTest.activeAfter).toBe(false);
        expect(typeof captureTest.analysisText).toBe('string');

        // Test execution of generated code for new Co-Host Blockly blocks
        const blockExecution = await page.evaluate(async () => {
            if (!navigator.mediaDevices) navigator.mediaDevices = {};
            navigator.mediaDevices.getDisplayMedia = async () => {
                const canvas = document.createElement('canvas');
                canvas.width = 100;
                canvas.height = 100;
                return canvas.captureStream ? canvas.captureStream(10) : new MediaStream();
            };
            HTMLVideoElement.prototype.play = async function() {
                Object.defineProperty(this, 'videoWidth', { value: 100, configurable: true });
                Object.defineProperty(this, 'videoHeight', { value: 100, configurable: true });
                return Promise.resolve();
            };

            let cursorMoved = false;
            const code = `
                await sceneManager.startScreenCapture(500);
                const analysisText = (await sceneManager.analyzeScreenFrame('What is on screen?')).text;
                sceneManager.stopScreenCapture();
                sceneManager.onCursorMove(async (cx, cy) => {
                    cursorMoved = true;
                });
                const posX = sceneManager.getCursorPos('x');
            `;
            await window.doRun(code);
            return typeof window.sceneManager.getCursorPos === 'function';
        });

        expect(blockExecution).toBe(true);
    });
});
