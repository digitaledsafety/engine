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
            window.sceneManager.enableProceduralFlight('avatar', 'bottom');
            const anchor1 = window.sceneManager.proceduralFlight.currentAnchor;
            const bottomAnchorPos = window.sceneManager.flightAnchors['bottom'];

            // Trigger excited loop flight
            window.sceneManager.triggerActionTag('avatar', '[EXCITED]');
            const isLooping = window.sceneManager.proceduralFlight.isLooping;

            window.sceneManager.setFlightAnchor('center');
            const anchor2 = window.sceneManager.proceduralFlight.currentAnchor;
            window.sceneManager.setFlightAnchor('workspace');
            const anchor3 = window.sceneManager.proceduralFlight.currentAnchor;
            return {
                enabled: window.sceneManager.proceduralFlight.enabled,
                anchor1,
                bottomY: bottomAnchorPos ? bottomAnchorPos.y : 0,
                isLooping,
                anchor2,
                anchor3
            };
        });
        expect(flightState.enabled).toBe(true);
        expect(flightState.anchor1).toBe('bottom');
        expect(flightState.bottomY).toBe(-2.5);
        expect(flightState.isLooping).toBe(true);
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

    test('Particle Cube Avatar intact cube and full-screen pointer tracking', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const testResult = await page.evaluate(async () => {
            const avatar = window.sceneManager.createParticleCube('p_avatar', 0, 0, 0);
            const sps = avatar._sps;

            // Force update particles when stationary
            sps.setParticles();

            // Check that inner particles ease toward home positions and don't drop as propulsion exhaust
            const innerParticles = sps.particles.filter(p => !p.isOuterShell);
            const isIntactCube = innerParticles.every(p => Math.abs(p.position.y - p.homeY) < 0.1 && p.velocity.y === 0);

            return {
                isIntactCube,
                particlesCount: sps.particles.length
            };
        });

        expect(testResult.isIntactCube).toBe(true);
        expect(testResult.particlesCount).toBe(1000);
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
                hasSPS: !!(avatarObj && avatarObj._sps),
                flightEnabled: window.sceneManager.proceduralFlight.enabled,
                currentAnchor: window.sceneManager.proceduralFlight.currentAnchor
            };
        });
        expect(avatarState.hasAvatar).toBe(true);
        expect(avatarState.hasSPS).toBe(true);
        expect(avatarState.flightEnabled).toBe(true);

        // Verify swipe anchor change handling
        const swipeState = await page.evaluate(() => {
            window.sceneManager.setFlightAnchor('center');
            const centerAnchor = window.sceneManager.proceduralFlight.currentAnchor;
            window.sceneManager.setFlightAnchor('workspace');
            const workspaceAnchor = window.sceneManager.proceduralFlight.currentAnchor;
            return { centerAnchor, workspaceAnchor };
        });
        expect(swipeState.centerAnchor).toBe('center');
        expect(swipeState.workspaceAnchor).toBe('workspace');
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

    test('Speech Bubble API, Block Execution, and Fallback Quips Verification', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const res = await page.evaluate(async () => {
            const avatar = window.sceneManager.createBox('avatar', 0, 1, 0);

            // Test Speech Bubble API creation
            const bubble = window.sceneManager.showSpeechBubble(avatar, 'Hello from speech bubble!', 2);
            const exists = !!window.sceneManager.uiManager.controls['speech_bubble_avatar'];
            const textContent = window.sceneManager.uiManager.controls['speech_bubble_avatar'].children[0].text;

            // Test fallback LLM quips for jokes, questions, and fact checks
            const jokeRes = await window.sceneManager.queryCohostLLM('tell me a funny joke');
            const questionRes = await window.sceneManager.queryCohostLLM('what is your purpose?');
            const factCheckRes = await window.sceneManager.queryCohostLLM('fact check presenter transcript');

            // Test show_speech_bubble block execution via doRun (including avatar creation)
            const code = `
                const avatarMesh = sceneManager.createBox('avatar', 0, 1, 0);
                sceneManager.showSpeechBubble(avatarMesh, 'Block test speech', 3);
            `;
            await window.doRun(code);
            const updatedText = window.sceneManager.uiManager.controls['speech_bubble_avatar'].children[0].text;

            return {
                exists,
                textContent,
                jokeText: jokeRes.text,
                questionText: questionRes.text,
                factCheckText: factCheckRes.text,
                updatedText
            };
        });

        expect(res.exists).toBe(true);
        expect(res.textContent).toBe('Hello from speech bubble!');
        expect(res.jokeText).toBeTruthy();
        expect(res.questionText).toBeTruthy();
        expect(res.factCheckText).toBeTruthy();
        expect(res.updatedText).toBe('Block test speech');
    });
});
