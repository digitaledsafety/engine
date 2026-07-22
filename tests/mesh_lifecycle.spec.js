const { test, expect } = require('@playwright/test');

test.describe('Mesh Lifecycle and Resource Cleanup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Handle the hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    // Switch to preview tab so we can run and verify Babylon changes
    await page.click('#preview-tab');
  });

  test('Re-creating primitive with same name disposes old mesh', async ({ page }) => {
    // 1. Create a box named 'testBox'
    await page.evaluate(() => {
      window.sceneManager.createBox('testBox', 0, 0, 0);
    });

    const boxCreated = await page.evaluate(() => {
      const mesh = window.sceneManager.objects['testBox'];
      return !!mesh && !mesh.isDisposed();
    });
    expect(boxCreated).toBe(true);

    // Keep track of the internal unique id of the first box
    const oldUniqueId = await page.evaluate(() => {
      return window.sceneManager.objects['testBox'].uniqueId;
    });

    // 2. Create another box named 'testBox' at a different position
    await page.evaluate(() => {
      window.sceneManager.createBox('testBox', 1, 2, 3);
    });

    // Verify the second box is created and has a new unique id
    const newUniqueId = await page.evaluate(() => {
      return window.sceneManager.objects['testBox'].uniqueId;
    });
    expect(newUniqueId).not.toBe(oldUniqueId);

    // Verify the old box is disposed in Babylon.js scene
    const isOldDisposed = await page.evaluate((id) => {
      const mesh = window.sceneManager.scene.getMeshByUniqueId(id);
      return !mesh || mesh.isDisposed();
    }, oldUniqueId);
    expect(isOldDisposed).toBe(true);
  });

  test('Disposing/re-creating mesh cleans up associated perFrameFunctions', async ({ page }) => {
    // 1. Create a sphere named 'testSphere' and register an everyFrame callback
    await page.evaluate(() => {
      window.sceneManager.createSphere('testSphere', 0, 0, 0);
      window.sceneManager.everyFrame('testSphere', () => {
        // dummy callback
      });
    });

    // Verify there is exactly 1 perFrameFunction registered
    let perFrameCount = await page.evaluate(() => {
      return window.sceneManager.perFrameFunctions.length;
    });
    expect(perFrameCount).toBe(1);

    // 2. Re-create 'testSphere', which should trigger _cleanupExisting and destroyObject,
    // which in turn should filter out the old task from perFrameFunctions!
    await page.evaluate(() => {
      window.sceneManager.createSphere('testSphere', 2, 2, 2);
    });

    // Verify that the task array was filtered, meaning the count went back to 0
    // (since the old sphere task was removed and no new task was registered yet!)
    perFrameCount = await page.evaluate(() => {
      return window.sceneManager.perFrameFunctions.length;
    });
    expect(perFrameCount).toBe(0);
  });

  test('importModel tags the wrapper and all nested meshes with logicalRoot', async ({ page }) => {
    await page.evaluate(async () => {
      // Mock ImportMeshAsync
      const originalImportMeshAsync = BABYLON.SceneLoader.ImportMeshAsync;
      BABYLON.SceneLoader.ImportMeshAsync = async () => {
        const root = new BABYLON.Mesh("importedRoot", window.sceneManager.scene);
        const child1 = new BABYLON.Mesh("child1", window.sceneManager.scene);
        child1.parent = root;
        return {
          meshes: [root, child1],
          animationGroups: []
        };
      };

      try {
        await window.sceneManager.importModel('testImportModel', 'data:text/plain;base64,AAAA');
      } finally {
        // Restore
        BABYLON.SceneLoader.ImportMeshAsync = originalImportMeshAsync;
      }
    });

    // Check that metadata.logicalRoot is correctly set to 'testImportModel'
    const taggingInfo = await page.evaluate(() => {
      const wrapper = window.sceneManager.objects['testImportModel'];
      if (!wrapper) return null;

      const descendants = wrapper.getDescendants(false);
      return {
        wrapperRoot: wrapper.metadata ? wrapper.metadata.logicalRoot : null,
        descendantsRoot: descendants.map(d => d.metadata ? d.metadata.logicalRoot : null)
      };
    });

    expect(taggingInfo).not.toBeNull();
    expect(taggingInfo.wrapperRoot).toBe('testImportModel');
    expect(taggingInfo.descendantsRoot).toEqual(['testImportModel', 'testImportModel']);
  });

  test('createText tags the text mesh with logicalRoot', async ({ page }) => {
    await page.evaluate(async () => {
      // Mock fetch to return some valid font data so BABYLON.MeshBuilder.CreateText succeeds
      const originalFetch = window.fetch;
      window.fetch = async () => {
        return {
          ok: true,
          json: async () => ({})
        };
      };

      // Mock BABYLON.MeshBuilder.CreateText directly to avoid font parsing dependencies
      const originalCreateText = BABYLON.MeshBuilder.CreateText;
      BABYLON.MeshBuilder.CreateText = () => {
        return new BABYLON.Mesh("textMesh", window.sceneManager.scene);
      };

      try {
        await window.sceneManager.createText('testText', 'Hello World', 'data:application/json,{}');
      } finally {
        window.fetch = originalFetch;
        BABYLON.MeshBuilder.CreateText = originalCreateText;
      }
    });

    const textTaggingInfo = await page.evaluate(() => {
      const textMesh = window.sceneManager.objects['testText'];
      if (!textMesh) return null;
      return textMesh.metadata ? textMesh.metadata.logicalRoot : null;
    });

    expect(textTaggingInfo).toBe('testText');
  });
});
