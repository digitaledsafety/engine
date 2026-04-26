import { AssetManager, BabylonSceneManager } from './engine-core.mjs';

class CreativeEngineEmbed extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.sceneManager = null;
        this.assetManager = new AssetManager();
    }

    static get observedAttributes() {
        return ['src', 'autoplay', 'muted', 'show-stats', 'width', 'height'];
    }

    connectedCallback() {
        this.render();
        if (this.hasAttribute('autoplay')) {
            this.initEngine();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (this.sceneManager && (name === 'width' || name === 'height')) {
            this.style.width = this.getAttribute('width') || '100%';
            this.style.height = this.getAttribute('height') || '400px';
            this.sceneManager.engine.resize();
        }
    }

    render() {
        const width = this.getAttribute('width') || '100%';
        const height = this.getAttribute('height') || '400px';
        this.style.width = width;
        this.style.height = height;
        this.style.display = 'block';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    overflow: hidden;
                    background: #000;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                .container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }
                canvas {
                    width: 100%;
                    height: 100%;
                    display: block;
                    outline: none;
                }
                .overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: rgba(0,0,0,0.6);
                    color: white;
                    cursor: pointer;
                    z-index: 10;
                    font-size: 1.1rem;
                    font-weight: 500;
                    letter-spacing: 0.05em;
                    transition: background 0.3s;
                }
                .overlay:hover {
                    background: rgba(0,0,0,0.4);
                }
                .remix-badge {
                    position: absolute;
                    bottom: 12px;
                    right: 12px;
                    background: #007bff;
                    color: white;
                    padding: 6px 14px;
                    border-radius: 100px;
                    text-decoration: none;
                    font-size: 12px;
                    font-weight: 600;
                    z-index: 20;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    transition: transform 0.2s, background 0.2s;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .remix-badge:hover {
                    background: #0056b3;
                    transform: translateY(-1px);
                }
                .fullscreen-toggle {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: rgba(0, 0, 0, 0.5);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    width: 32px;
                    height: 32px;
                    cursor: pointer;
                    z-index: 20;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 16px;
                    transition: background 0.2s;
                }
                .fullscreen-toggle:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                #joystick-zone {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 50%;
                    height: 100%;
                    z-index: 15;
                    pointer-events: none;
                }
            </style>
            <div class="container">
                <div id="joystick-zone"></div>
                <canvas id="gameCanvas"></canvas>
                ${!this.hasAttribute('autoplay') ? '<div class="overlay" id="startOverlay">PLAY PROJECT</div>' : ''}
                <button class="fullscreen-toggle" id="fsToggle" title="Toggle Fullscreen">⛶</button>
                <a href="${this.getAttribute('src')}" target="_blank" class="remix-badge">Remix</a>
            </div>
        `;

        if (!this.hasAttribute('autoplay')) {
            this.shadowRoot.getElementById('startOverlay').addEventListener('click', () => {
                this.shadowRoot.getElementById('startOverlay').style.display = 'none';
                this.initEngine();
            });
        }

        this.shadowRoot.getElementById('fsToggle').addEventListener('click', () => {
            const container = this.shadowRoot.querySelector('.container');
            if (!document.fullscreenElement) {
                container.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }

    async initEngine() {
        if (this.sceneManager) return;
        const canvas = this.shadowRoot.getElementById('gameCanvas');
        this.sceneManager = new BabylonSceneManager(canvas, { container: this.shadowRoot });
        const src = this.getAttribute('src');
        if (!src) return;

        try {
            const response = await fetch(src);
            const text = await response.text();
            let projectData;

            if (text.startsWith('---')) {
                const match = text.match(/workspace_data:\s*"([^"]+)"/);
                if (match) {
                    projectData = JSON.parse(atob(match[1]));
                }
            } else {
                projectData = JSON.parse(text);
            }

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

                if (this.hasAttribute('muted') && this.sceneManager.audioEngine) {
                    this.sceneManager.audioEngine.setGlobalVolume(0);
                }
            }
        } catch (e) {
            console.error('Failed to load project:', e);
        }
    }

    _base64ToBlob(b64Data, contentType = '', sliceSize = 512) {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }
        return new Blob(byteArrays, { type: contentType });
    }
}

customElements.define('creative-engine', CreativeEngineEmbed);
