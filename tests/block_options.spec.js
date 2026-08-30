const { test, expect } = require('@playwright/test');

test.describe('Block Options & Dropdown Normalization', () => {
    test('enable_physics accepts BABYLON.PhysicsImpostor options and play_note supports C3/C5 notes', async ({ page }) => {
        const consoleWarnings = [];

        page.on('console', msg => {
            if (msg.type() === 'warning' || msg.type() === 'error') {
                consoleWarnings.push(msg.text());
            }
        });

        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#start-button', { state: 'visible' });
        await page.click('#start-button');

        // Check options via Blockly block instances
        const enablePhysicsOptions = await page.evaluate(() => {
            const ws = Blockly.getMainWorkspace();
            const block = ws.newBlock('enable_physics');
            const field = block.getField('IMPOSTOR');
            const options = field.getOptions();
            block.dispose();
            return options;
        });

        const noteOptions = await page.evaluate(() => {
            const ws = Blockly.getMainWorkspace();
            const block = ws.newBlock('play_note');
            const field = block.getField('NOTE');
            const options = field.getOptions();
            block.dispose();
            return options;
        });

        // Verify options presence
        const enablePhysicsValues = enablePhysicsOptions.map(opt => opt[1]);
        expect(enablePhysicsValues).toContain('BoxImpostor');
        expect(enablePhysicsValues).toContain('BABYLON.PhysicsImpostor.BoxImpostor');

        const noteValues = noteOptions.map(opt => opt[1]);
        expect(noteValues).toContain('130.81'); // C3
        expect(noteValues).toContain('261.63'); // C4
        expect(noteValues).toContain('523.25'); // C5

        // Execute code via doRun with full BABYLON.PhysicsImpostor string
        await page.evaluate(async () => {
            const code = `
                const box = sceneManager.createBox('testBox', 0, 1, 0);
                sceneManager.enablePhysics(box, 1, 0.2, 0.9, 'BABYLON.PhysicsImpostor.BoxImpostor');
                sceneManager.playNote(130.81, 0.5);
                sceneManager.playNote(523.25, 0.5);
            `;
            await window.doRun(code);
        });

        // Check that physics impostor was successfully created on testBox
        const hasPhysicsImpostor = await page.evaluate(() => {
            const mesh = window.sceneManager._getMesh('testBox');
            return !!(mesh && mesh.physicsImpostor);
        });

        expect(hasPhysicsImpostor).toBe(true);

        // Ensure no "Cannot set the dropdown's value to an unavailable option" warnings were issued
        const unavailableOptionWarnings = consoleWarnings.filter(w => w.includes("Cannot set the dropdown's value to an unavailable option"));
        expect(unavailableOptionWarnings.length).toBe(0);
    });
});
