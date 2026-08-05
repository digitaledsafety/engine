const { test, expect } = require('@playwright/test');

test.describe('Bedrock .mcstructure Viewer Verification', () => {
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

  test('importModel detects .mcstructure and parses/creates instanced voxel meshes', async ({ page }) => {
    // 1. Static base64 representation of a valid Little-Endian NBT .mcstructure file
    const base64Buffer = 'CgAABgAOZm9ybWF0X3ZlcnNpb24/8AAAAAAAAAkABHNpemUGAAAAA0AIAAAAAAAAQAgAAAAAAABACAAAAAAAAAoACXN0cnVjdHVyZQkADWJsb2NrX2luZGljZXMJAAAAAgYAAAAbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAAAAAAA/8AAAAAAAAD/wAAAAAAAAv/AAAAAAAAC/8AAAAAAAAL/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAAAAAAC/8AAAAAAAAD/wAAAAAAAAv/AAAAAAAABAAAAAAAAAAL/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAAAAAAA/8AAAAAAAAD/wAAAAAAAAv/AAAAAAAAC/8AAAAAAAAL/wAAAAAAAABgAAABu/8AAAAAAAAL/wAAAAAAAAv/AAAAAAAAC/8AAAAAAAAL/wAAAAAAAAv/AAAAAAAAC/8AAAAAAAAL/wAAAAAAAAv/AAAAAAAAC/8AAAAAAAAL/wAAAAAAAAv/AAAAAAAAC/8AAAAAAAAL/wAAAAAAAAv/AAAAAAAAC/8AAAAAAAAL/wAAAAAAAAv/AAAAAAAAC/8AAAAAAAAL/wAAAAAAAAv/AAAAAAAAC/8AAAAAAAAL/wAAAAAAAAv/AAAAAAAAC/8AAAAAAAAL/wAAAAAAAAv/AAAAAAAAAJAAhlbnRpdGllcwAAAAAACgAHcGFsZXR0ZQoAB2RlZmF1bHQJAA1ibG9ja19wYWxldHRlCgAAAAMIAARuYW1lAA9taW5lY3JhZnQ6c3RvbmUKAAZzdGF0ZXMABgAHdmVyc2lvbkFxIKAAAAAAAAgABG5hbWUAEm1pbmVjcmFmdDpyZWRfd29vbAoABnN0YXRlcwAGAAd2ZXJzaW9uQXEgoAAAAAAACAAEbmFtZQAUbWluZWNyYWZ0OmdvbGRfYmxvY2sKAAZzdGF0ZXMABgAHdmVyc2lvbkFxIKAAAAAAAAoAE2Jsb2NrX3Bvc2l0aW9uX2RhdGEAAAAAAA==';
    const dataUri = `data:application/octet-stream;base64,${base64Buffer}`;

    // 2. Load the model using sceneManager.importModel with the .mcstructure Data URI
    await page.evaluate(async (uri) => {
      await window.sceneManager.importModel('testVoxelModel.mcstructure', uri, 0, 0, 0);
    }, dataUri);

    // 3. Verify the wrapper mesh, instanced sub-meshes, and block colors are created successfully
    const result = await page.evaluate(() => {
      const model = window.sceneManager.objects['testVoxelModel.mcstructure'];
      if (!model) return { found: false };

      const descendants = model.getDescendants(false);
      // We expect 3 base meshes created (stone, red_wool, and gold_block) and their corresponding instances
      const baseCubes = descendants.filter(m => m.name.startsWith('baseCube_'));
      const instances = descendants.filter(m => m.name.startsWith('block_'));

      // Check materials / colors
      const stoneCube = baseCubes.find(m => m.name.includes('stone'));
      const redCube = baseCubes.find(m => m.name.includes('red_wool'));
      const goldCube = baseCubes.find(m => m.name.includes('gold_block'));

      const stoneColorHex = stoneCube && stoneCube.material ? stoneCube.material.diffuseColor.toHexString() : null;
      const redColorHex = redCube && redCube.material ? redCube.material.diffuseColor.toHexString() : null;
      const goldColorHex = goldCube && goldCube.material ? goldCube.material.diffuseColor.toHexString() : null;

      return {
        found: true,
        descendantsCount: descendants.length,
        baseCubesCount: baseCubes.length,
        instancesCount: instances.length,
        stoneColorHex,
        redColorHex,
        goldColorHex,
        logicalRoot: model.metadata ? model.metadata.logicalRoot : null
      };
    });

    expect(result.found).toBe(true);
    expect(result.baseCubesCount).toBe(3);
    expect(result.instancesCount).toBe(18); // 9 stone + 8 red_wool + 1 gold_block = 18 total active blocks!
    // Standard Stone color is '#737373'
    expect(result.stoneColorHex).toBe('#737373');
    // Standard Red Wool color is '#B02E26'
    expect(result.redColorHex).toBe('#B02E26');
    // Standard Gold Block color is '#FCE251'
    expect(result.goldColorHex).toBe('#FCE251');
    expect(result.logicalRoot).toBe('testVoxelModel.mcstructure');
  });
});
