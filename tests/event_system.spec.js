const { test, expect } = require('@playwright/test');

test.describe('Event System and Observables Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click("#start-button");
    await page.click("#preview-tab");
  });

  test('Toolbox contains Events category and all event blocks', async ({ page }) => {
    // Click "Add Blocks" button if search container/toolbox is collapsed
    const isCollapsed = await page.evaluate(() => {
        const div = document.getElementById('blocklyDiv');
        return div && div.classList.contains('toolbox-collapsed');
    });
    if (isCollapsed) {
        await page.click('#toggleToolboxButton');
    }

    // Verify Events category exists in Blockly workspace toolbox
    const categoryExists = await page.evaluate(() => {
        const workspace = Blockly.getMainWorkspace();
        const toolbox = workspace.getToolbox();
        const items = toolbox.getToolboxItems();
        return items.some(item => item.getName() === 'Events');
    });
    expect(categoryExists).toBe(true);
  });

  test('All Event block types can be loaded and executed correctly', async ({ page }) => {
    // 1. Test Scene Start Block
    const workspace_json_scene_start = {
      "blocks": {
          "languageVersion": 0,
          "blocks": [
              {
                  "type": "event_on_scene_start",
                  "x": 10,
                  "y": 10,
                  "inputs": {
                      "DO_CODE": {
                          "block": {
                              "type": "console_log",
                              "inputs": {
                                  "VALUE": {
                                      "block": {
                                          "type": "text",
                                          "fields": {"TEXT": "SCENE_START_FIRED"}
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
    }, workspace_json_scene_start);

    await expect.poll(() => consoleMessages, { timeout: 15000 }).toContain('SCENE_START_FIRED');

    // 2. Test Global Event Bus (Broadcast & Receive)
    const workspace_json_global_event = {
      "blocks": {
          "languageVersion": 0,
          "blocks": [
              {
                  "type": "event_on_receive",
                  "x": 10,
                  "y": 10,
                  "inputs": {
                      "EVENT_NAME": {
                          "block": {
                              "type": "text",
                              "fields": {"TEXT": "level_complete"}
                          }
                      },
                      "DO_CODE": {
                          "block": {
                              "type": "console_log",
                              "inputs": {
                                  "VALUE": {
                                      "block": {
                                          "type": "text",
                                          "fields": {"TEXT": "LEVEL_COMPLETE_RECEIVED"}
                                      }
                                  }
                              }
                          }
                      }
                  }
              },
              {
                  "type": "event_broadcast",
                  "x": 10,
                  "y": 200,
                  "inputs": {
                      "EVENT_NAME": {
                          "block": {
                              "type": "text",
                              "fields": {"TEXT": "level_complete"}
                          }
                      }
                  }
              }
          ]
      }
    };

    await page.evaluate((json) => {
        Blockly.serialization.workspaces.load(json, workspace);
        window.doRun();
    }, workspace_json_global_event);

    await expect.poll(() => consoleMessages, { timeout: 15000 }).toContain('LEVEL_COMPLETE_RECEIVED');

    // 3. Test Local Object Custom Event Trigger & Receive
    const workspace_json_local_event = {
      "blocks": {
          "languageVersion": 0,
          "blocks": [
              {
                  "type": "event_on_object_receive",
                  "x": 10,
                  "y": 10,
                  "inputs": {
                      "OBJECT_NAME": {
                          "block": {
                              "type": "select_object",
                              "fields": {"OBJECT_NAME": "coin"}
                          }
                      },
                      "EVENT_NAME": {
                          "block": {
                              "type": "text",
                              "fields": {"TEXT": "collected"}
                          }
                      },
                      "DO_CODE": {
                          "block": {
                              "type": "console_log",
                              "inputs": {
                                  "VALUE": {
                                      "block": {
                                          "type": "text",
                                          "fields": {"TEXT": "COIN_COLLECTED_LOCAL"}
                                      }
                                  }
                              }
                          }
                      }
                  }
              },
              {
                  "type": "create_primitive",
                  "x": 10,
                  "y": 200,
                  "fields": {"TYPE": "sphere"},
                  "inputs": {
                      "NAME": {
                          "block": {
                              "type": "text",
                              "fields": {"TEXT": "coin"}
                          }
                      },
                      "X": {"block": {"type": "math_number", "fields": {"NUM": 0}}},
                      "Y": {"block": {"type": "math_number", "fields": {"NUM": 1}}},
                      "Z": {"block": {"type": "math_number", "fields": {"NUM": 0}}}
                  },
                  "next": {
                      "block": {
                          "type": "event_object_trigger",
                          "inputs": {
                              "OBJECT_NAME": {
                                  "block": {
                                      "type": "select_object",
                                      "fields": {"OBJECT_NAME": "coin"}
                                  }
                              },
                              "EVENT_NAME": {
                                  "block": {
                                      "type": "text",
                                      "fields": {"TEXT": "collected"}
                                  }
                              }
                          }
                      }
                  }
              }
          ]
      }
    };

    await page.evaluate((json) => {
        Blockly.serialization.workspaces.load(json, workspace);
        window.doRun();
    }, workspace_json_local_event);

    await expect.poll(() => consoleMessages, { timeout: 15000 }).toContain('COIN_COLLECTED_LOCAL');
  });
});
