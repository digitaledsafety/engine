const { test, expect } = require('@playwright/test');

test.describe('Workspace Embed and <engine-player> Web Component', () => {

    test('Embed mode hides editor chrome and shows canvas with Play Scene CTA', async ({ page }) => {
        // Navigate to a workspace in embed mode
        await page.goto('/workspaces/space-shooter/?embed=1');

        // Body should have .embed-mode class
        const bodyClass = await page.evaluate(() => document.body.className);
        expect(bodyClass).toContain('embed-mode');

        // Controls (Blockly workspace) and bottom-nav should be hidden
        await expect(page.locator('.controls')).toBeHidden();
        await expect(page.locator('#bottom-nav')).toBeHidden();
        await expect(page.locator('#hero-overlay')).toBeHidden();

        // Canvas container and Play Scene CTA should be visible
        await expect(page.locator('.canvas-container')).toBeVisible();
        await expect(page.locator('#play-overlay')).toBeVisible();
        await expect(page.locator('#play-overlay-button')).toBeVisible();

        // Floating embed fullscreen button should be visible
        await expect(page.locator('#embed-fullscreen-btn')).toBeVisible();

        // Clicking play overlay starts the scene and hides play overlay
        await page.click('#play-overlay-button');
        await expect(page.locator('#play-overlay')).toBeHidden();

        // Babylon canvas should be present and active
        const canvas = page.locator('#gameCanvas');
        await expect(canvas).toBeVisible();
    });

    test('Share button opens Share & Embed modal with link and Web Component code', async ({ page }) => {
        await page.goto('/workspaces/space-shooter/');

        // Dismiss hero overlay if visible
        const heroOverlay = page.locator('#hero-overlay');
        if (await heroOverlay.isVisible()) {
            await page.click('#start-button');
        }

        // Open options dropdown menu and click Share
        await page.click('#menuButton');
        await expect(page.locator('#shareButton')).toBeVisible();
        await page.click('#shareButton');

        // Share & Embed Modal should now be visible
        const shareModal = page.locator('#share-modal');
        await expect(shareModal).toBeVisible();

        // Direct share link should point to current workspace URL
        const shareUrlInput = page.locator('#share-url-input');
        const shareUrl = await shareUrlInput.inputValue();
        expect(shareUrl).toContain('/workspaces/space-shooter/');

        // Embed code textarea should contain <engine-player> snippet
        const embedTextarea = page.locator('#embed-code-textarea');
        const embedCode = await embedTextarea.inputValue();
        expect(embedCode).toContain('<engine-player');
        expect(embedCode).toContain('workspace="space-shooter"');
        expect(embedCode).toContain('engine-player.js');

        // Copy buttons should work and change label to Copied!
        // Mock clipboard API
        await page.evaluate(() => {
            navigator.clipboard = {
                writeText: () => Promise.resolve()
            };
        });

        await page.click('#copy-share-url-btn');
        await expect(page.locator('#copy-share-url-btn')).toHaveText('✅ Copied!');

        await page.click('#copy-embed-code-btn');
        await expect(page.locator('#copy-embed-code-btn')).toHaveText('✅ Copied!');

        // Close modal
        await page.click('#close-share-modal');
        await expect(shareModal).toBeHidden();
    });

    test('<engine-player> Web Component mounts in DOM, configures iframe, and embeds workspace', async ({ page }) => {
        // Load index page and inject <engine-player>
        await page.goto('/');

        // Dismiss hero overlay if visible
        const heroOverlay = page.locator('#hero-overlay');
        if (await heroOverlay.isVisible()) {
            await page.click('#start-button');
        }

        // Inject engine-player script and instantiate component
        await page.evaluate(() => {
            const script = document.createElement('script');
            script.src = '/assets/js/engine-player.js';
            document.head.appendChild(script);
        });

        // Wait for script to register custom element
        await page.waitForFunction(() => customElements.get('engine-player') !== undefined);

        // Append an <engine-player> custom element
        await page.evaluate(() => {
            const player = document.createElement('engine-player');
            player.id = 'test-player';
            player.setAttribute('workspace', 'space-shooter');
            player.setAttribute('width', '600px');
            player.setAttribute('height', '400px');
            document.body.appendChild(player);
        });

        const playerElement = page.locator('#test-player');
        await expect(playerElement).toBeAttached();

        // Verify shadow root contains iframe with embed URL
        const iframeSrc = await page.evaluate(() => {
            const el = document.getElementById('test-player');
            const iframe = el.shadowRoot.querySelector('iframe');
            return iframe ? iframe.getAttribute('src') : null;
        });

        expect(iframeSrc).toContain('/workspaces/space-shooter/');
        expect(iframeSrc).toContain('embed=1');

        // Verify fullscreen button exists inside shadow DOM
        const hasFullscreenBtn = await page.evaluate(() => {
            const el = document.getElementById('test-player');
            return !!el.shadowRoot.querySelector('#fullscreen-btn');
        });
        expect(hasFullscreenBtn).toBe(true);
    });

});
