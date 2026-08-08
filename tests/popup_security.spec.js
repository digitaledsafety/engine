const { test, expect } = require('@playwright/test');

test.describe('Engine Popup Security Validation', () => {
  test('Popup creation and dynamic update sanitize image URLs', async ({ page }) => {
    await page.goto('/');
    await page.click("#start-button");

    const result = await page.evaluate(async () => {
        const workspace = window.workspace;
        workspace.clear();
        workspace.clearUndo();

        const securePopupVar = workspace.createVariable('securePopup');
        const insecurePopupVar = workspace.createVariable('insecurePopup');
        const protocolRelativePopupVar = workspace.createVariable('protocolRelativePopup');

        // Case 1: Create a popup with an INSECURE image URL
        const createInsecureBlock = workspace.newBlock('create_popup');
        const insecureTitleText = workspace.newBlock('text');
        insecureTitleText.setFieldValue('Insecure Popup', 'TEXT');
        createInsecureBlock.getInput('TITLE').connection.connect(insecureTitleText.outputConnection);

        const insecureUrlText = workspace.newBlock('text');
        insecureUrlText.setFieldValue('http://tracking-pixel.com/image.png', 'TEXT');
        createInsecureBlock.getInput('IMAGE').connection.connect(insecureUrlText.outputConnection);

        const setInsecureVarBlock = workspace.newBlock('variables_set');
        setInsecureVarBlock.setFieldValue(insecurePopupVar.getId(), 'VAR');
        setInsecureVarBlock.getInput('VALUE').connection.connect(createInsecureBlock.outputConnection);

        // Case 1b: Create a popup with a PROTOCOL-RELATIVE image URL
        const createProtoBlock = workspace.newBlock('create_popup');
        const protoTitleText = workspace.newBlock('text');
        protoTitleText.setFieldValue('Proto-relative Popup', 'TEXT');
        createProtoBlock.getInput('TITLE').connection.connect(protoTitleText.outputConnection);

        const protoUrlText = workspace.newBlock('text');
        protoUrlText.setFieldValue('//tracking-pixel.com/image.png', 'TEXT');
        createProtoBlock.getInput('IMAGE').connection.connect(protoUrlText.outputConnection);

        const setProtoVarBlock = workspace.newBlock('variables_set');
        setProtoVarBlock.setFieldValue(protocolRelativePopupVar.getId(), 'VAR');
        setProtoVarBlock.getInput('VALUE').connection.connect(createProtoBlock.outputConnection);
        setInsecureVarBlock.nextConnection.connect(setProtoVarBlock.previousConnection);

        // Case 2: Create a popup with a SECURE image URL
        const createSecureBlock = workspace.newBlock('create_popup');
        const secureTitleText = workspace.newBlock('text');
        secureTitleText.setFieldValue('Secure Popup', 'TEXT');
        createSecureBlock.getInput('TITLE').connection.connect(secureTitleText.outputConnection);

        const secureUrlText = workspace.newBlock('text');
        secureUrlText.setFieldValue('https://www.babylonjs.com/assets/logo.png', 'TEXT');
        createSecureBlock.getInput('IMAGE').connection.connect(secureUrlText.outputConnection);

        const setSecureVarBlock = workspace.newBlock('variables_set');
        setSecureVarBlock.setFieldValue(securePopupVar.getId(), 'VAR');
        setSecureVarBlock.getInput('VALUE').connection.connect(createSecureBlock.outputConnection);
        setProtoVarBlock.nextConnection.connect(setSecureVarBlock.previousConnection);

        // Case 3: Update secure popup with an INSECURE url dynamically
        const setPopupImageBlock = workspace.newBlock('gui_set_popup_image');
        const getSecurePopupVar = workspace.newBlock('variables_get');
        getSecurePopupVar.setFieldValue(securePopupVar.getId(), 'VAR');
        setPopupImageBlock.getInput('POPUP_NAME').connection.connect(getSecurePopupVar.outputConnection);

        const dynamicInsecureUrlText = workspace.newBlock('text');
        dynamicInsecureUrlText.setFieldValue('http://another-tracker.com/bad.jpg', 'TEXT');
        setPopupImageBlock.getInput('IMAGE_URL').connection.connect(dynamicInsecureUrlText.outputConnection);
        setSecureVarBlock.nextConnection.connect(setPopupImageBlock.previousConnection);

        // Case 4: Update secure popup with a valid HTTPS url dynamically
        const setPopupImageSecureBlock = workspace.newBlock('gui_set_popup_image');
        const getSecurePopupVar2 = workspace.newBlock('variables_get');
        getSecurePopupVar2.setFieldValue(securePopupVar.getId(), 'VAR');
        setPopupImageSecureBlock.getInput('POPUP_NAME').connection.connect(getSecurePopupVar2.outputConnection);

        const dynamicSecureUrlText = workspace.newBlock('text');
        dynamicSecureUrlText.setFieldValue('https://www.babylonjs-playground.com/textures/babylon5.png', 'TEXT');
        setPopupImageSecureBlock.getInput('IMAGE_URL').connection.connect(dynamicSecureUrlText.outputConnection);
        setPopupImageBlock.nextConnection.connect(setPopupImageSecureBlock.previousConnection);

        // Execute Workspace Code
        const code = Blockly.JavaScript.workspaceToCode(workspace);
        await window.doRun(code);

        // Verify Insecure Popup (should NOT have any image child because URL was rejected)
        const insecurePopup = window.sceneManager.uiManager.getControlByName('insecurePopup');
        const insecurePanel = insecurePopup.children[0];
        const hasInsecureImage = insecurePanel.children.some(c => c.name === 'insecurePopup_image');

        // Verify Protocol-relative Popup (should NOT have any image child because URL was rejected)
        const protoPopup = window.sceneManager.uiManager.getControlByName('protocolRelativePopup');
        const protoPanel = protoPopup.children[0];
        const hasProtoImage = protoPanel.children.some(c => c.name === 'protocolRelativePopup_image');

        // Verify Secure Popup
        const securePopup = window.sceneManager.uiManager.getControlByName('securePopup');
        const securePanel = securePopup.children[0];
        const secureImageControl = securePanel.children.find(c => c.name === 'securePopup_image');
        const secureImageSrc = secureImageControl ? secureImageControl.source : null;

        return {
            hasInsecureImage,
            hasProtoImage,
            hasSecureImage: !!secureImageControl,
            secureImageSrc
        };
    });

    // Asset sanitization assertions
    expect(result.hasInsecureImage).toBe(false);
    expect(result.hasProtoImage).toBe(false);
    expect(result.hasSecureImage).toBe(true);
    // The final state of secureImageSrc should be the secure dynamic update, and not blocked or bypassed
    expect(result.secureImageSrc).toBe("https://proxy.functions.io/?url=https%3A%2F%2Fwww.babylonjs-playground.com%2Ftextures%2Fbabylon5.png");
  });
});
