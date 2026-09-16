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

    test('Co-Host sensing, reasoning, flight physics, and retro audio API methods', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        await page.evaluate(async () => {
            await window.doRun('sceneManager.createSphere("avatar", 0, 0, 0);');
        });

        // Test Voice Perception STT
        const transcript = await page.evaluate(() => {
            window.sceneManager.startSpeechRecognition();
            return window.sceneManager.getSpeechTranscript();
        });
        expect(typeof transcript).toBe('string');

        // Test Webcam Tracking & Spatial Perception
        const webcamX = await page.evaluate(() => {
            window.sceneManager.startWebcamTracking();
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

        // Test Procedural Flight Physics & Anchors
        const flightEnabled = await page.evaluate(() => {
            window.sceneManager.enableProceduralFlight('avatar', 'shoulder');
            window.sceneManager.setFlightAnchor('center');
            return window.sceneManager.proceduralFlight.enabled;
        });
        expect(flightEnabled).toBe(true);

        // Test Retro Voice Synthesis
        const spoke = await page.evaluate(() => {
            window.sceneManager.speakRetroVoice('Word reporting for live co-hosting!', 1.2, 1.0);
            return true;
        });
        expect(spoke).toBe(true);
    });

    test('Executing Co-Host Blockly blocks generated code', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        // Evaluate user-generated code from Co-Host blocks
        const result = await page.evaluate(async () => {
            const code = `
                const avatar = sceneManager.createSphere('avatar', 0, 0, 0);
                sceneManager.enableProceduralFlight(avatar, 'shoulder');
                sceneManager.startSpeechRecognition();
                sceneManager.startWebcamTracking();
                sceneManager.triggerActionTag('avatar', 'GLOW_ON');
                sceneManager.triggerActionTag('avatar', 'EQUIP_JETPACK');
                sceneManager.speakRetroVoice('Testing blocks');
            `;
            await window.doRun(code);
            return {
                flight: window.sceneManager.proceduralFlight.enabled,
                jetpackExists: !!window.sceneManager.objects['jetpack']
            };
        });

        expect(result.flight).toBe(true);
        expect(result.jetpackExists).toBe(true);
    });
});
