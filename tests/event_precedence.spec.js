const { test, expect } = require('@playwright/test');

test.describe('Event Precedence Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('when scene starts executes and completes before click handlers are evaluated', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    const workspaceJsonStr = JSON.stringify({
      "blocks": {
        "languageVersion": 0,
        "blocks": [
          {
            "type": "event_on_click",
            "x": 20,
            "y": 300,
            "fields": { "CLICKED_ITEM": { "id": "clicked_item_var", "name": "clicked_item" } },
            "inputs": {
              "OBJECT_SELECTOR": {
                "block": {
                  "type": "variables_get",
                  "fields": { "VAR": { "id": "myList_var", "name": "myList" } }
                }
              }
            }
          },
          {
            "type": "event_on_scene_start",
            "x": 20,
            "y": 20,
            "inputs": {
              "DO_CODE": {
                "block": {
                  "type": "variables_set",
                  "fields": { "VAR": { "id": "myList_var", "name": "myList" } },
                  "inputs": {
                    "VALUE": {
                      "block": {
                        "type": "lists_create_with",
                        "extraState": { "itemCount": 0 }
                      }
                    }
                  },
                  "next": {
                    "block": {
                      "type": "controls_repeat_ext",
                      "inputs": {
                        "TIMES": {
                          "shadow": { "type": "math_number", "fields": { "NUM": 5 } }
                        },
                        "DO": {
                          "block": {
                            "type": "lists_setIndex",
                            "fields": { "MODE": "INSERT", "WHERE": "LAST" },
                            "inputs": {
                              "LIST": {
                                "block": {
                                  "type": "variables_get",
                                  "fields": { "VAR": { "id": "myList_var", "name": "myList" } }
                                }
                              },
                              "TO": {
                                "block": {
                                  "type": "create_primitive",
                                  "fields": { "TYPE": "sphere" },
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
      if (!window.sceneManager) return false;
      const spheres = Object.values(window.sceneManager.objects).filter(m => m && m.name.startsWith('id_'));
      return spheres.length === 5 && spheres.every(m => m.actionManager && m.actionManager.actions.length > 0);
    }, { timeout: 10000 });

    const allSpheresHaveClickHandler = await page.evaluate(() => {
      const spheres = Object.values(window.sceneManager.objects).filter(m => m && m.name.startsWith('id_'));
      return spheres.length === 5 && spheres.every(m => m.actionManager && m.actionManager.actions.length > 0);
    });

    expect(allSpheresHaveClickHandler).toBe(true);
  });
});
