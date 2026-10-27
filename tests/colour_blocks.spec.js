const { test, expect } = require('@playwright/test');

test.describe('Colour Blocks Generator and Runtime Evaluation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('colour_picker block generates valid hex string', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const workspace = window.workspace;
      workspace.clear();

      const block = workspace.newBlock('colour_picker');
      block.setFieldValue('#ff0000', 'COLOUR');

      const fullCode = Blockly.JavaScript.workspaceToCode(workspace);
      const codeArr = Blockly.JavaScript.blockToCode(block);

      return {
        generatedCode: Array.isArray(codeArr) ? codeArr[0] : codeArr,
        value: eval(Array.isArray(codeArr) ? codeArr[0] : codeArr)
      };
    });

    expect(result.generatedCode).toBe("'#ff0000'");
    expect(result.value).toBe('#ff0000');
  });

  test('colour_random block generates random hex string using .slice(-6)', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const workspace = window.workspace;
      workspace.clear();

      const block = workspace.newBlock('colour_random');
      const fullCode = Blockly.JavaScript.workspaceToCode(workspace);

      let evaluatedColor;
      await window.doRun(fullCode + '\nwindow.testColorResult = colourRandom();');
      evaluatedColor = window.testColorResult;

      return {
        fullCode: fullCode,
        evaluatedColor: evaluatedColor
      };
    });

    expect(result.fullCode).toContain('.slice(-6)');
    expect(result.fullCode).not.toContain('.substr(');
    expect(result.evaluatedColor).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test('colour_rgb block generates hex color from RGB inputs', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const workspace = window.workspace;
      workspace.clear();

      const block = workspace.newBlock('colour_rgb');

      const rBlock = workspace.newBlock('math_number');
      rBlock.setFieldValue('100', 'NUM');
      block.getInput('RED').connection.connect(rBlock.outputConnection);

      const gBlock = workspace.newBlock('math_number');
      gBlock.setFieldValue('0', 'NUM');
      block.getInput('GREEN').connection.connect(gBlock.outputConnection);

      const bBlock = workspace.newBlock('math_number');
      bBlock.setFieldValue('100', 'NUM');
      block.getInput('BLUE').connection.connect(bBlock.outputConnection);

      const fullCode = Blockly.JavaScript.workspaceToCode(workspace);

      await window.doRun(fullCode + '\nwindow.testRgbResult = colourRgb(100, 0, 100);');

      return {
        fullCode: fullCode,
        evaluatedColor: window.testRgbResult
      };
    });

    expect(result.evaluatedColor).toBe('#ff00ff');
  });

  test('colour_blend block generates blended hex color from two inputs', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const workspace = window.workspace;
      workspace.clear();

      const block = workspace.newBlock('colour_blend');

      const c1Block = workspace.newBlock('colour_picker');
      c1Block.setFieldValue('#ff0000', 'COLOUR');
      block.getInput('COLOUR1').connection.connect(c1Block.outputConnection);

      const c2Block = workspace.newBlock('colour_picker');
      c2Block.setFieldValue('#0000ff', 'COLOUR');
      block.getInput('COLOUR2').connection.connect(c2Block.outputConnection);

      const ratioBlock = workspace.newBlock('math_number');
      ratioBlock.setFieldValue('0.5', 'NUM');
      block.getInput('RATIO').connection.connect(ratioBlock.outputConnection);

      const fullCode = Blockly.JavaScript.workspaceToCode(workspace);

      await window.doRun(fullCode + '\nwindow.testBlendResult = colourBlend("#ff0000", "#0000ff", 0.5);');

      return {
        fullCode: fullCode,
        evaluatedColor: window.testBlendResult
      };
    });

    expect(result.evaluatedColor).toBe('#800080');
  });
});
