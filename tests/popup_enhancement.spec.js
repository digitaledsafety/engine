const { test, expect } = require('@playwright/test');

test.describe('Engine Popup Text Enhancement', () => {
  test('Popup creation with text and setPopupText works', async ({ page }) => {
    await page.goto('/');
    await page.click("#start-button");

    const result = await page.evaluate(async () => {
        const workspace = window.workspace;
        workspace.clear();
        workspace.clearUndo();

        const newPopupVar = workspace.createVariable('myPopup');

        // Block: create_popup
        const createPopupBlock = workspace.newBlock('create_popup');
        const titleTextBlock = workspace.newBlock('text');
        titleTextBlock.setFieldValue('My Title', 'TEXT');
        createPopupBlock.getInput('TITLE').connection.connect(titleTextBlock.outputConnection);

        const mainTextBlock = workspace.newBlock('text');
        mainTextBlock.setFieldValue('Initial Text', 'TEXT');
        createPopupBlock.getInput('TEXT').connection.connect(mainTextBlock.outputConnection);

        // Block: variables_set
        const setVarBlock = workspace.newBlock('variables_set');
        setVarBlock.setFieldValue(newPopupVar.getId(), 'VAR');
        setVarBlock.getInput('VALUE').connection.connect(createPopupBlock.outputConnection);

        // Block: gui_set_popup_text
        const setPopupTextBlock = workspace.newBlock('gui_set_popup_text');
        const getVarForText = workspace.newBlock('variables_get');
        getVarForText.setFieldValue(newPopupVar.getId(), 'VAR');
        const updatedTextBlock = workspace.newBlock('text');
        updatedTextBlock.setFieldValue('Updated Text', 'TEXT');
        setPopupTextBlock.getInput('POPUP_NAME').connection.connect(getVarForText.outputConnection);
        setPopupTextBlock.getInput('TEXT').connection.connect(updatedTextBlock.outputConnection);
        setVarBlock.nextConnection.connect(setPopupTextBlock.previousConnection);

        // Execute
        const code = javascript.javascriptGenerator.workspaceToCode(workspace);
        await window.doRun(code);

        // Verify state
        const popup = window.sceneManager.uiManager.getControlByName('myPopup');
        const panel = popup.children[0];
        const textControl = panel.children.find(c => c.name === 'myPopup_text');

        return { text: textControl.text };
    });

    expect(result.text).toBe("Updated Text");
  });
});
