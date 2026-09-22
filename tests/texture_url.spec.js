const { test, expect } = require('@playwright/test');

test.describe('Texture From URL Block & Method Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    await page.click('#preview-tab');
  });

  test('setTextureFromUrl applies texture when given a valid safe URL', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Create a test box mesh
      window.sceneManager.createBox('testTextureBox', 0, 0, 0);

      // Valid 1x1 data URI image
      const safeDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const texture = await window.sceneManager.setTextureFromUrl('testTextureBox', safeDataUrl);

      const mesh = window.sceneManager.objects['testTextureBox'];
      const hasTexture = !!mesh && !!mesh.material && !!mesh.material.diffuseTexture;

      return {
        meshFound: !!mesh,
        hasTexture,
        returnedTexture: !!texture
      };
    });

    expect(result.meshFound).toBe(true);
    expect(result.hasTexture).toBe(true);
    expect(result.returnedTexture).toBe(true);
  });

  test('setTextureFromUrl rejects insecure and invalid URLs', async ({ page }) => {
    const result = await page.evaluate(async () => {
      window.sceneManager.createBox('securityBox', 0, 0, 0);

      const resHttp = await window.sceneManager.setTextureFromUrl('securityBox', 'http://insecure.example.com/image.png');
      const resJs = await window.sceneManager.setTextureFromUrl('securityBox', 'javascript:alert(1)');
      const resProtocolRelative = await window.sceneManager.setTextureFromUrl('securityBox', '//malicious.com/image.png');

      const mesh = window.sceneManager.objects['securityBox'];
      const hasTexture = !!mesh && !!mesh.material && !!mesh.material.diffuseTexture;

      return {
        resHttp,
        resJs,
        resProtocolRelative,
        hasTexture
      };
    });

    expect(result.resHttp).toBeNull();
    expect(result.resJs).toBeNull();
    expect(result.resProtocolRelative).toBeNull();
    expect(result.hasTexture).toBe(false);
  });

  test('set_texture_from_url block exists and generates valid JavaScript code', async ({ page }) => {
    const result = await page.evaluate(() => {
      const blockExists = !!window.Blockly.Blocks['set_texture_from_url'];

      // Instantiate block in workspace and generate code
      const block = window.workspace.newBlock('set_texture_from_url');
      const code = window.javascript.javascriptGenerator.blockToCode(block);

      return {
        blockExists,
        code: Array.isArray(code) ? code[0] : code
      };
    });

    expect(result.blockExists).toBe(true);
    expect(result.code).toContain('await sceneManager.setTextureFromUrl(');
  });
});
