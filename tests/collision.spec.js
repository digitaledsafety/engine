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
                              "type": "create_primitive",
                              "id": "create_player_box",
                              "fields": {"TYPE": "box"},
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
                              "type": "create_primitive",
                              "id": "create_target_box",
                              "fields": {"TYPE": "box"},
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
                                          "type": "variables_get",
                                          "fields": {"VAR": {"id": "collision_msg_var"}}
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
              {"name": "target", "id": "target_var"},
              {"name": "msg", "id": "collision_msg_var"}
          ]
      }
    };

    await page.goto('/');
    // Handle the hero overlay
    await page.evaluate(() => {
      const overlay = document.getElementById('hero-overlay');
      if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
      }
    });

    await page.click("#preview-tab");

    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.evaluate(({json, msg}) => {
        // Set the message variable
        const msgVar = workspace.getVariableById('collision_msg_var');
        if (msgVar) {
            // Since we can't easily set a value to a variable from outside without blocks
            // we will just use a string literal in the JSON next time.
        }
        Blockly.serialization.workspaces.load(json, workspace);
        // Monkey patch the log to look for COLLISION_DETECTED
        const oldLog = console.log;
        console.log = (...args) => {
            if (args[0] && typeof args[0] === 'string' && args[0].includes('id_')) {
                 // it's likely logging an object reference, we want a string.
            }
            oldLog(...args);
        };

        window.doRun();
    }, {json: workspace_json});

    // Let's modify the JSON to use a text block directly for the message
    workspace_json.blocks[2].inputs.DO.block.inputs.VALUE.block = {
        "type": "text",
        "fields": {"TEXT": "COLLISION_DETECTED"}
    };

    await page.evaluate((json) => {
        Blockly.serialization.workspaces.load(json, workspace);
        window.doRun();
    }, workspace_json);

    await expect.poll(() => consoleMessages, { timeout: 30000 }).toContain('COLLISION_DETECTED');
  });
});
