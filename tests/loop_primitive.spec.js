const { test, expect } = require('@playwright/test');

test.describe('Loop Primitive Creation Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('Creating primitives in a loop instantiates multiple distinct meshes', async ({ page }) => {
    const workspaceJsonStr = JSON.stringify({
      "blocks": {
        "languageVersion": 0,
        "blocks": [
          {
            "type": "event_on_scene_start",
            "x": 20,
            "y": 20,
            "inputs": {
              "DO_CODE": {
                "block": {
                  "type": "controls_repeat_ext",
                  "inputs": {
                    "TIMES": {
                      "shadow": {
                        "type": "math_number",
                        "fields": { "NUM": 5 }
                      }
                    },
                    "DO": {
                      "block": {
                        "type": "variables_set",
                        "fields": { "VAR": { "id": "myMesh_var" } },
                        "inputs": {
                          "VALUE": {
                            "block": {
                              "type": "create_primitive",
                              "fields": { "TYPE": "box" },
                              "inputs": {
                                "X": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } },
                                "Y": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } },
                                "Z": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      }
    });

    await page.evaluate((jsonStr) => {
      const workspace = Blockly.getMainWorkspace();
      Blockly.serialization.workspaces.load(JSON.parse(jsonStr), workspace);
      window.doRun();
    }, workspaceJsonStr);

    await page.waitForFunction(() => {
      return window.sceneManager && Object.keys(window.sceneManager.objects).filter(k => k.startsWith('id_')).length >= 5;
    }, { timeout: 10000 });

    const createdPrimitiveCount = await page.evaluate(() => {
      return Object.keys(window.sceneManager.objects).filter(k => k.startsWith('id_')).length;
    });

    expect(createdPrimitiveCount).toBe(5);
  });
});
