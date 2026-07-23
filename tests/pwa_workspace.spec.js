
const { test, expect } = require('@playwright/test');

test.describe('Workspace PWA Verification', () => {
    test('Maze workspace should have custom title and dynamic manifest', async ({ page }) => {
        await page.goto('/workspaces/maze/');

        // 1. Verify title
        const title = await page.title();
        expect(title).toBe('Maze');

        // 2. Verify dynamic manifest link
        const manifestLink = await page.locator('#manifest-link');
        const href = await manifestLink.getAttribute('href');
        expect(href).toMatch(/^blob:/);

        // 3. Verify manifest content (optional but good)
        const manifestContent = await page.evaluate(async (url) => {
            const response = await fetch(url);
            return await response.json();
        }, href);

        expect(manifestContent.name).toBe('Maze');
        expect(manifestContent.start_url).toContain('/workspaces/maze/?mode=app');
    });

    test('App mode should switch to preview tab', async ({ page }) => {
        // We use a workspace page for this
        await page.goto('/workspaces/maze/?mode=app');

        const container = page.locator('.container');
        await expect(container).toHaveClass(/preview-active/);

        const previewTab = page.locator('#preview-tab');
        await expect(previewTab).toHaveClass(/active/);

        const workspaceTab = page.locator('#workspace-tab');
        await expect(workspaceTab).not.toHaveClass(/active/);
    });
});
