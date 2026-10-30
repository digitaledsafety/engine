const { test, expect } = require('@playwright/test');

test.describe('Runtime Timer and Workspace Loading Robustness', () => {
    test('BaseRuntimeEngine provides stub/default implementations for timer methods', async ({ page }) => {
        await page.goto('/workspaces/click-it/');
        await page.waitForLoadState('domcontentloaded');

        const timerMethodsExistOnBase = await page.evaluate(() => {
            if (typeof window.BaseRuntimeEngine !== 'function') return false;
            const instance = new window.BaseRuntimeEngine(document.createElement('canvas'));
            const timer = instance.createTimer(30, true);
            return (
                typeof instance.onGameTimerFinish === 'function' &&
                typeof instance.createTimer === 'function' &&
                typeof instance.setGameTimer === 'function' &&
                typeof instance.getGameTimer === 'function' &&
                typeof instance.startGameTimer === 'function' &&
                typeof instance.pauseGameTimer === 'function' &&
                typeof timer.getRemaining === 'function' &&
                typeof timer.getTimeRemaining === 'function' &&
                typeof timer.reset === 'function' &&
                typeof timer.start === 'function' &&
                typeof timer.pause === 'function' &&
                typeof timer.stop === 'function' &&
                typeof timer.dispose === 'function'
            );
        });

        expect(timerMethodsExistOnBase).toBe(true);
    });

    test('Timer and TimerManager lifecycle, HUD synchronization, and removal', async ({ page }) => {
        await page.goto('/workspaces/click-it/');
        await page.waitForLoadState('domcontentloaded');

        const testResults = await page.evaluate(async () => {
            const sm = window.sceneManager;
            if (!sm) return { success: false, reason: 'sceneManager not found' };

            if (typeof sm.clearScene === 'function') {
                sm.clearScene();
            } else if (typeof sm.clear === 'function') {
                sm.clear();
            }

            // 1. Create primary timer via sceneManager.createTimer
            const t1 = sm.createTimer(10, false);
            const remainingInitial = t1.getRemaining();
            const timeRemainingAlias = t1.getTimeRemaining();

            // 2. Test HUD sync with primary timer
            sm.displayGameHUD(true, true, 100, true, 10);
            const hudTextInitial = sm.hudElements && sm.hudElements.timerText ? sm.hudElements.timerText.text : '';

            // 3. Test start, update tick, pause, reset
            t1.start();
            t1.update(2.5); // remaining 7.5 -> rounded 8
            const remainingAfterUpdate = t1.getRemaining();
            const hudTextAfterUpdate = sm.hudElements && sm.hudElements.timerText ? sm.hudElements.timerText.text : '';

            t1.reset(15, false);
            const remainingAfterReset = t1.getRemaining();

            // 4. Test multi-timer and dispose/removeTimer
            const t2 = sm.createTimer(5, false);
            const managerCountBefore = sm.timerManager.timers.length;
            t2.dispose();
            const managerCountAfter = sm.timerManager.timers.length;

            return {
                success: true,
                remainingInitial,
                timeRemainingAlias,
                remainingAfterUpdate,
                remainingAfterReset,
                hudTextInitial,
                hudTextAfterUpdate,
                managerCountBefore,
                managerCountAfter
            };
        });

        expect(testResults.success).toBe(true);
        expect(testResults.remainingInitial).toBe(10);
        expect(testResults.timeRemainingAlias).toBe(10);
        expect(testResults.remainingAfterUpdate).toBe(8);
        expect(testResults.hudTextAfterUpdate).toContain('00:08');
        expect(testResults.remainingAfterReset).toBe(15);
        expect(testResults.managerCountBefore).toBe(2);
        expect(testResults.managerCountAfter).toBe(1);
    });

    test('workspaces/click-it loads and executes doRun without onGameTimerFinish error', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/workspaces/click-it/');
        await page.waitForLoadState('networkidle');

        await page.evaluate(async () => {
            if (window.doRun) {
                await window.doRun();
            }
        });

        const timerErrorFound = errors.some(e => e.includes('onGameTimerFinish is not a function'));
        expect(timerErrorFound).toBe(false);
    });
});
