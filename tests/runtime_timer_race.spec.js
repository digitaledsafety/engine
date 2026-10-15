const { test, expect } = require('@playwright/test');

test.describe('Runtime Timer and Workspace Loading Robustness', () => {
    test('BaseRuntimeEngine provides stub/default implementations for timer methods', async ({ page }) => {
        await page.goto('/workspaces/click-it/');
        await page.waitForLoadState('domcontentloaded');

        const timerMethodsExistOnBase = await page.evaluate(() => {
            if (typeof window.BaseRuntimeEngine !== 'function') return false;
            const instance = new window.BaseRuntimeEngine(document.createElement('canvas'));
            return (
                typeof instance.onGameTimerFinish === 'function' &&
                typeof instance.createTimer === 'function' &&
                typeof instance.setGameTimer === 'function' &&
                typeof instance.getGameTimer === 'function' &&
                typeof instance.startGameTimer === 'function' &&
                typeof instance.pauseGameTimer === 'function'
            );
        });

        expect(timerMethodsExistOnBase).toBe(true);
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
