
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('{{ site.baseurl }}/sw.js').then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }


        function CustomLoadingScreen(/* variables needed, for example:*/ loadingUIText, loadingUIBackgroundColor, loadingUITextColor) {
            //init the loader
            this.loadingUIText = loadingUIText || "Loading...";
            this.loadingUIBackgroundColor = loadingUIBackgroundColor || "black";
            this.loadingUITextColor = loadingUITextColor || "white";
        }
        CustomLoadingScreen.prototype.displayLoadingUI = function () {
            var loadingDiv = document.createElement("div");
            loadingDiv.id = "customLoadingScreen";
            const canvasContainer = document.querySelector('.canvas-container');
            if (canvasContainer) {
                loadingDiv.style.position = "absolute";
                loadingDiv.style.top = "0";
                loadingDiv.style.left = "0";
                loadingDiv.style.width = "100%";
                loadingDiv.style.height = "100%";
                loadingDiv.style.backgroundColor = this.loadingUIBackgroundColor;
                loadingDiv.style.color = this.loadingUITextColor;
                loadingDiv.style.fontSize = "30px";
                loadingDiv.style.display = "flex";
                loadingDiv.style.justifyContent = "center";
                loadingDiv.style.alignItems = "center";
                loadingDiv.style.zIndex = "1001";
                loadingDiv.innerHTML = this.loadingUIText;
                canvasContainer.appendChild(loadingDiv);
                this._loadingDiv = loadingDiv;
            } else {
                console.error("Canvas container not found for loading screen.");
            }
        };
        CustomLoadingScreen.prototype.hideLoadingUI = function () {
            if (this._loadingDiv) {
                this._loadingDiv.parentNode.removeChild(this._loadingDiv);
                this._loadingDiv = null;
            }
        };

        // --- URL Sanitization ---
        function isValidAssetURL(url) {
            if (typeof url !== 'string') return false;
            const normalized = url.trim().toLowerCase();
            if (normalized.startsWith('https://') || normalized.startsWith('blob:')) {
                return true;
            }
            console.error('Invalid URL:', url, 'Only HTTPS or blob URLs are allowed for assets.');
            return false;
        }

        // --- Hero Overlay Logic ---
        document.addEventListener('DOMContentLoaded', () => {
            const heroOverlay = document.getElementById('hero-overlay');
            const startButton = document.getElementById('start-button');

            // Make sure the elements exist before adding event listeners
            if (heroOverlay && startButton) {
                startButton.addEventListener('click', () => {
                    // It's possible sceneManager is not yet initialized when the DOM is ready,
                    // so we reference it via window scope inside the click handler.
                    if (window.sceneManager && window.sceneManager.audioContext && window.sceneManager.audioContext.state === 'suspended') {
                        window.sceneManager.audioContext.resume();
                    }

                    // Trigger fullscreen if in presentation mode
                    if (document.body.classList.contains('presentation-mode')) {
                        enterPresentationMode();
                    }

                    // Hide the overlay
                    heroOverlay.classList.add('hidden');

                    // Optional: completely remove the overlay from the DOM after the transition
                    setTimeout(() => {
                        heroOverlay.style.display = 'none';
                    }, 500); // Must match the CSS transition duration
                });
            }
        });

        class AssetManager {
            constructor() {
                this.db = null;
                this.assets = [];
                this.DB_NAME = 'AssetDB';
                this.DB_VERSION = 1;
                this.OBJECT_STORE_NAME = 'assets';
                this.initPromise = null;
            }

            init() {
                if (this.initPromise) {
                    return this.initPromise;
                }

                this.initPromise = new Promise((resolve, reject) => {
                    const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;
                        if (!db.objectStoreNames.contains(this.OBJECT_STORE_NAME)) {
                            db.createObjectStore(this.OBJECT_STORE_NAME, { keyPath: 'name' });
                        }
                    };

                    request.onsuccess = (event) => {
                        this.db = event.target.result;
                        resolve();
                    };

                    request.onerror = (event) => {
                        console.error('IndexedDB error:', event.target.errorCode);
                        reject(event.target.errorCode);
                    };
                });
                return this.initPromise;
            }

            async addAsset(file) {
                await this.init();
                const data = file.type.startsWith('audio/') ? await file.arrayBuffer() : file;
                const asset = {
                    name: file.name,
                    type: file.type,
                    data: data
                };

                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([this.OBJECT_STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(this.OBJECT_STORE_NAME);
                    const request = store.put(asset);

                    request.onsuccess = () => {
                        this.assets = this.assets.filter(a => a.name !== asset.name); // Remove old version if it exists
                        this.assets.push(asset);
                        resolve();
                    };
                    request.onerror = (event) => reject(event.target.error);
                });
            }

            async addAssetFromURL(url) {
                if (!isValidAssetURL(url)) {
                    return;
                }
                const proxyUrl = `https://proxy.fxio.workers.dev/corsproxy/?apiurl=${encodeURIComponent(url)}`;
                try {
                    const response = await fetch(proxyUrl);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const blob = await response.blob();
                    const fileName = url.substring(url.lastIndexOf('/') + 1);

                    let mimeType = 'application/octet-stream';
                    const extension = fileName.split('.').pop().toLowerCase();
                    if (extension === 'glb' || extension === 'gltf') {
                        mimeType = `model/${extension}`;
                    } else if (['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
                        mimeType = `image/${extension}`;
                    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
                        mimeType = `audio/${extension}`;
                    }

                    const file = new File([blob], fileName, { type: mimeType });
                    return this.addAsset(file);
                } catch (error) {
                    console.error('Failed to fetch asset from URL:', error);
                    throw error;
                }
            }

            async getAsset(name) {
                await this.init();
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([this.OBJECT_STORE_NAME], 'readonly');
                    const store = transaction.objectStore(this.OBJECT_STORE_NAME);
                    const request = store.get(name);

                    request.onsuccess = (event) => resolve(event.target.result);
                    request.onerror = (event) => reject(event.target.error);
                });
            }

            async getAllAssets() {
                await this.init();
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([this.OBJECT_STORE_NAME], 'readonly');
                    const store = transaction.objectStore(this.OBJECT_STORE_NAME);
                    const request = store.getAll();

                    request.onsuccess = (event) => resolve(event.target.result);
                    request.onerror = (event) => reject(event.target.error);
                });
            }

            async deleteAsset(name) {
                await this.init();
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([this.OBJECT_STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(this.OBJECT_STORE_NAME);
                    const request = store.delete(name);

                    request.onsuccess = () => {
                        this.assets = this.assets.filter(asset => asset.name !== name);
                        resolve();
                    };
                    request.onerror = (event) => reject(event.target.error);
                });
            }

            async loadAssetsIntoCache() {
                await this.init();
                this.assets = await this.getAllAssets();
            }
        }

        class ProjectManager {
            constructor(assetManager, workspace, sceneManager) {
                this.assetManager = assetManager;
                this.workspace = workspace;
                this.sceneManager = sceneManager;
            }

            async saveProject() {
                try {
                    // 1. Get Workspace Data
                    const workspaceState = Blockly.serialization.workspaces.save(this.workspace);

                    // 2. Get Assets and convert to Base64
                    const assets = await this.assetManager.getAllAssets();
                    const serializableAssets = [];

                    for (const asset of assets) {
                        let dataB64;
                        if (asset.data instanceof Blob) { // For models, images
                            dataB64 = await this._blobToBase64(asset.data);
                        } else if (asset.data instanceof ArrayBuffer) { // For audio
                            dataB64 = this._arrayBufferToBase64(asset.data);
                        } else {
                            console.warn(`Asset ${asset.name} has unknown data type, skipping serialization.`);
                            continue;
                        }
                        serializableAssets.push({
                            name: asset.name,
                            type: asset.type,
                            data: dataB64
                        });
                    }

                    // 3. Combine into a project object
                    const projectData = {
                        workspace: workspaceState,
                        assets: serializableAssets,
                        version: '1.0'
                    };

                    // 4. Create and trigger download
                    const jsonString = JSON.stringify(projectData, null, 2);
                    const blob = new Blob([jsonString], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `project-${Date.now()}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    console.log('Project saved successfully!');

                } catch (error) {
                    console.error('Failed to save project:', error);
                    alert('Error saving project. See console for details.');
                }
            }

            async publishProject() {
                try {
                    // 1. Get Workspace Data
                    const workspaceState = Blockly.serialization.workspaces.save(this.workspace);

                    // 2. Get Assets and convert to Base64
                    const assets = await this.assetManager.getAllAssets();
                    const serializableAssets = [];

                    for (const asset of assets) {
                        let dataB64;
                        if (asset.data instanceof Blob) { // For models, images
                            dataB64 = await this._blobToBase64(asset.data);
                        } else if (asset.data instanceof ArrayBuffer) { // For audio
                            dataB64 = this._arrayBufferToBase64(asset.data);
                        } else {
                            console.warn(`Asset ${asset.name} has unknown data type, skipping serialization.`);
                            continue;
                        }
                        serializableAssets.push({
                            name: asset.name,
                            type: asset.type,
                            data: dataB64
                        });
                    }

                    // 3. Combine into a project object
                    const projectData = {
                        code: generateCode(),
                        workspace: workspaceState,
                        assets: serializableAssets,
                        version: '1.0'
                    };

                    // 4. Create Jekyll-compatible markdown file content
                    const jsonString = JSON.stringify(projectData, null, 2);
                    const base64WorkspaceData = btoa(unescape(encodeURIComponent(jsonString))); // web-safe base64 encoding
                    const uniqueId = `workspace-${Date.now()}`;
                    const markdownContent = `---
layout: "default"
title: "${uniqueId}"
workspace_data: "${base64WorkspaceData}"
---
`;

                    // 5. Create and trigger download
                    const blob = new Blob([markdownContent], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${uniqueId}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    console.log('Project published successfully!');
                    alert(`Project published as ${uniqueId}.md. Please add this file to the _workspaces directory in your project repository.`);

                } catch (error) {
                    console.error('Failed to publish project:', error);
                    alert('Error publishing project. See console for details.');
                }
            }

            // --- Helper methods for serialization ---

            _arrayBufferToBase64(buffer) {
                let binary = '';
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return window.btoa(binary);
            }

            _blobToBase64(blob) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]); // Remove the data URI prefix
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }

            async loadProjectData(projectData) {
                if (!projectData.workspace || !projectData.assets) {
                    throw new Error('Invalid project data format.');
                }

                // 1. Clear current scene and assets
                this.sceneManager.clear();
                await this._clearAllAssets();
                this.workspace.clear();

                // 2. Load Assets
                for (const asset of projectData.assets) {
                    const data = this._base64ToBlob(asset.data, asset.type);
                    await this.assetManager.addAsset(new File([data], asset.name, { type: asset.type }));
                }
                // The asset view needs to be re-rendered to show the new assets
                loadAssetsIntoView();

                // 3. Load Workspace
                Blockly.serialization.workspaces.load(projectData.workspace, this.workspace);

                // 4. Run the loaded project
                doRun();

                console.log('Project data loaded successfully!');
            }

            async loadProject() {
                try {
                    const file = await this._selectFile();
                    const content = await this._readFile(file);
                    const projectData = JSON.parse(content);
                    await this.loadProjectData(projectData);
                } catch (error) {
                    console.error('Failed to load project:', error);
                    alert('Error loading project. See console for details.');
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
                    const byteArray = new Uint8Array(byteNumbers);
                    byteArrays.push(byteArray);
                }

                return new Blob(byteArrays, { type: contentType });
            }

            async _clearAllAssets() {
                const allAssets = await this.assetManager.getAllAssets();
                for (const asset of allAssets) {
                    await this.assetManager.deleteAsset(asset.name);
                }
            }

            _selectFile() {
                return new Promise(resolve => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.txt';
                    input.onchange = e => {
                        const file = e.target.files[0];
                        if (file) {
                            resolve(file);
                        }
                    };
                    input.click();
                });
            }

            _readFile(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsText(file);
                });
            }



            async shareProject() {
                const workspaceDataEl = document.getElementById("workspace-data");
                if (!workspaceDataEl || !workspaceDataEl.textContent.trim()) {
                    alert("This project must be published before it can be shared or embedded. Please use the Publish button first.");
                    return;
                }
                const shareUrl = window.location.href.split("?")[0].split("#")[0];
                const runtimeUrl = window.location.origin + "/assets/js/engine-runtime.js";
                const embedCode = '<creative-engine-player project-url="' + shareUrl + '"></creative-engine-player>\n<script src="' + runtimeUrl + '">';
