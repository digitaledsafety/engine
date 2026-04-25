import os
import re

os.makedirs('assets/js', exist_ok=True)

with open('_layouts/default.html', 'r') as f:
    content = f.read()

def extract_until(start_pattern, end_pattern, content):
    match = re.search(f'{start_pattern}.*?{end_pattern}', content, re.DOTALL)
    if match: return match.group(0)
    return ""

asset_manager = extract_until('class AssetManager {', 'class ProjectManager {', content).replace('class ProjectManager {', '').strip()
project_manager = extract_until('class ProjectManager {', 'var toolbox = {', content).replace('var toolbox = {', '').strip()
toolbox = extract_until('var toolbox = {', 'class BabylonSceneManager {', content).replace('class BabylonSceneManager {', '').strip()
scene_manager = extract_until('class BabylonSceneManager {', 'class UIManager {', content).replace('class UIManager {', '').strip()
ui_manager = extract_until('class UIManager {', '// Define a custom theme', content).replace('// Define a custom theme', '').strip()
blocks_part = extract_until('Blockly\.Blocks\[\'asset_model\'\] = {', '// Convert Blockly Code to JavaScript', content).replace('// Convert Blockly Code to JavaScript', '').strip()

with open('assets/js/engine-core.js', 'w') as f:
    f.write('export function CustomLoadingScreen(loadingUIText, loadingUIBackgroundColor, loadingUITextColor) {\n    this.loadingUIText = loadingUIText || "Loading...";\n    this.loadingUIBackgroundColor = loadingUIBackgroundColor || "black";\n    this.loadingUITextColor = loadingUITextColor || "white";\n}\n'
            'CustomLoadingScreen.prototype.displayLoadingUI = function (container) {\n    var loadingDiv = document.createElement("div");\n    loadingDiv.id = "customLoadingScreen";\n    const canvasContainer = container || document.querySelector(".canvas-container");\n    if (canvasContainer) {\n        loadingDiv.style.position = "absolute";\n        loadingDiv.style.top = "0";\n        loadingDiv.style.left = "0";\n        loadingDiv.style.width = "100%";\n        loadingDiv.style.height = "100%";\n        loadingDiv.style.backgroundColor = this.loadingUIBackgroundColor;\n        loadingDiv.style.color = this.loadingUITextColor;\n        loadingDiv.style.fontSize = "30px";\n        loadingDiv.style.display = "flex";\n        loadingDiv.style.justifyContent = "center";\n        loadingDiv.style.alignItems = "center";\n        loadingDiv.style.zIndex = "1001";\n        loadingDiv.innerHTML = this.loadingUIText;\n        canvasContainer.appendChild(loadingDiv);\n        this._loadingDiv = loadingDiv;\n    } else { console.error("Canvas container not found for loading screen."); }\n};\n'
            'CustomLoadingScreen.prototype.hideLoadingUI = function () {\n    if (this._loadingDiv) {\n        this._loadingDiv.parentNode.removeChild(this._loadingDiv);\n        this._loadingDiv = null;\n    }\n};\n'
            'export function isValidAssetURL(url) {\n    if (typeof url !== "string" || (!url.trim().toLowerCase().startsWith("https://") && !url.trim().toLowerCase().startsWith("blob:"))) {\n        console.error("Invalid URL:", url, "Only HTTPS or blob URLs are allowed for assets.");\n        return false;\n    }\n    return true;\n}\n')
    f.write('export ' + asset_manager + '\n')
    sm = scene_manager.replace('constructor(canvas) {', 'constructor(canvas, options = {}) {\n        this.container = options.container || document.body;')
    sm = sm.replace("document.getElementById('joystick-zone')", "this.container.querySelector('#joystick-zone')")
    sm = sm.replace("document.querySelectorAll('.interactive-ui')", "this.container.querySelectorAll('.interactive-ui')")
    sm = sm.replace("document.querySelector('.canvas-container')", "this.container.querySelector('.canvas-container')")
    f.write('export ' + sm + '\n')
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
    f.write('export ' + toolbox.replace('var toolbox', 'const toolbox') + '\n')

