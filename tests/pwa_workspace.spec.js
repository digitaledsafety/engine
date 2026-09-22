
const { test, expect } = require('@playwright/test');

test.describe('Workspace PWA Verification', () => {
    test('Maze workspace should have custom title and dynamic manifest', async ({ page }) => {
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('requestfailed', request => {
            console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
        });
        await page.goto('/workspaces/maze/', { waitUntil: 'domcontentloaded' });

        // 1. Verify title
        const title = await page.title();
        expect(title).toBe('Maze');

        // 2. Verify dynamic manifest link is relative manifest.json
        const manifestLink = await page.locator('#manifest-link');
        const href = await manifestLink.getAttribute('href');
        expect(href).toBe('manifest.json');

        // 3. Wait for the Service Worker to register and become fully active
        let swActivated = false;
        for (let i = 0; i < 30; i++) {
            const state = await page.evaluate(async () => {
                const regs = await navigator.serviceWorker.getRegistrations();
                const reg = regs.find(r => r.scope.includes('/workspaces/maze/'));
                if (!reg) return 'none';
                if (reg.active) return reg.active.state;
                if (reg.waiting) return 'waiting: ' + reg.waiting.state;
                if (reg.installing) return 'installing: ' + reg.installing.state;
                return 'unknown';
            });
            console.log(`POLLING SW STATE (attempt ${i + 1}):`, state);
            if (state === 'activated') {
                swActivated = true;
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        expect(swActivated).toBe(true);

        // 4. Reload the page to ensure the document is fully loaded under the service worker controller
        await page.reload();

        // 5. Verify manifest content is dynamically returned by the scoped Service Worker
        const manifestContent = await page.evaluate(async () => {
            const response = await fetch('manifest.json');
            return await response.json();
        });

        expect(manifestContent.name).toBe('Maze');
        expect(manifestContent.start_url).toContain('/workspaces/maze/?mode=app');
    });

    test('App mode should switch to preview tab', async ({ page }) => {
        // We use a workspace page for this
        await page.goto('/workspaces/maze/?mode=app', { waitUntil: 'domcontentloaded' });

        const container = page.locator('.container');
        await expect(container).toHaveClass(/preview-active/);

        const previewTab = page.locator('#preview-tab');
        await expect(previewTab).toHaveClass(/active/);

        const workspaceTab = page.locator('#workspace-tab');
        await expect(workspaceTab).not.toHaveClass(/active/);
    });
});
