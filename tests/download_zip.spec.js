const { test, expect } = require('@playwright/test');

test.describe('Download ZIP Export Feature', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('/');
    // Handle the hero overlay
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('should generate and export standalone zip with correct files and assets', async ({ page }) => {
    // Wait for the hero overlay to be hidden by checking display !== 'flex' or waiting a moment
    await page.waitForTimeout(1000);

    // 1. Add some assets to IndexedDB
    await page.evaluate(async () => {
      const modelFile = new File(['dummy model data'], 'test_model.glb', { type: 'model/gltf-binary' });
      await window.assetManager.addAsset(modelFile);

      const textureFile = new File(['dummy texture data'], 'test_texture.png', { type: 'image/png' });
      await window.assetManager.addAsset(textureFile);
    });

    // 2. Clear workspace and add some blocks
    await page.evaluate(() => {
      window.workspace.clear();
      const block = window.workspace.newBlock('console_log');
      const textBlock = window.workspace.newBlock('text');
      textBlock.setFieldValue('ZIP_EXPORT_TEST_SUCCESS', 'TEXT');
      block.getInput('VALUE').connection.connect(textBlock.outputConnection);
    });

    // 3. Spy on JSZip inside page context to capture ZIP structure and file contents
    const result = await page.evaluate(async () => {
      const capturedFiles = {};

      const originalFile = JSZip.prototype.file;
      const originalFolder = JSZip.prototype.folder;

      JSZip.prototype.file = function(name, content) {
        if (typeof content === 'string') {
          capturedFiles[name] = content;
        } else {
          capturedFiles[name] = '[binary/blob]';
        }
        return originalFile.apply(this, arguments);
      };

      JSZip.prototype.folder = function(name) {
        const folderObj = originalFolder.apply(this, arguments);
        const originalFolderFile = folderObj.file;
        folderObj.file = function(fName, fContent) {
          capturedFiles[name + '/' + fName] = '[binary/blob]';
          return originalFolderFile.apply(this, arguments);
        };
        return folderObj;
      };

      // Suppress actual browser download trigger to prevent browser popup in test
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = (blob) => {
        return 'blob:mock-zip-download-url';
      };

      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function() {
        // Do nothing to prevent actual file download
      };

      // Trigger ZIP download
      await window.projectManager.downloadZip();

      // Restore original methods
      URL.createObjectURL = originalCreateObjectURL;
      HTMLAnchorElement.prototype.click = originalClick;

      return capturedFiles;
    });

    // 4. Assert ZIP structure and contents
    const fileNames = Object.keys(result);
    console.log('ZIP Exported Files:', fileNames);

    expect(fileNames).toContain('index.html');
    expect(fileNames).toContain('game.js');
    expect(fileNames).toContain('assets/test_model.glb');
    expect(fileNames).toContain('assets/test_texture.png');

    // Verify game.js wrapped starter function
    const gameJsContent = result['game.js'];
    expect(gameJsContent).toContain('window.startGame = async function(sceneManager, assetManager)');
    expect(gameJsContent).toContain('ZIP_EXPORT_TEST_SUCCESS');

    // Verify index.html contains essential canvas layout and classes
    const indexHtmlContent = result['index.html'];
    expect(indexHtmlContent).toContain('<canvas id="gameCanvas">');
    expect(indexHtmlContent).toContain('class BabylonSceneManager');
    expect(indexHtmlContent).toContain('class UIManager');
    expect(indexHtmlContent).toContain('class MockAssetManager');
    expect(indexHtmlContent).toContain('getAsset(name)');
    expect(indexHtmlContent).toContain('src="game.js"');
  });
});