with open('assets/js/blocks.js', 'w') as f:
    f.write('export const registerBlocks = (Blockly, assetHelpers) => {\n'
            '    const { getModelAssets, getAudioAssets, getImageAssets } = assetHelpers;\n')
    f.write(blocks_part)
    f.write('\n    Blockly.defineBlocksWithJsonArray(blocks);\n};')

with open('assets/js/embed.js', 'w') as f:
    f.write("""import { CustomLoadingScreen, AssetManager, BabylonSceneManager, UIManager } from './engine-core.js';
class CreativeEngineEmbed extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this.sceneManager = null; this.assetManager = new AssetManager(); }
    static get observedAttributes() { return ['src', 'width', 'height', 'autoplay', 'muted']; }
    connectedCallback() { this.render(); if (this.hasAttribute('autoplay')) this.initEngine(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue === newValue) return; if (this.sceneManager && (name === 'width' || name === 'height')) this.updateSize(); }
    render() {
        const width = this.getAttribute('width') || '100%'; const height = this.getAttribute('height') || '400px';
        this.shadowRoot.innerHTML = `
            <style>:host { display: block; position: relative; width: ${width}; height: ${height}; overflow: hidden; background: #000; font-family: system-ui, sans-serif; }
            .container { width: 100%; height: 100%; position: relative; }
            canvas { width: 100%; height: 100%; display: block; }
            .overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.5); color: white; cursor: pointer; z-index: 10; }
            .remix-badge { position: absolute; bottom: 10px; right: 10px; background: rgba(0, 123, 255, 0.8); color: white; padding: 4px 12px; border-radius: 20px; text-decoration: none; font-size: 12px; font-weight: bold; z-index: 20; display: flex; align-items: center; gap: 6px; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2); }
            #joystick-zone { position: absolute; top: 0; left: 0; width: 50%; height: 100%; z-index: 15; }</style>
            <div class="container"><div id="joystick-zone"></div><canvas id="gameCanvas"></canvas>
            ${!this.hasAttribute('autoplay') ? '<div class="overlay" id="startOverlay">Click to Start</div>' : ''}
            <a href="${this.getAttribute('src')}" target="_blank" class="remix-badge">Remix</a></div>`;
        if (!this.hasAttribute('autoplay')) { this.shadowRoot.getElementById('startOverlay').addEventListener('click', () => { this.shadowRoot.getElementById('startOverlay').style.display = 'none'; this.initEngine(); }); }
    }
    updateSize() { if (this.sceneManager) this.sceneManager.engine.resize(); }
    async initEngine() {
        const canvas = this.shadowRoot.getElementById('gameCanvas');
        this.sceneManager = new BabylonSceneManager(canvas, { container: this.shadowRoot });
        const src = this.getAttribute('src'); if (!src) return;
        try {
            const response = await fetch(src); const text = await response.text();
            let projectData;
            if (text.startsWith('---')) {
                const match = text.match(/workspace_data:\\s*"([^"]+)"/);
                if (match) projectData = JSON.parse(atob(match[1]));
            } else projectData = JSON.parse(text);
            if (projectData && projectData.code) {
                if (projectData.assets) {
                    for (const asset of projectData.assets) {
                        const data = this._base64ToBlob(asset.data, asset.type);
                        await this.assetManager.addAsset(new File([data], asset.name, { type: asset.type }));
                    }
                }
                const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                const userGeneratedCode = new AsyncFunction('sceneManager', 'assetManager', projectData.code);
                await userGeneratedCode(this.sceneManager, this.assetManager);
                if (this.hasAttribute('muted') && this.sceneManager.audioEngine) this.sceneManager.audioEngine.setGlobalVolume(0);
            }
        } catch (e) { console.error('Failed to load project:', e); }
    }
    _base64ToBlob(b64Data, contentType = '', sliceSize = 512) {
        const byteCharacters = atob(b64Data); const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
            byteArrays.push(new Uint8Array(byteNumbers));
        }
        return new Blob(byteArrays, { type: contentType });
    }
}
customElements.define('creative-engine', CreativeEngineEmbed);
""")
