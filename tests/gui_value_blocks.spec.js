const { test, expect } = require('@playwright/test');

test.describe('GUI Value Blocks & Creation Blocks Conversion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    await page.click('#preview-tab');
  });

  test('GUI creation blocks generate value expressions and output control references', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const workspace = window.Blockly.getMainWorkspace();
      workspace.clear();

      // Create a text block value block
      const createTextBlock = workspace.newBlock('gui_create_text_block');
      const textVal = workspace.newBlock('text');
      textVal.setFieldValue('Hello GUI', 'TEXT');
      createTextBlock.getInput('TEXT').connection.connect(textVal.outputConnection);

      // Set variable myTextBlock = gui_create_text_block
      const setVarBlock = workspace.newBlock('variables_set');
      setVarBlock.setFieldValue(workspace.createVariable('myTextBlock').getId(), 'VAR');
      setVarBlock.getInput('VALUE').connection.connect(createTextBlock.outputConnection);

      // Create a button value block
      const createButtonBlock = workspace.newBlock('gui_create_button');
      const btnTextVal = workspace.newBlock('text');
      btnTextVal.setFieldValue('Click Me', 'TEXT');
      createButtonBlock.getInput('TEXT').connection.connect(btnTextVal.outputConnection);

      // Set variable myBtn = gui_create_button
      const setBtnVarBlock = workspace.newBlock('variables_set');
      setBtnVarBlock.setFieldValue(workspace.createVariable('myBtn').getId(), 'VAR');
      setBtnVarBlock.getInput('VALUE').connection.connect(createButtonBlock.outputConnection);

      // Connect setBtnVarBlock after setVarBlock
      setVarBlock.nextConnection.connect(setBtnVarBlock.previousConnection);

      // Set text of GUI element myTextBlock to "Updated Text"
      const setTextBlock = workspace.newBlock('gui_set_text');
      const getVarBlock = workspace.newBlock('variables_get');
      getVarBlock.setFieldValue(workspace.createVariable('myTextBlock').getId(), 'VAR');
      setTextBlock.getInput('ELEMENT').connection.connect(getVarBlock.outputConnection);

      const updatedTextVal = workspace.newBlock('text');
      updatedTextVal.setFieldValue('Updated Text', 'TEXT');
      setTextBlock.getInput('TEXT').connection.connect(updatedTextVal.outputConnection);

      setBtnVarBlock.nextConnection.connect(setTextBlock.previousConnection);

      const generatedCode = window.javascript.javascriptGenerator.workspaceToCode(workspace);

      // Execute generated code
      await window.doRun(generatedCode);

      const controlsCount = Object.keys(window.sceneManager.uiManager.controls).length;
      const textControl = window.sceneManager.uiManager.controls[Object.keys(window.sceneManager.uiManager.controls)[0]];

      return {
        generatedCode,
        controlsCount,
        hasTextControl: !!textControl,
        renderedText: textControl ? textControl.text : null
      };
    });

    expect(result.generatedCode).toContain('sceneManager.uiManager.createText');
    expect(result.generatedCode).toContain('sceneManager.uiManager.createButton');
    expect(result.generatedCode).toContain('sceneManager.uiManager.setText');
    expect(result.controlsCount).toBeGreaterThanOrEqual(2);
    expect(result.renderedText).toBe('Updated Text');
  });

  test('gui_create_input_text and gui_get_input_text work with value variables', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const workspace = window.Blockly.getMainWorkspace();
      workspace.clear();

      const createInputBlock = workspace.newBlock('gui_create_input_text');
      const setVarBlock = workspace.newBlock('variables_set');
      setVarBlock.setFieldValue(workspace.createVariable('myInput').getId(), 'VAR');
      setVarBlock.getInput('VALUE').connection.connect(createInputBlock.outputConnection);

      const generatedCode = window.javascript.javascriptGenerator.workspaceToCode(workspace);
      await window.doRun(generatedCode);

      // Programmatically set input text to test getInputText with variable reference
      const controlKey = Object.keys(window.sceneManager.uiManager.controls)[0];
      const inputCtrl = window.sceneManager.uiManager.controls[controlKey];
      inputCtrl.text = "User Input";

      const fetchedText = window.sceneManager.uiManager.getInputText(inputCtrl);

      return {
        generatedCode,
        fetchedText
      };
    });

    expect(result.generatedCode).toContain('sceneManager.uiManager.createInput');
    expect(result.fetchedText).toBe('User Input');
  });

  test('gui_create_image_from_url outputs control reference', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const workspace = window.Blockly.getMainWorkspace();
      workspace.clear();

      const createImageBlock = workspace.newBlock('gui_create_image_from_url');
      const urlText = workspace.newBlock('text');
      urlText.setFieldValue('https://cdn.digitaleducationsafety.org/assets/icons/icon-512.png', 'TEXT');
      createImageBlock.getInput('URL').connection.connect(urlText.outputConnection);

      const setVarBlock = workspace.newBlock('variables_set');
      setVarBlock.setFieldValue(workspace.createVariable('myImg').getId(), 'VAR');
      setVarBlock.getInput('VALUE').connection.connect(createImageBlock.outputConnection);

      const generatedCode = window.javascript.javascriptGenerator.workspaceToCode(workspace);
      await window.doRun(generatedCode);

      const controls = window.sceneManager.uiManager.controls;
      const keys = Object.keys(controls);

      return {
        generatedCode,
        controlCount: keys.length
      };
    });

    expect(result.generatedCode).toContain('sceneManager.uiManager.createImage');
    expect(result.controlCount).toBe(1);
  });

  test('import_model_from_asset and import_animation function as output value blocks', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const workspace = window.Blockly.getMainWorkspace();
      workspace.clear();

      // import_model_from_asset
      const importModelBlock = workspace.newBlock('import_model_from_asset');
      const assetText = workspace.newBlock('text');
      assetText.setFieldValue('duck.glb', 'TEXT');
      importModelBlock.getInput('ASSET').connection.connect(assetText.outputConnection);

      const setModelVar = workspace.newBlock('variables_set');
      setModelVar.setFieldValue(workspace.createVariable('modelVar').getId(), 'VAR');
      setModelVar.getInput('VALUE').connection.connect(importModelBlock.outputConnection);

      // import_animation
      const importAnimBlock = workspace.newBlock('import_animation');
      const urlText = workspace.newBlock('text');
      urlText.setFieldValue('https://cdn.digitaleducationsafety.org/assets/models/animations/run.fbx', 'TEXT');
      importAnimBlock.getInput('URL').connection.connect(urlText.outputConnection);

      const setAnimVar = workspace.newBlock('variables_set');
      setAnimVar.setFieldValue(workspace.createVariable('animVar').getId(), 'VAR');
      setAnimVar.getInput('VALUE').connection.connect(importAnimBlock.outputConnection);

      setModelVar.nextConnection.connect(setAnimVar.previousConnection);

      const generatedCode = window.javascript.javascriptGenerator.workspaceToCode(workspace);

      return {
        generatedCode
      };
    });

    expect(result.generatedCode).toContain('await sceneManager.importModelAsset');
    expect(result.generatedCode).toContain('await sceneManager.importAnimation');
  });
});
