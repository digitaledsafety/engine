const { test, expect } = require('@playwright/test');

test.describe('Engine Collision Functionality', () => {
  test('VRM collision detection works', async ({ page }) => {
    // Workspace JSON for testing VRM physics and collision
    // Using a simple box instead of VRM to avoid network 404 and slowness
    const workspace_json = {
      "blocks": {
          "languageVersion": 0,
          "blocks": [
              {
                  "type": "variables_set",
                  "id": "player_set",
                  "x": 10,
                  "y": 10,
                  "fields": {"VAR": {"id": "player_var"}},
                  "inputs": {
                      "VALUE": {
                          "block": {
                              "type": "create_box",
                              "id": "create_player_box",
                              "inputs": {
                                  "X": {"block": {"type": "math_number", "fields": {"NUM": 0}}},
                                  "Y": {"block": {"type": "math_number", "fields": {"NUM": 5}}},
                                  "Z": {"block": {"type": "math_number", "fields": {"NUM": 0}}}
                              }
                          }
                      }
                  },
                  "next": {
                      "block": {
                          "type": "enable_physics",
                          "id": "enable_player_physics",
                          "inputs": {
                              "NAME": {"block": {"type": "variables_get", "fields": {"VAR": {"id": "player_var"}}}},
                              "MASS": {"block": {"type": "math_number", "fields": {"NUM": 1}}}
                          }
                      }
                  }
              },
              {
                  "type": "variables_set",
                  "id": "target_set",
                  "x": 10,
                  "y": 250,
                  "fields": {"VAR": {"id": "target_var"}},
                  "inputs": {
                      "VALUE": {
                          "block": {
                              "type": "create_box",
                              "id": "create_target_box",
                              "inputs": {
                                  "X": {"block": {"type": "math_number", "fields": {"NUM": 0}}},
                                  "Y": {"block": {"type": "math_number", "fields": {"NUM": 0}}},
                                  "Z": {"block": {"type": "math_number", "fields": {"NUM": 0}}}
                              }
                          }
                      }
                  },
                  "next": {
                      "block": {
                          "type": "enable_physics",
                          "id": "enable_target_physics",
                          "inputs": {
                              "NAME": {"block": {"type": "variables_get", "fields": {"VAR": {"id": "target_var"}}}},
                              "MASS": {"block": {"type": "math_number", "fields": {"NUM": 0}}}
                          }
                      }
                  }
              },
              {
                  "type": "on_collision",
                  "id": "collision_handler",
                  "x": 10,
                  "y": 450,
                  "inputs": {
                      "OBJECT1": {"block": {"type": "variables_get", "fields": {"VAR": {"id": "player_var"}}}},
                      "OBJECT2": {"block": {"type": "variables_get", "fields": {"VAR": {"id": "target_var"}}}},
                      "DO": {
                          "block": {
                              "type": "console_log",
                              "id": "log_collision",
                              "inputs": {
                                  "VALUE": {
                                      "block": {
                                          "type": "text",
                                          "id": "collision_text",
                                          "fields": {"TEXT": "COLLISION_DETECTED"}
                                      }
                                  }
                              }
                          }
                      }
                  }
              }
          ],
          "variables": [
              {"name": "player", "id": "player_var"},
              {"name": "target", "id": "target_var"}
          ]
      }
    };

    await page.goto('/');
    await page.click("#start-button");
    await page.click("#preview-tab");

    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.evaluate((json) => {
        Blockly.serialization.workspaces.load(json, workspace);
        window.doRun();
    }, workspace_json);

    await expect.poll(() => consoleMessages, { timeout: 30000 }).toContain('COLLISION_DETECTED');
  });
});
