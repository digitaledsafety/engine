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
      "variables": [
          {"name": "coin", "id": "coin_var"}
      ],
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
                              "type": "variables_get",
                              "fields": {"VAR": {"id": "coin_var"}}
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
                  "type": "variables_set",
                  "x": 10,
                  "y": 200,
                  "fields": {"VAR": {"id": "coin_var"}},
                  "inputs": {
                      "VALUE": {
                          "block": {
                              "type": "create_primitive",
                              "fields": {"TYPE": "sphere"},
                              "inputs": {
                                  "X": {"block": {"type": "math_number", "fields": {"NUM": 0}}},
                                  "Y": {"block": {"type": "math_number", "fields": {"NUM": 1}}},
                                  "Z": {"block": {"type": "math_number", "fields": {"NUM": 0}}}
                              }
                          }
                      }
                  },
                  "next": {
                      "block": {
                          "type": "event_object_trigger",
                          "inputs": {
                              "OBJECT_NAME": {
                                  "block": {
                                      "type": "variables_get",
                                      "fields": {"VAR": {"id": "coin_var"}}
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

  test('Variable created inside when scene starts block works with click and every frame event blocks', async ({ page }) => {
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    const workspace_json = {
      "variables": [
        {"name": "myBox", "id": "myBox_var"}
      ],
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
                  "type": "variables_set",
                  "fields": {"VAR": {"id": "myBox_var"}},
                  "inputs": {
                    "VALUE": {
                      "block": {
                        "type": "create_primitive",
                        "fields": {"TYPE": "box"},
                        "inputs": {
                          "X": {"block": {"type": "math_number", "fields": {"NUM": 0}}},
                          "Y": {"block": {"type": "math_number", "fields": {"NUM": 0}}},
                          "Z": {"block": {"type": "math_number", "fields": {"NUM": 0}}}
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            "type": "event_on_click",
            "x": 10,
            "y": 200,
            "inputs": {
              "OBJECT_SELECTOR": {
                "block": {
                  "type": "variables_get",
                  "fields": {"VAR": {"id": "myBox_var"}}
                }
              },
              "DO_CODE": {
                "block": {
                  "type": "console_log",
                  "inputs": {
                    "VALUE": {
                      "block": {
                        "type": "text",
                        "fields": {"TEXT": "VARIABLE_BOX_CLICKED"}
                      }
                    }
                  }
                }
              }
            }
          },
          {
            "type": "event_every_frame",
            "x": 10,
            "y": 350,
            "inputs": {
              "OBJECT_SELECTOR": {
                "block": {
                  "type": "variables_get",
                  "fields": {"VAR": {"id": "myBox_var"}}
                }
              },
              "DO_CODE": {
                "block": {
                  "type": "console_log",
                  "inputs": {
                    "VALUE": {
                      "block": {
                        "type": "text",
                        "fields": {"TEXT": "EVERY_FRAME_FIRED"}
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

    await page.evaluate((json) => {
      Blockly.serialization.workspaces.load(json, workspace);
      window.doRun();
    }, workspace_json);

    // Verify per frame logic fires for the variable created inside when scene starts
    await expect.poll(() => consoleMessages, { timeout: 15000 }).toContain('EVERY_FRAME_FIRED');

    // Simulate clicking the box created inside when scene starts
    await page.evaluate(() => {
      const box = Object.values(window.sceneManager.objects)[0];
      if (box && box.actionManager) {
        box.actionManager.processTrigger(BABYLON.ActionManager.OnPickTrigger);
      }
    });

    await expect.poll(() => consoleMessages, { timeout: 15000 }).toContain('VARIABLE_BOX_CLICKED');
  });

  test('Event blocks work seamlessly when passed a list/array of objects', async ({ page }) => {
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.sceneManager && window.workspace);

    // Test code generation for event_on_click with designated variable
    const generatedCode = await page.evaluate(() => {
      const block = window.workspace.newBlock('event_on_click');
      block.setFieldValue('clicked_item_var_id', 'CLICKED_ITEM');
      return javascript.javascriptGenerator.blockToCode(block);
    });
    expect(generatedCode).toContain('async function(');

    await page.evaluate(() => {
      // Direct scene test of onClick with a list of meshes
      window.clickedMeshes = [];
      window.frameMeshes = new Set();
      window.swipedMeshes = [];
      window.receivedEvents = [];

      const box1 = window.sceneManager.createBox('box1', 1, '#FF0000', 0, 0, 0);
      const box2 = window.sceneManager.createBox('box2', 1, '#00FF00', 2, 0, 0);
      const objectList = [box1, box2];

      // Test onClick with list and designated item parameter
      window.sceneManager.onClick(() => objectList, (item) => {
        window.clickedMeshes.push(item.name);
      });

      // Test everyFrame with list
      window.sceneManager.everyFrame(() => objectList, (thisMesh) => {
        window.frameMeshes.add(thisMesh.name);
      });

      // Test onSwipe with list
      window.sceneManager.onSwipe(() => objectList, 'LEFT', (thisMesh) => {
        window.swipedMeshes.push(thisMesh.name);
      });

      // Test onObjectEvent / triggerObjectEvent with list
      window.sceneManager.onObjectEvent(() => objectList, 'CUSTOM_EVT', () => {
        window.receivedEvents.push('EVT_RECEIVED');
      });

      // Simulate clicks on box1 and box2
      window.sceneManager.processPendingClickHandlers();
      box1.actionManager.processTrigger(BABYLON.ActionManager.OnPickTrigger);
      box2.actionManager.processTrigger(BABYLON.ActionManager.OnPickTrigger);

      // Simulate swipe
      window.sceneManager.triggerSwipe('LEFT');

      // Simulate object event trigger
      window.sceneManager.triggerObjectEvent(() => objectList, 'CUSTOM_EVT');
    });

    // Check click results
    const clicked = await page.evaluate(() => window.clickedMeshes);
    expect(clicked).toEqual(['box1', 'box2']);

    // Check swipe results
    const swiped = await page.evaluate(() => window.swipedMeshes);
    expect(swiped).toEqual(['box1', 'box2']);

    // Check object event results
    const events = await page.evaluate(() => window.receivedEvents);
    expect(events.length).toBe(2);

    // Check frame results
    await expect.poll(async () => {
      return await page.evaluate(() => Array.from(window.frameMeshes));
    }, { timeout: 10000 }).toEqual(expect.arrayContaining(['box1', 'box2']));
  });
});
