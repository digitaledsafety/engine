import { CustomLoadingScreen, AssetManager, BabylonSceneManager, UIManager } from './engine-core.js';
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
                const match = text.match(/workspace_data:\s*"([^"]+)"/);
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
