import re
import os

with open('script_content.js', 'r') as f:
    content = f.read()

def extract_class(class_name, text):
    pattern = r'class\s+' + class_name + r'\s*\{'
    match = re.search(pattern, text)
    if not match: return ""
    start_index = match.start()
    brace_count = 0
    for i in range(match.end() - 1, len(text)):
        if text[i] == '{': brace_count += 1
        elif text[i] == '}':
            brace_count -= 1
            if brace_count == 0: return text[start_index:i+1]
    return ""

def extract_function(func_name, text):
    pattern = r'function\s+' + func_name + r'\s*\('
    match = re.search(pattern, text)
    if not match: return ""
    start_index = match.start()
    brace_count = 0
    started = False
    for i in range(match.end() - 1, len(text)):
        if text[i] == '{':
            brace_count += 1
            started = True
        elif text[i] == '}':
            brace_count -= 1
            if started and brace_count == 0: return text[start_index:i+1]
    return ""

asset_manager = extract_class('AssetManager', content)
scene_manager = extract_class('BabylonSceneManager', content)
ui_manager = extract_class('UIManager', content)
project_manager = extract_class('ProjectManager', content)
custom_loading = extract_function('CustomLoadingScreen', content)
is_valid_url = extract_function('isValidAssetURL', content)

toolbox_match = re.search(r'var toolbox = (\{.*?\});', content, re.DOTALL)
toolbox_json = toolbox_match.group(1) if toolbox_match else "{}"

# Fix block extraction
blocks_start = content.find("Blockly.Blocks['asset_model']")
# We want to find where the Blockly.defineBlocksWithJsonArray([ ... ]) ends
json_array_start = content.find("Blockly.defineBlocksWithJsonArray([")
brace_count = 0
json_array_end = -1
if json_array_start != -1:
    started = False
    for i in range(json_array_start + len("Blockly.defineBlocksWithJsonArray("), len(content)):
        if content[i] == '[':
            brace_count += 1
            started = True
        elif content[i] == ']':
            brace_count -= 1
            if started and brace_count == 0:
                # found end of array, now find end of function call
                json_array_end = content.find(')', i) + 1
                break

# Now generators
gen_start = json_array_end
gen_end = content.find("// Convert Blockly Code to JavaScript")
blocks_code = content[blocks_start:gen_end] if blocks_start != -1 and gen_end != -1 else ""

with open('assets/js/engine-core.js', 'w') as f:
    f.write('export ' + custom_loading + '\n\n')
    f.write('CustomLoadingScreen.prototype.displayLoadingUI = function (container) {\n    var loadingDiv = document.createElement("div");\n    loadingDiv.id = "customLoadingScreen";\n    const canvasContainer = container || document.querySelector(".canvas-container");\n    if (canvasContainer) {\n        loadingDiv.style.position = "absolute";\n        loadingDiv.style.top = "0";\n        loadingDiv.style.left = "0";\n        loadingDiv.style.width = "100%";\n        loadingDiv.style.height = "100%";\n        loadingDiv.style.backgroundColor = this.loadingUIBackgroundColor;\n        loadingDiv.style.color = this.loadingUITextColor;\n        loadingDiv.style.fontSize = "30px";\n        loadingDiv.style.display = "flex";\n        loadingDiv.style.justifyContent = "center";\n        loadingDiv.style.alignItems = "center";\n        loadingDiv.style.zIndex = "1001";\n        loadingDiv.innerHTML = this.loadingUIText;\n        canvasContainer.appendChild(loadingDiv);\n        this._loadingDiv = loadingDiv;\n    } else { console.error("Canvas container not found for loading screen."); }\n};\n\n')
    f.write('CustomLoadingScreen.prototype.hideLoadingUI = function () {\n    if (this._loadingDiv) {\n        this._loadingDiv.parentNode.removeChild(this._loadingDiv);\n        this._loadingDiv = null;\n    }\n};\n\n')
    f.write('export ' + is_valid_url + '\n\n')
    f.write('export ' + asset_manager + '\n\n')
    sm = scene_manager.replace('constructor(canvas) {', 'constructor(canvas, options = {}) {\n        this.container = options.container || document.body;')
    sm = sm.replace("document.getElementById('joystick-zone')", "this.container.querySelector('#joystick-zone')")
    sm = sm.replace("document.querySelectorAll('.interactive-ui')", "this.container.querySelectorAll('.interactive-ui')")
    sm = sm.replace("document.querySelector('.canvas-container')", "this.container.querySelector('.canvas-container')")
    f.write('export ' + sm + '\n\n')
    f.write('export ' + ui_manager + '\n')

with open('assets/js/project-manager.js', 'w') as f:
    pm = project_manager
    logic = """
            const workspaceState = Blockly.serialization.workspaces.save(this.workspace);
            const generatedCode = javascript.javascriptGenerator.workspaceToCode(this.workspace);
            const assets = await this.assetManager.getAllAssets();
            const serializableAssets = [];
            for (const asset of assets) {
                let d;
                if (asset.data instanceof Blob) d = await this._blobToBase64(asset.data);
                else if (asset.data instanceof ArrayBuffer) d = this._arrayBufferToBase64(asset.data);
                else continue;
                serializableAssets.push({ name: asset.name, type: asset.type, data: d });
            }
            const projectData = { workspace: workspaceState, code: generatedCode, assets: serializableAssets, version: '1.1' };"""
    pm = re.sub(r'// 1\. Get Workspace Data.*?// 3\. Combine into a project object.*?};', logic, pm, flags=re.DOTALL)
    f.write('export ' + pm + '\n')

with open('assets/js/toolbox.js', 'w') as f:
    f.write('export const toolbox = ' + toolbox_json + ';\n')

with open('assets/js/blocks.js', 'w') as f:
    f.write('export const registerBlocks = (Blockly, assetHelpers) => {\n')
    f.write('    const { getModelAssets, getAudioAssets, getImageAssets } = assetHelpers;\n')
    f.write(blocks_code)
    f.write('\n};\n')
