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

    test('Particle Cube Avatar creation, color change, and procedural flight support', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const particleResult = await page.evaluate(async () => {
            const avatar = window.sceneManager.createParticleCube('p_avatar', 0, 1.5, 0);
            window.sceneManager.changeColor('p_avatar', '#ff00ff');
            window.sceneManager.enableProceduralFlight(avatar, 'shoulder');

            const hasSPS = !!avatar._sps;
            const particleColor = avatar._sps.particles[0].baseColor;

            return {
                exists: !!window.sceneManager.objects['p_avatar'],
                hasSPS,
                r: particleColor.r,
                b: particleColor.b,
                flightEnabled: window.sceneManager.proceduralFlight.enabled
            };
        });

        expect(particleResult.exists).toBe(true);
        expect(particleResult.hasSPS).toBe(true);
        expect(particleResult.r).toBeCloseTo(1.0);
        expect(particleResult.b).toBeCloseTo(1.0);
        expect(particleResult.flightEnabled).toBe(true);
    });

    test('Digital Co-Host workspace loads and executes scripted flying sequence with particle cube avatar', async ({ page }) => {
        await page.goto('/workspaces/digital-cohost/', { waitUntil: 'domcontentloaded' });

        // Verify workspace loads
        const isRun = await page.evaluate(() => {
            return typeof window.doRun === 'function' && !!window.sceneManager;
        });
        expect(isRun).toBe(true);

        // Trigger workspace code execution via window.doRun()
        await page.evaluate(async () => {
            await window.doRun();
        });

        await page.waitForTimeout(1000);

        const avatarState = await page.evaluate(async () => {
            const keys = Object.keys(window.sceneManager.objects);
            const avatarObj = window.sceneManager.objects['avatar'] || window.sceneManager.objects[keys[0]];
            return {
                keys,
                hasAvatar: !!avatarObj,
                hasSPS: !!(avatarObj && avatarObj._sps)
            };
        });
        expect(avatarState.hasAvatar).toBe(true);
        expect(avatarState.hasSPS).toBe(true);
    });
});
