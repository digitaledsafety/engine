const { test, expect } = require('@playwright/test');

test.describe('Engine Asset Blocks Verification', () => {
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

  test('importModelAsset loads model from IndexedDB and setTexture applies texture', async ({ page }) => {
    // 1. Mock asset files and save them to IndexedDB via page.evaluate
    await page.evaluate(async () => {
      // Create a dummy model file (Blob)
      const dummyModelFile = new File(['dummy glb'], 'testModel.glb', { type: 'model/gltf-binary' });
      await window.assetManager.addAsset(dummyModelFile);

      // Create a 1x1 transparent PNG file (Blob)
      const resp = await fetch('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
      const blob = await resp.blob();
      const dummyTextureFile = new File([blob], 'testTexture.png', { type: 'image/png' });
      await window.assetManager.addAsset(dummyTextureFile);
    });

    // 2. Mock Babylon.js SceneLoader.ImportMeshAsync to simulate a successful 3D model import
    await page.evaluate(() => {
      BABYLON.SceneLoader.ImportMeshAsync = async (meshesNames, rootUrl, sceneFilename, scene) => {
        // Create a root mesh mimicking the model's structure
        const root = new BABYLON.Mesh("testModel.glb", scene);
        const child = new BABYLON.Mesh("childMesh", scene);
        child.parent = root;
        // Mock materials
        root.material = new BABYLON.StandardMaterial("rootMat", scene);
        child.material = new BABYLON.StandardMaterial("childMat", scene);
        return {
          meshes: [root, child],
          particleSystems: [],
          skeletons: [],
          animationGroups: [],
          transformNodes: [],
          geometries: [],
          lights: []
        };
      };
    });

    // 3. Run workspace code using doRun utilizing both blocks
    await page.evaluate(async () => {
      const code = `
        var myModel = await sceneManager.importModelAsset('testModel.glb', assetManager);
        await sceneManager.setTexture('testModel.glb', 'testTexture.png', assetManager);
      `;
      await window.doRun(code);
    });

    // 4. Verify model creation and texture assignment on the canvas
    const result = await page.evaluate(() => {
      const mesh = window.sceneManager.objects['testModel.glb'];
      if (!mesh) return { error: "Mesh not found" };

      // Check if texture is assigned on the material
      const hasTexture = !!mesh.material && !!mesh.material.diffuseTexture;
      const textureName = hasTexture ? mesh.material.diffuseTexture.name : null;

      return {
        meshFound: !!mesh,
        isDisposed: mesh.isDisposed(),
        hasTexture,
        textureName
      };
    });

    expect(result.meshFound).toBe(true);
    expect(result.isDisposed).toBe(false);
    expect(result.hasTexture).toBe(true);
    expect(result.textureName).toContain('blob:'); // Object URL blob
  });

  test('playSoundAsset, importModelAsset, setTexture, and createImageFromAsset handle ArrayBuffer and Blob assets', async ({ page }) => {
    await page.evaluate(async () => {
      // Create asset with ArrayBuffer data
      const encoder = new TextEncoder();
      const abData = encoder.encode('dummy binary content').buffer;
      await window.assetManager.addAsset({
        name: 'abModel.glb',
        type: 'model/gltf-binary',
        data: abData
      });

      const audioAbData = encoder.encode('dummy audio content').buffer;
      await window.assetManager.addAsset({
        name: 'abSound.mp3',
        type: 'audio/mp3',
        data: audioAbData
      });

      const imgAbData = encoder.encode('dummy image content').buffer;
      await window.assetManager.addAsset({
        name: 'abImage.png',
        type: 'image/png',
        data: imgAbData
      });
    });

    // Mock SceneLoader and CreateStreamingSoundAsync
    await page.evaluate(() => {
      BABYLON.SceneLoader.ImportMeshAsync = async (meshesNames, rootUrl, sceneFilename, scene) => {
        const root = new BABYLON.Mesh("abModel.glb", scene);
        return { meshes: [root], particleSystems: [], skeletons: [], animationGroups: [], transformNodes: [], geometries: [], lights: [] };
      };

      BABYLON.CreateStreamingSoundAsync = async (name, url) => {
        return {
          play: () => {},
          dispose: () => {}
        };
      };
    });

    const result = await page.evaluate(async () => {
      // Test importModelAsset with ArrayBuffer
      const model = await window.sceneManager.importModelAsset('abModel.glb', window.assetManager);

      // Test setTexture with ArrayBuffer
      await window.sceneManager.setTexture('abModel.glb', 'abImage.png', window.assetManager);

      // Test playSoundAsset with ArrayBuffer
      await window.sceneManager.playSoundAsset('abSound.mp3', window.assetManager);

      // Test createImageFromAsset with ArrayBuffer
      const guiImg = await window.sceneManager.uiManager.createImageFromAsset('testGuiImg', 'abImage.png');

      const mesh = window.sceneManager.objects['abModel.glb'];
      const hasTexture = !!mesh && !!mesh.material && !!mesh.material.diffuseTexture;
      const soundCreated = window.sceneManager.sounds.length > 0;
      const guiImgCreated = !!guiImg && window.sceneManager.uiManager.controls['testGuiImg'] === guiImg;

      return {
        modelImported: !!model,
        hasTexture,
        soundCreated,
        guiImgCreated
      };
    });

    expect(result.modelImported).toBe(true);
    expect(result.hasTexture).toBe(true);
    expect(result.soundCreated).toBe(true);
    expect(result.guiImgCreated).toBe(true);
  });
});
