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
    // 1. Create a tiny valid Little-Endian NBT .mcstructure buffer
    // using NBTify in node and passing it to the browser as base64 data URI
    const { write, NBTData } = require('nbtify');
    const data = {
      format_version: 1,
      size: [2, 1, 1],
      structure: {
        block_indices: [
          [0, 1],
          [-1, -1]
        ],
        entities: [],
        palette: {
          default: {
            block_palette: [
              { name: 'minecraft:red_wool', states: {}, version: 17959424 },
              { name: 'minecraft:blue_wool', states: {}, version: 17959424 }
            ],
            block_position_data: {}
          }
        }
      }
    };
    const buffer = await write(new NBTData(data), { endianness: 'little' });
    const base64Buffer = Buffer.from(buffer).toString('base64');
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
      // We expect 2 base meshes created (red_wool and blue_wool) and their corresponding instances
      const baseCubes = descendants.filter(m => m.name.startsWith('baseCube_'));
      const instances = descendants.filter(m => m.name.startsWith('block_'));

      // Check materials / colors
      const redCube = baseCubes.find(m => m.name.includes('red_wool'));
      const blueCube = baseCubes.find(m => m.name.includes('blue_wool'));

      const redColorHex = redCube && redCube.material ? redCube.material.diffuseColor.toHexString() : null;
      const blueColorHex = blueCube && blueCube.material ? blueCube.material.diffuseColor.toHexString() : null;

      return {
        found: true,
        descendantsCount: descendants.length,
        baseCubesCount: baseCubes.length,
        instancesCount: instances.length,
        redColorHex,
        blueColorHex,
        logicalRoot: model.metadata ? model.metadata.logicalRoot : null
      };
    });

    expect(result.found).toBe(true);
    expect(result.baseCubesCount).toBe(2);
    expect(result.instancesCount).toBe(2);
    // Standard Red Wool color from our map is '#B02E26'
    expect(result.redColorHex).toBe('#B02E26');
    // Standard Blue Wool color from our map is '#3C44AA'
    expect(result.blueColorHex).toBe('#3C44AA');
    expect(result.logicalRoot).toBe('testVoxelModel.mcstructure');
  });
});
