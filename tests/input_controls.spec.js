const { test, expect } = require('@playwright/test');

test.describe('Input Controls & Unified Action System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.click('#start-button');
    await page.click('#preview-tab');
  });

  test('Unified action trigger and isActionActive work programmatically', async ({ page }) => {
    const actionsFired = await page.evaluate(async () => {
      const results = [];
      window.sceneManager.onAction('select', () => results.push('SELECT_FIRED'));
      window.sceneManager.onAction('context', () => results.push('CONTEXT_FIRED'));
      window.sceneManager.onAction('menu', () => results.push('MENU_FIRED'));

      window.sceneManager.triggerAction('select');
      window.sceneManager.triggerAction('context');
      window.sceneManager.triggerAction('menu');

      const isSelectActive = window.sceneManager.isActionActive('select');

      return { results, isSelectActive };
    });

    expect(actionsFired.results).toEqual(['SELECT_FIRED', 'CONTEXT_FIRED', 'MENU_FIRED']);
    expect(actionsFired.isSelectActive).toBe(true);
  });

  test('Keyboard escape key triggers menu action and WASD triggers navigate action', async ({ page }) => {
    const firedActions = [];
    await page.exposeFunction('onActionFired', (action) => firedActions.push(action));

    await page.evaluate(() => {
      window.sceneManager.onAction('menu', () => window.onActionFired('MENU_KEY'));
      window.sceneManager.onAction('navigate', () => window.onActionFired('NAVIGATE_KEY'));
    });

    const canvas = page.locator('#gameCanvas');
    await canvas.focus();
    await page.keyboard.press('Escape');
    await page.keyboard.press('KeyW');

    await expect.poll(() => firedActions, { timeout: 10000 }).toContain('MENU_KEY');
    await expect.poll(() => firedActions, { timeout: 10000 }).toContain('NAVIGATE_KEY');
  });

  test('Mouse buttons, wheel, and double click trigger corresponding actions', async ({ page }) => {
    const firedActions = [];
    await page.exposeFunction('onMouseActionFired', (action) => firedActions.push(action));

    await page.evaluate(() => {
      window.sceneManager.onAction('select', () => window.onMouseActionFired('SELECT_MOUSE'));
      window.sceneManager.onAction('context', () => window.onMouseActionFired('CONTEXT_MOUSE'));
      window.sceneManager.onAction('zoom', () => window.onMouseActionFired('ZOOM_MOUSE'));
      window.sceneManager.onAction('double_select', () => window.onMouseActionFired('DOUBLE_SELECT_MOUSE'));

      const canvas = document.getElementById('gameCanvas');
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 2, bubbles: true }));
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
      canvas.dispatchEvent(new MouseEvent('dblclick', { button: 0, bubbles: true }));
    });

    await expect.poll(() => firedActions, { timeout: 10000 }).toContain('SELECT_MOUSE');
    await expect.poll(() => firedActions, { timeout: 10000 }).toContain('CONTEXT_MOUSE');
    await expect.poll(() => firedActions, { timeout: 10000 }).toContain('ZOOM_MOUSE');
    await expect.poll(() => firedActions, { timeout: 10000 }).toContain('DOUBLE_SELECT_MOUSE');
  });

  test('Touch gestures (tap, double tap, pinch) trigger unified actions', async ({ page }) => {
    const firedActions = [];
    await page.exposeFunction('onTouchActionFired', (action) => firedActions.push(action));

    await page.evaluate(() => {
      window.sceneManager.onAction('select', () => window.onTouchActionFired('SELECT_TOUCH'));
      window.sceneManager.onAction('double_select', () => window.onTouchActionFired('DOUBLE_SELECT_TOUCH'));
      window.sceneManager.onAction('zoom', () => window.onTouchActionFired('ZOOM_TOUCH'));

      const canvas = document.getElementById('gameCanvas');

      // Single Touch Tap
      const touch1 = new Touch({ identifier: 1, target: canvas, clientX: 100, clientY: 100 });
      canvas.dispatchEvent(new TouchEvent('touchstart', { touches: [touch1], changedTouches: [touch1], bubbles: true }));
      canvas.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch1], bubbles: true }));

      // Double Touch Tap
      const touch2 = new Touch({ identifier: 2, target: canvas, clientX: 100, clientY: 100 });
      canvas.dispatchEvent(new TouchEvent('touchstart', { touches: [touch2], changedTouches: [touch2], bubbles: true }));
      canvas.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch2], bubbles: true }));

      // Touch Pinch Zoom (2 fingers)
      const p1 = new Touch({ identifier: 3, target: canvas, clientX: 100, clientY: 100 });
      const p2 = new Touch({ identifier: 4, target: canvas, clientX: 200, clientY: 100 });
      canvas.dispatchEvent(new TouchEvent('touchstart', { touches: [p1, p2], changedTouches: [p1, p2], bubbles: true }));

      const p1_moved = new Touch({ identifier: 3, target: canvas, clientX: 50, clientY: 100 });
      const p2_moved = new Touch({ identifier: 4, target: canvas, clientX: 250, clientY: 100 });
      canvas.dispatchEvent(new TouchEvent('touchmove', { touches: [p1_moved, p2_moved], changedTouches: [p1_moved, p2_moved], bubbles: true }));
    });

    await expect.poll(() => firedActions, { timeout: 10000 }).toContain('SELECT_TOUCH');
    await expect.poll(() => firedActions, { timeout: 10000 }).toContain('DOUBLE_SELECT_TOUCH');
    await expect.poll(() => firedActions, { timeout: 10000 }).toContain('ZOOM_TOUCH');
  });

  test('Gamepad API polling triggers unified actions when controller buttons are pressed', async ({ page }) => {
    const firedActions = [];
    await page.exposeFunction('onGamepadActionFired', (action) => firedActions.push(action));

    await page.evaluate(() => {
      window.sceneManager.onAction('select', () => window.onGamepadActionFired('SELECT_GAMEPAD'));
      window.sceneManager.onAction('menu', () => window.onGamepadActionFired('MENU_GAMEPAD'));

      // Mock navigator.getGamepads
      navigator.getGamepads = () => [
        {
          index: 0,
          buttons: [
            { pressed: true, value: 1.0 },  // Button 0: A (Select)
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: true, value: 1.0 }   // Button 9: Start (Menu)
          ],
          axes: [0, 0]
        }
      ];

      window.sceneManager.pollGamepads();
    });

    await expect.poll(() => firedActions, { timeout: 10000 }).toContain('SELECT_GAMEPAD');
    await expect.poll(() => firedActions, { timeout: 10000 }).toContain('MENU_GAMEPAD');
  });

  test('Blockly event_on_action and is_action_active blocks generate valid code and fire', async ({ page }) => {
    const workspace_json = {
      "blocks": {
        "languageVersion": 0,
        "blocks": [
          {
            "type": "event_on_action",
            "x": 10,
            "y": 10,
            "fields": {
              "ACTION": "select"
            },
            "inputs": {
              "DO_CODE": {
                "block": {
                  "type": "console_log",
                  "inputs": {
                    "VALUE": {
                      "block": {
                        "type": "text",
                        "fields": { "TEXT": "BLOCK_ACTION_SELECT_FIRED" }
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      }
    };

    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.evaluate((json) => {
      Blockly.serialization.workspaces.load(json, workspace);
      window.doRun();
      window.sceneManager.triggerAction('select');
    }, workspace_json);

    await expect.poll(() => consoleMessages, { timeout: 10000 }).toContain('BLOCK_ACTION_SELECT_FIRED');
  });
});
