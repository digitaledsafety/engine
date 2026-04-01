const { test, expect } = require('@playwright/test');

test.describe('Engine Popup with Variables', () => {
  test('Popup creation and variable manipulation works', async ({ page }) => {
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
        titleTextBlock.setFieldValue('My Popup Title', 'TEXT');
        createPopupBlock.getInput('TITLE').connection.connect(titleTextBlock.outputConnection);
        const button1TextBlock = workspace.newBlock('text');
        button1TextBlock.setFieldValue('My Button 1', 'TEXT');
        createPopupBlock.getInput('BUTTON1_TEXT').connection.connect(button1TextBlock.outputConnection);
        const button1NameBlock = workspace.newBlock('text');
        button1NameBlock.setFieldValue('myButton1', 'TEXT');
        createPopupBlock.getInput('BUTTON1_NAME').connection.connect(button1NameBlock.outputConnection);

        // Add image initially
        const initialImageBlock = workspace.newBlock('text');
        initialImageBlock.setFieldValue('https://www.babylonjs.com/assets/logo.png', 'TEXT');
        createPopupBlock.getInput('IMAGE').connection.connect(initialImageBlock.outputConnection);

        // Block: variables_set
        const setVarBlock = workspace.newBlock('variables_set');
        setVarBlock.setFieldValue(newPopupVar.getId(), 'VAR');
        setVarBlock.getInput('VALUE').connection.connect(createPopupBlock.outputConnection);

        // Block: show_popup
        const showPopupBlock = workspace.newBlock('show_popup');
        const getVarBlockShow = workspace.newBlock('variables_get');
        getVarBlockShow.setFieldValue(newPopupVar.getId(), 'VAR');
        showPopupBlock.getInput('NAME').connection.connect(getVarBlockShow.outputConnection);
        setVarBlock.nextConnection.connect(showPopupBlock.previousConnection);

        // Block: gui_set_popup_title
        const setTitleBlock = workspace.newBlock('gui_set_popup_title');
        const getVarForTitle = workspace.newBlock('variables_get');
        getVarForTitle.setFieldValue(newPopupVar.getId(), 'VAR');
        const newTitleTextBlock = workspace.newBlock('text');
        newTitleTextBlock.setFieldValue('New Title', 'TEXT');
        setTitleBlock.getInput('POPUP_NAME').connection.connect(getVarForTitle.outputConnection);
        setTitleBlock.getInput('TITLE').connection.connect(newTitleTextBlock.outputConnection);
        showPopupBlock.nextConnection.connect(setTitleBlock.previousConnection);

        // Block: gui_set_popup_button_text
        const setButtonTextBlock = workspace.newBlock('gui_set_popup_button_text');
        const getVarForButton = workspace.newBlock('variables_get');
        getVarForButton.setFieldValue(newPopupVar.getId(), 'VAR');
        const buttonNameBlock = workspace.newBlock('text');
        buttonNameBlock.setFieldValue('myButton1', 'TEXT');
        const newButtonTextBlock = workspace.newBlock('text');
        newButtonTextBlock.setFieldValue('New Button Text', 'TEXT');
        setButtonTextBlock.getInput('POPUP_NAME').connection.connect(getVarForButton.outputConnection);
        setButtonTextBlock.getInput('BUTTON_NAME').connection.connect(buttonNameBlock.outputConnection);
        setButtonTextBlock.getInput('TEXT').connection.connect(newButtonTextBlock.outputConnection);
        setTitleBlock.nextConnection.connect(setButtonTextBlock.previousConnection);

        // Block: gui_set_popup_image
        const setImageBlock = workspace.newBlock('gui_set_popup_image');
        const getVarForImage = workspace.newBlock('variables_get');
        getVarForImage.setFieldValue(newPopupVar.getId(), 'VAR');
        const imageUrlBlock = workspace.newBlock('text');
        imageUrlBlock.setFieldValue('https://www.babylonjs-playground.com/textures/babylon5.png', 'TEXT');
        setImageBlock.getInput('POPUP_NAME').connection.connect(getVarForImage.outputConnection);
        setImageBlock.getInput('IMAGE_URL').connection.connect(imageUrlBlock.outputConnection);
        setButtonTextBlock.nextConnection.connect(setImageBlock.previousConnection);

        // Execute
        const code = Blockly.JavaScript.workspaceToCode(workspace);
        await window.doRun(code);

        // Verify state
        const popup = window.sceneManager.uiManager.getControlByName('myPopup');
        const isVisible = popup.isVisible;

        const panel = popup.children[0];
        const titleControl = panel.children.find(c => c.name === 'myPopup_title');
        const title = titleControl.text;

        const buttonControl = panel.children.find(c => c.name === 'myButton1');
        const buttonText = buttonControl.textBlock.text;

        const imageControl = panel.children.find(c => c.name === 'myPopup_image');
        const imageSource = imageControl.source;

        return { isVisible, title, buttonText, imageSource };
    });

    expect(result.isVisible).toBe(true);
    expect(result.title).toBe("New Title");
    expect(result.buttonText).toBe("New Button Text");
    expect(result.imageSource).toBe("https://www.babylonjs-playground.com/textures/babylon5.png");

    // Part 2: Hide the popup
    const isHidden = await page.evaluate(async () => {
        const workspace = window.workspace;
        // Do NOT clear workspace here as it might lose the variable ID mapping if we recreate it wrongly
        const myPopupVar = workspace.getVariable('myPopup');

        const hidePopupBlock = workspace.newBlock('hide_popup');
        const getVarBlockHide = workspace.newBlock('variables_get');
        getVarBlockHide.setFieldValue(myPopupVar.getId(), 'VAR');
        hidePopupBlock.getInput('NAME').connection.connect(getVarBlockHide.outputConnection);

        const code = Blockly.JavaScript.workspaceToCode(workspace);
        await window.doRun(code);

        return !window.sceneManager.uiManager.getControlByName('myPopup').isVisible;
    });

    expect(isHidden).toBe(true);
  });
});
