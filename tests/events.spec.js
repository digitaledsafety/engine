const { test, expect } = require('@playwright/test');

test.describe('Events Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('when game starts event triggers', async ({ page }) => {
    const workspace_json = {
      "blocks": {
        "languageVersion": 0,
        "blocks": [
          {
            "type": "event_on_game_start",
            "inputs": {
              "DO": {
                "block": {
                  "type": "console_log",
                  "inputs": {
                    "VALUE": {
                      "block": {
                        "type": "text",
                        "fields": { "TEXT": "GAME_STARTED_SUCCESS" }
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
    }, workspace_json);

    await expect.poll(() => consoleMessages).toContain('GAME_STARTED_SUCCESS');
  });

  test('broadcast and receive events work', async ({ page }) => {
    const workspace_json = {
      "blocks": {
        "languageVersion": 0,
        "blocks": [
          {
            "type": "event_on_game_start",
            "inputs": {
              "DO": {
                "block": {
                  "type": "event_broadcast",
                  "inputs": {
                    "EVENT": {
                      "block": {
                        "type": "text",
                        "fields": { "TEXT": "test_event" }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            "type": "event_on_receive",
            "inputs": {
              "EVENT": {
                "block": {
                  "type": "text",
                  "fields": { "TEXT": "test_event" }
                }
              },
              "DO": {
                "block": {
                  "type": "console_log",
                  "inputs": {
                    "VALUE": {
                      "block": {
                        "type": "text",
                        "fields": { "TEXT": "EVENT_RECEIVED_SUCCESS" }
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
    }, workspace_json);

    await expect.poll(() => consoleMessages).toContain('EVENT_RECEIVED_SUCCESS');
  });
});
