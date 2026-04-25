export function CustomLoadingScreen(/* variables needed, for example:*/ loadingUIText, loadingUIBackgroundColor, loadingUITextColor) {
            //init the loader
            this.loadingUIText = loadingUIText || "Loading...";
            this.loadingUIBackgroundColor = loadingUIBackgroundColor || "black";
            this.loadingUITextColor = loadingUITextColor || "white";
        }

CustomLoadingScreen.prototype.displayLoadingUI = function (container) {
    var loadingDiv = document.createElement("div");
    loadingDiv.id = "customLoadingScreen";
    const canvasContainer = container || document.querySelector(".canvas-container");
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
    } else { console.error("Canvas container not found for loading screen."); }
};

CustomLoadingScreen.prototype.hideLoadingUI = function () {
    if (this._loadingDiv) {
        this._loadingDiv.parentNode.removeChild(this._loadingDiv);
        this._loadingDiv = null;
    }
};

export function isValidAssetURL(url) {
            if (typeof url !== 'string' || !url.trim().toLowerCase().startsWith('https://')) {
                console.error('Invalid URL:', url, 'Only HTTPS URLs are allowed for assets.');
                return false;
            }
            return true;
        }

export class AssetManager {
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

export class BabylonSceneManager {
            constructor(canvas, options = {}) {
        this.container = options.container || document.body;
                this.initAudioEngine();
                this.canvas = canvas;
                this.engine = new BABYLON.Engine(this.canvas, true);
                this.scene = new BABYLON.Scene(this.engine);
                this.objects = {};
                this.materials = {};
                this.sounds = [];
                this.player = null;
                this.moveDirection = new BABYLON.Vector3(0, 0, 0);
                this.playerSpeed = 5;
                this.perFrameFunctions = [];
                this.buttonPressActions = {};
                this.inputState = { keys: {} };
                this.joystick_state = {
                    up: false,
                    down: false,
                    left: false,
                    right: false,
                    pressed: false,
                    angle: 0,
                    force: 0
                };
                this.joystickManager = null;
                this.inputMap = {
                    ' ': 'A',
                    'a': 'Left',
                    'd': 'Right',
                    'w': 'Up',
                    's': 'Down'
                };
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.uiElements = [];
                this.inactivityTimer = null;
                this.uiManager = new UIManager(this.scene);
                this.processedCollisions = new Set();
                this.background = null;
                this.backgroundLayer = null;

                this.initScene();
                this.initInputListeners();
                this.initJoystick();
                this.initAutoHide();
                this.runRenderLoop();

            }

            pauseEngine() {
                this.engine.stopRenderLoop();
            }

            resumeEngine() {
                this.runRenderLoop();
            }

            createPopup(name, title, options) {
                return this.uiManager.createPopup(name, title, options);
            }

            showPopup(target) {
                this.uiManager.showPopup(target);
                this.pauseEngine();
            }

            hidePopup(target) {
                this.uiManager.hidePopup(target);
                this.resumeEngine();
            }

            setPopupTitle(target, title) {
                let popup = null;
                if (typeof target === 'string') {
                    popup = this.uiManager.getControlByName(target);
                } else if (target && target.name) { // It's an object, presumably the popup container
                    popup = target;
                }

                if (popup && popup.children && popup.children.length > 0) {
                    const panel = popup.children[0]; // Assumes the panel is the first child
                    const titleControl = panel.getChildByName(`${popup.name}_title`);
                    if (titleControl) {
                        titleControl.text = title;
                    }
                }
            }

            setPopupImage(target, imageUrl) {
                let popup = null;
                if (typeof target === 'string') {
                    popup = this.uiManager.getControlByName(target);
                } else if (target && target.name) {
                    popup = target;
                }

                if (popup && popup.children && popup.children.length > 0) {
                    const panel = popup.children[0];
                    const imageControl = panel.getChildByName(`${popup.name}_image`);
                    if (imageControl) {
                        imageControl.source = imageUrl;
                    }
                }
            }

            setPopupButtonText(target, buttonName, text) {
                let popup = null;
                if (typeof target === 'string') {
                    popup = this.uiManager.getControlByName(target);
                } else if (target && target.name) {
                    popup = target;
                }

                if (popup && popup.children && popup.children.length > 0) {
                    const panel = popup.children[0];
                    const buttonControl = panel.getChildByName(buttonName);
                    if (buttonControl && buttonControl.textBlock) {
                        buttonControl.textBlock.text = text;
                    }
                }
            }

            setPopupText(target, text) {
                let popup = null;
                if (typeof target === 'string') {
                    popup = this.uiManager.getControlByName(target);
                } else if (target && target.name) {
                    popup = target;
                }

                if (popup && popup.children && popup.children.length > 0) {
                    const panel = popup.children[0];
                    let textControl = panel.getChildByName(`${popup.name}_text`);
                    if (textControl) {
                        textControl.text = text;
                    } else {
                        const textBlock = new BABYLON.GUI.TextBlock(`${popup.name}_text`, text);
                        textBlock.resizeToFit = true;
                        textBlock.color = "white";
                        textBlock.fontSize = 24;
                        textBlock.paddingBottom = "20px";
                        panel.addControl(textBlock);
                    }
                }
            }

            async initAudioEngine() {
                if (this.audioEngine && this.sounds.length > 0) {
                    this.sounds.forEach(sound => {

                        console.log("stopping sound");
                        sound.stop(); // Set default volume
                    });
                    this.audioEngine.dispose();
                }
                this.audioEngine = await BABYLON.CreateAudioEngineAsync();
            }

            initJoystick() {
                const joystickZone = this.container.querySelector('#joystick-zone');

                // Only initialize the joystick if the touch UI is likely active (based on CSS media queries).
                if (joystickZone && window.matchMedia('(max-width: 768px)').matches) {
                    this.joystickManager = nipplejs.create({
                        zone: joystickZone,
                        mode: 'dynamic',
                        color: 'grey',
                        size: 120,
                        fadeTime: 0
                    });

                    this.joystickManager.on('added', (evt, nipple) => {
                        // Detach camera controls when the joystick is active to prevent conflicts
                        if (this.scene.activeCamera) {
                            this.scene.activeCamera.detachControl(this.canvas);
                        }

                        nipple.on('move', (evt, data) => {
                            const angle = data.angle.radian;
                            const force = data.force;

                            this.joystick_state.angle = data.angle.degree;
                            this.joystick_state.force = data.force;

                            // Reset states
                            this.joystick_state.up = false;
                            this.joystick_state.down = false;
                            this.joystick_state.left = false;
                            this.joystick_state.right = false;

                            if (force > 0.5) { // Threshold to prevent accidental movement
                                if (angle > Math.PI * 0.25 && angle < Math.PI * 0.75) {
                                    this.joystick_state.up = true;
                                } else if (angle > Math.PI * 1.25 && angle < Math.PI * 1.75) {
                                    this.joystick_state.down = true;
                                } else if (angle > Math.PI * 0.75 && angle < Math.PI * 1.25) {
                                    this.joystick_state.left = true;
                                } else if (angle < Math.PI * 0.25 || angle > Math.PI * 1.75) {
                                    this.joystick_state.right = true;
                                }
                            }
                        });

                        nipple.on('start', () => {
                            this.joystick_state.pressed = true;
                        });

                        nipple.on('end', () => {
                            this.joystick_state.up = false;
                            this.joystick_state.down = false;
                            this.joystick_state.left = false;
                            this.joystick_state.right = false;
                            this.joystick_state.pressed = false;
                            this.joystick_state.angle = 0;
                            this.joystick_state.force = 0;

                            // Re-attach camera controls when the joystick is released
                            if (this.scene.activeCamera) {
                                this.scene.activeCamera.attachControl(this.canvas, true);
                            }
                        });
                    });

                    this.joystickManager.on('removed', (evt, nipple) => {
                        nipple.off('start move end');
                    });
                }
            }

            initAutoHide() {
                this.uiElements = this.container.querySelectorAll('.interactive-ui');
                const canvasContainer = this.container.querySelector('.canvas-container');

                const resetTimer = () => {
                    this.uiElements.forEach(el => el.classList.remove('hidden'));
                    clearTimeout(this.inactivityTimer);
                    this.inactivityTimer = setTimeout(() => {
                        this.uiElements.forEach(el => el.classList.add('hidden'));
                    }, 3000); // Hide after 3 seconds of inactivity
                };

                // Initial call to start the timer
                resetTimer();

                // Reset timer on user interaction
                canvasContainer.addEventListener('mousemove', resetTimer, false);
                canvasContainer.addEventListener('touchstart', resetTimer, { passive: true });
                canvasContainer.addEventListener('click', resetTimer, false);
            }

            // High-level API for cleaner code generation
            createBox(name, x, y, z) {
                const boxMesh = BABYLON.MeshBuilder.CreateBox(name, {}, this.scene);
                boxMesh.position.set(x, y, z);
                this.objects[name] = boxMesh;
                return boxMesh;
            }

            createSphere(name, x, y, z) {
                const sphereMesh = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 1 }, this.scene);
                sphereMesh.position.set(x, y, z);
                this.objects[name] = sphereMesh;
                return sphereMesh;
            }

            async createText(name, text, fontUrl, size = 1, resolution = 16, depth = 0.5) {
                if (!isValidAssetURL(fontUrl)) {
                    return null;
                }
                try {
                    const response = await fetch(fontUrl);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch font data from ${fontUrl}`);
                    }
                    const fontData = await response.json();

                    const textMesh = BABYLON.MeshBuilder.CreateText(name, text, fontData, {
                        size: size,
                        resolution: resolution,
                        depth: depth
                    }, this.scene);

                    if (textMesh) {
                        this.objects[name] = textMesh;
                        // Center the mesh pivot
                        const boundingInfo = textMesh.getHierarchyBoundingVectors();
                        const center = boundingInfo.max.add(boundingInfo.min).scale(0.5);
                        textMesh.setPivotPoint(center);
                        return textMesh;
                    }
                    return null;
                } catch (error) {
                    console.error('Error creating 3D text:', error);
                    return null;
                }
            }

            scale(target, x, y, z) {
                let name;
                if (typeof target === 'string') {
                    name = target;
                } else if (target && typeof target === 'object' && target.name) {
                    name = target.name;
                }

                if (name && this.objects[name]) {
                    this.objects[name].scaling = new BABYLON.Vector3(x, y, z);
                }
            }

            async importModel(name, url, x, y, z) {
                if (!isValidAssetURL(url)) {
                    return null;
                }
                try {
                    // Load model using SceneLoader
                    const result = await BABYLON.SceneLoader.ImportMeshAsync(null, '', url, this.scene);
                    if (result.meshes.length > 0) {
                        const rootMesh = result.meshes[0];
                        rootMesh.name = name;
                        if (x !== undefined && y !== undefined && z !== undefined) {
                            rootMesh.position = new BABYLON.Vector3(x, y, z);
                        }

                        // If it's a VRM model, normalize its height to a sane default
                        if (url.toLowerCase().endsWith('.vrm')) {
                            const boundingInfo = rootMesh.getHierarchyBoundingVectors(true);
                            const height = boundingInfo.max.y - boundingInfo.min.y;
                            if (height > 0.001) { // Avoid division by zero or tiny values
                                const targetHeight = 2.0;
                                const scale = targetHeight / height;
                                rootMesh.scaling = new BABYLON.Vector3(scale, scale, scale);
                            }
                        }

                        if (result.animationGroups && result.animationGroups.length > 0) {
                            rootMesh.animationGroups = result.animationGroups;
                        }

                        this.objects[name] = rootMesh;
                        return rootMesh;
                    }
                } catch (error) {
                    console.error(`Failed to load model from URL: ${url}`, error);
                }
                return null;
            }

            async importRobloxAvatar(name, userId, x = 0, y = 0, z = 0) {
                try {
                    const getProxiedUrl = (url) => `https://proxy.fxio.workers.dev/corsproxy/?apiurl=${encodeURIComponent(url)}`;

                    let thumbData = null;
                    const tryEndpoints = [
                        `https://apis.roblox.com/thumbnails/v1/users/avatar-3d?userId=${userId}`,
                        `https://thumbnails.roblox.com/v1/users/avatar-3d?userId=${userId}`,
                        `https://www.roblox.com/avatar-thumbnail-3d/json?userId=${userId}`
                    ];

                    for (const url of tryEndpoints) {
                        try {
                            const response = await fetch(getProxiedUrl(url));
                            if (response.ok) {
                                const data = await response.json();
                                if (data && (data.imageUrl || data.url || (data.obj && data.mtl))) {
                                    thumbData = data;
                                    break;
                                }
                            }
                        } catch (e) {
                            console.warn(`Endpoint ${url} failed:`, e.message);
                        }
                    }

                    if (!thumbData) {
                        throw new Error("Avatar not ready or not found");
                    }

                    let manifest = null;
                    const manifestUrl = thumbData.imageUrl || thumbData.url;

                    if (thumbData.obj && thumbData.mtl) {
                        manifest = thumbData;
                    } else if (manifestUrl) {
                        const manifestResponse = await fetch(getProxiedUrl(manifestUrl));
                        manifest = await manifestResponse.json();
                        if (manifest.contents && typeof manifest.contents === "string") {
                            try {
                                manifest = JSON.parse(manifest.contents);
                            } catch (e) { }
                        }
                    }

                    if (!manifest || !manifest.obj) {
                        throw new Error("Could not retrieve avatar manifest");
                    }

                    const getCDNUrl = (hash) => {
                        let i = 31;
                        for (let t = 0; t < 38; t++) i ^= hash[t].charCodeAt(0);
                        return `https://t${(i % 8).toString()}.rbxcdn.com/${hash}`;
                    };

                    const fetchAsset = async (hash, isBinary = false) => {
                        const primaryUrl = getCDNUrl(hash);
                        try {
                            const res = await fetch(getProxiedUrl(primaryUrl));
                            if (res.ok) {
                                const data = isBinary ? await res.blob() : await res.text();
                                if (isBinary || !data.includes("<Error>")) return data;
                            }
                        } catch (e) {}

                        for (let s = 0; s < 8; s++) {
                            const fallbackUrl = `https://t${s}.rbxcdn.com/${hash}`;
                            try {
                                const res = await fetch(getProxiedUrl(fallbackUrl));
                                if (res.ok) {
                                    const data = isBinary ? await res.blob() : await res.text();
                                    if (isBinary || !data.includes("<Error>")) return data;
                                }
                            } catch (e) {}
                        }
                        throw new Error(`Could not fetch asset ${hash}`);
                    };

                    const objText = await fetchAsset(manifest.obj);
                    const mtlText = await fetchAsset(manifest.mtl);

                    const textureMap = {};
                    if (manifest.textures) {
                        for (const texHash of manifest.textures) {
                            try {
                                const blob = await fetchAsset(texHash, true);
                                const dataUrl = await new Promise((resolve) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.readAsDataURL(blob);
                                });
                                textureMap[texHash] = dataUrl;
                            } catch (e) {
                                console.warn(`Failed to fetch texture ${texHash}`, e);
                            }
                        }
                    }

                    const mtlData = {};
                    let currentMat = null;
                    mtlText.split("\n").forEach((line) => {
                        const parts = line.trim().split(/\s+/);
                        if (parts[0] === "newmtl") {
                            currentMat = parts[1];
                            mtlData[currentMat] = {};
                        } else if (currentMat && parts.length >= 2) {
                            if (parts[0] === "map_Kd") mtlData[currentMat].texture = parts[1];
                            if (parts[0] === "Kd") mtlData[currentMat].color = new BABYLON.Color3(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
                        }
                    });

                    const cleanObjText = objText.replace(/^mtllib\s+.+$/gm, "");
                    const objBlob = new Blob([cleanObjText], { type: "text/plain" });
                    const objUrl = URL.createObjectURL(objBlob);

                    const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "", objUrl, this.scene, null, ".obj");
                    if (result.meshes.length > 0) {
                        const avatarRoot = new BABYLON.Mesh(name, this.scene);
                        result.meshes.forEach((mesh) => {
                            if (!mesh.parent) mesh.parent = avatarRoot;
                            if (mesh.material) {
                                const matName = Object.keys(mtlData).find((k) => mesh.material.name.includes(k)) || mesh.material.name;
                                const data = mtlData[matName];
                                if (data) {
                                    if (data.texture && textureMap[data.texture]) {
                                        mesh.material.diffuseTexture = new BABYLON.Texture(textureMap[data.texture], this.scene);
                                    }
                                    if (data.color) {
                                        mesh.material.diffuseColor = data.color;
                                    }
                                }
                                mesh.material.alpha = 1.0;
                                mesh.material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
                                mesh.material.backFaceCulling = false;
                            }
                        });

                        const boundingInfo = avatarRoot.getHierarchyBoundingVectors(true);
                        const height = boundingInfo.max.y - boundingInfo.min.y;
                        if (height > 0.001) {
                            const targetHeight = 2.0;
                            const scale = targetHeight / height;
                            avatarRoot.scaling = new BABYLON.Vector3(scale, scale, scale);

                            const center = boundingInfo.max.add(boundingInfo.min).scale(0.5);
                            avatarRoot.position.x = x - center.x * scale;
                            avatarRoot.position.y = y - boundingInfo.min.y * scale;
                            avatarRoot.position.z = z - center.z * scale;
                        } else {
                            avatarRoot.position = new BABYLON.Vector3(x, y, z);
                        }

                        this.objects[name] = avatarRoot;
                        return avatarRoot;
                    }
                } catch (error) {
                    console.error("Failed to import Roblox avatar:", error);
                }
                return null;
            }

            enablePhysics(target, mass, impostorType = 'BoxImpostor') {
                let originalMesh;
                if (typeof target === 'string') {
                    originalMesh = this._getMesh(target);
                } else if (target && typeof target === 'object') {
                    originalMesh = target;
                }

                if (!originalMesh) {
                    console.warn("enablePhysics: Target object not found.", target);
                    return;
                }
                const name = originalMesh.name;

                // Prevent applying physics twice to the same logical object
                if (originalMesh.physicsImpostor || (originalMesh.parent && originalMesh.parent.physicsImpostor)) {
                    return;
                }

                const meshesWithGeometry = [originalMesh, ...originalMesh.getDescendants(false)].filter(m => m.geometry);

                if (meshesWithGeometry.length === 0) {
                    console.warn(`enablePhysics: Object '${name}' has no geometry.`);
                    return;
                }

                // A mesh is considered "complex" if it has descendants with geometry.
                // Primitives created by createBox/createSphere do not have descendants.
                const isComplex = originalMesh.getDescendants(false).some(d => d.geometry);

                if (isComplex) {
                    // 1. Calculate bounding box of the entire hierarchy.
                    const boundingInfo = originalMesh.getHierarchyBoundingVectors(true);
                    const size = boundingInfo.max.subtract(boundingInfo.min);
                    const center = boundingInfo.max.add(boundingInfo.min).scale(0.5);

                    // Use a small epsilon for dimensions to prevent zero-sized impostors which cannon.js dislikes.
                    const epsilon = 0.001;
                    if (size.x < epsilon) size.x = epsilon;
                    if (size.y < epsilon) size.y = epsilon;
                    if (size.z < epsilon) size.z = epsilon;

                    // 2. Create an invisible box mesh that will be the new physics body.
                    const impostorBox = BABYLON.MeshBuilder.CreateBox(`${name}_impostor`, {
                        width: size.x,
                        height: size.y,
                        depth: size.z
                    }, this.scene);

                    // 3. Position the new box at the center of the model's bounding box.
                    impostorBox.position.copyFrom(center);
                    impostorBox.visibility = 0; // Make it invisible for rendering.

                    // 4. Apply the physics impostor to this new box.
                    const impostor = BABYLON.PhysicsImpostor[impostorType];
                    impostorBox.physicsImpostor = new BABYLON.PhysicsImpostor(impostorBox, impostor, { mass: mass, restitution: 0.9 }, this.scene);

                    // 5. Parent the original visual mesh to the new physics box.
                    // This makes the physics box the new "root" for all transformations.
                    originalMesh.parent = impostorBox;

                    // 6. Adjust the original mesh's local position to be relative to the new parent's center.
                    originalMesh.position.subtractInPlace(center);

                    // 7. Update the scene's object map to point to the new physics root.
                    // Rename the physics root to the original name for consistency in subsequent block calls.
                    impostorBox.name = name;
                    this.objects[name] = impostorBox;

                } else {
                    // It's a simple mesh (like a primitive), apply physics directly to it.
                    const impostor = BABYLON.PhysicsImpostor[impostorType];
                    originalMesh.physicsImpostor = new BABYLON.PhysicsImpostor(originalMesh, impostor, { mass: mass, restitution: 0.9 }, this.scene);
                }
            }

            _getPhysicsImpostor(target) {
                let mesh = this._getMesh(target);
                if (!mesh) {
                    return null;
                }
                // If the mesh itself has an impostor, it's a simple object.
                if (mesh.physicsImpostor) {
                    return mesh.physicsImpostor;
                }
                // If the mesh's parent has an impostor, it's part of a complex object.
                if (mesh.parent && mesh.parent.physicsImpostor) {
                    return mesh.parent.physicsImpostor;
                }
                return null;
            }

            move(target, x, y, z) {
                let mesh = this._getMesh(target);
                if (mesh) {
                    mesh.position.set(x, y, z);
                }
            }

            rotate(target, x, y, z) {
                let mesh = this._getMesh(target);
                if (mesh) {
                    mesh.rotation.set(x * (Math.PI / 180), y * (Math.PI / 180), z * (Math.PI / 180));
                }
            }
            changeColor(target, color) {
                let mesh = this._getMesh(target);
                if (mesh) {
                    if (!mesh.material) {
                        mesh.material = new BABYLON.StandardMaterial(mesh.name + "_material", this.scene);
                    }
                    if (mesh.material.diffuseColor) {
                        mesh.material.diffuseColor = BABYLON.Color3.FromHexString(color);
                    }
                }
            }

            onCollision(target1, target2, callback) {
                const impostor1 = this._getPhysicsImpostor(target1);

                if (!impostor1) {
                    console.warn("onCollision: target1 is not a valid physics object.", target1);
                    return;
                }

                const collisionCallback = (main, collided) => {
                    const ids = [main.object.uniqueId, collided.object.uniqueId].sort();
                    const collisionKey = `${ids[0]}-${ids[1]}`;

                    if (this.processedCollisions.has(collisionKey)) {
                        return;
                    }
                    this.processedCollisions.add(collisionKey);

                    // Find the original visible mesh that corresponds to the collided impostor.
                    // If the impostor is the object itself, it will be returned.
                    // If the impostor is a parent, we find the child that is registered in `this.objects`.
                    const collidedMesh = Object.values(this.objects).find(
                        o => o === collided.object || (o.parent && o.parent === collided.object)
                    );

                    callback(collidedMesh || collided.object);
                };

                if (!Array.isArray(target2)) {
                    const impostor2 = this._getPhysicsImpostor(target2);
                    if (impostor2) {
                        impostor1.registerOnPhysicsCollide(impostor2, collisionCallback);
                    } else {
                        console.warn("onCollision: target2 is not a valid physics object.", target2);
                    }
                } else {
                    const targetImpostors = target2
                        .map(item => this._getPhysicsImpostor(item))
                        .filter(impostor => impostor != null);

                    if (targetImpostors.length > 0) {
                        impostor1.registerOnPhysicsCollide(targetImpostors, collisionCallback);
                    } else {
                        console.warn("onCollision: target2 list contains no valid physics objects.", target2);
                    }
                }
            }

            onClick(name, callback) {
                let targetMesh = this.objects[name];
                if (targetMesh) {
                    if (!targetMesh.actionManager) {
                        targetMesh.actionManager = new BABYLON.ActionManager(this.scene);
                    }
                    targetMesh.actionManager.registerAction(
                        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => callback(targetMesh))
                    );
                }
            }

            everyFrame(name, callback) {
                let targetMesh = this.objects[name];
                if (targetMesh) {
                    this.perFrameFunctions.push({
                        targetMesh: targetMesh,
                        func: (thisMesh, deltaTime) => callback(thisMesh, deltaTime)
                    });
                }
            }

            playerJump(force) {
                if (this.player && this.player.physicsImpostor) {
                    const verticalVelocity = this.player.physicsImpostor.getLinearVelocity().y;
                    if (Math.abs(verticalVelocity) < 0.1) { // Simple ground check
                        this.player.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, force, 0), this.player.getAbsolutePosition());
                    }
                }
            }

            playerMove(direction, speed) {
                if (this.player) {
                    if (speed !== undefined) {
                        this.playerSpeed = speed;
                    }
                    switch (direction) {
                        case 'FORWARD': this.moveDirection.z += 1; break;
                        case 'BACKWARD': this.moveDirection.z -= 1; break;
                        case 'LEFT': this.moveDirection.x -= 1; break;
                        case 'RIGHT': this.moveDirection.x += 1; break;
                    }
                }
            }

            createGround(name, width, height) {
                const groundMesh = BABYLON.MeshBuilder.CreateGround(name, { width: width, height: height }, this.scene);
                this.objects[name] = groundMesh;
                this.setGroundPhysics(name); // Automatically add physics
                return groundMesh;
            }

            setGroundPhysics(name) {
                if (this.objects[name]) {
                    this.objects[name].physicsImpostor = new BABYLON.PhysicsImpostor(this.objects[name], BABYLON.PhysicsImpostor.PlaneImpostor, { mass: 0, restitution: 0.9 }, this.scene);
                }
            }

            setGravity(x, y, z) {
                const physicsEngine = this.scene.getPhysicsEngine();
                if (physicsEngine) {
                    physicsEngine.setGravity(new BABYLON.Vector3(x, y, z));
                }
            }

            createLight(name, x, y, z) {
                const light = new BABYLON.PointLight(name, new BABYLON.Vector3(x, y, z), this.scene);
                return light;
            }

            setAsPlayer(target) {
                let name;
                if (typeof target === 'string') {
                    name = target;
                } else if (target && typeof target === 'object' && target.name) {
                    name = target.name;
                }
                if (this.objects[name]) {
                    this.player = this.objects[name];
                }
            }

            cameraFollow(target) {
                let mesh = null;
                if (typeof target === 'string') {
                    mesh = this.objects[target];
                } else if (target && typeof target === 'object') {
                    // Assumes target is a mesh object
                    mesh = target;
                }

                if (mesh && this.scene.activeCamera) {
                    this.scene.activeCamera.lockedTarget = mesh;
                }
            }

            cameraZoom(value) {
                if (this.scene.activeCamera && typeof this.scene.activeCamera.radius === 'number') {
                    this.scene.activeCamera.radius = Math.max(1, this.scene.activeCamera.radius - value);
                }
            }

            takeScreenshot() {
                const camera = this.scene.activeCamera;
                if (!camera) return;

                const width = window.innerWidth;
                const height = window.innerHeight;

                // Temporarily adjust orthographic camera aspect ratio if needed
                let oldOrtho = null;
                if (camera.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA) {
                    oldOrtho = {
                        left: camera.orthoLeft,
                        right: camera.orthoRight,
                        top: camera.orthoTop,
                        bottom: camera.orthoBottom
                    };
                    const aspectRatio = width / height;
                    const orthoSize = 10;
                    camera.orthoLeft = -orthoSize * aspectRatio;
                    camera.orthoRight = orthoSize * aspectRatio;
                    camera.orthoBottom = -orthoSize;
                    camera.orthoTop = orthoSize;
                }

                BABYLON.Tools.CreateScreenshot(this.engine, camera, { width: width * 2, height: height * 2 }, (data) => {
                    // Restore orthographic camera parameters
                    if (oldOrtho) {
                        camera.orthoLeft = oldOrtho.left;
                        camera.orthoRight = oldOrtho.right;
                        camera.orthoTop = oldOrtho.top;
                        camera.orthoBottom = oldOrtho.bottom;
                    }

                    // Create a formatted timestamp (e.g., 2026-01-17_12-00-00)
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                    const fileName = `engine_${timestamp}.png`;

                    const link = document.createElement('a');
                    link.setAttribute('download', fileName);
                    link.setAttribute('href', data);

                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    console.log(`Downloaded: ${fileName}`);
                });
            }

            setSamplingMode(target, mode) {
                const mesh = this._getMesh(target);
                if (!mesh) return;

                const samplingMode = mode.toLowerCase() === 'nearest' ? BABYLON.Texture.NEAREST_SAMPLINGMODE : BABYLON.Texture.BILINEAR_SAMPLINGMODE;

                const meshes = [mesh, ...mesh.getDescendants(false)];
                meshes.forEach(m => {
                    if (m.material) {
                        const textures = [m.material.diffuseTexture, m.material.albedoTexture].filter(t => t != null);
                        textures.forEach(tex => {
                            if (tex.updateSamplingMode) {
                                tex.updateSamplingMode(samplingMode);
                            } else {
                                tex.samplingMode = samplingMode;
                            }
                        });
                    }
                });
            }

            playAnimationByIndex(target, index, loop = true) {
                const mesh = this._getMesh(target);
                if (!mesh) return;

                if (mesh.animationGroups && mesh.animationGroups.length > index) {
                    mesh.animationGroups.forEach(ag => ag.stop());
                    mesh.animationGroups[index].start(loop);
                } else {
                    console.warn(`Animation index ${index} not found on mesh ${mesh.name}`);
                }
            }

            setBackgroundImage(url) {
                if (!isValidAssetURL(url)) return;
                this._clearBackground();
                this.backgroundLayer = new BABYLON.Layer("backgroundLayer", url, this.scene, true);
                this.background = 'layer';
            }

            setFpsCamera(target) {
                let mesh = null;
                if (typeof target === 'string') {
                    mesh = this.objects[target];
                } else if (target && typeof target === 'object') {
                    mesh = target;
                }

                if (!mesh) {
                    console.warn("setFpsCamera: Target object not found.");
                    return;
                }

                // Dispose of the old camera
                if (this.scene.activeCamera) {
                    this.scene.activeCamera.dispose();
                }

                // Create a new UniversalCamera
                const camera = new BABYLON.UniversalCamera("fpsCamera", new BABYLON.Vector3(0, 1.6, 0), this.scene);
                camera.attachControl(this.canvas, true);

                // Parent the camera to the mesh
                camera.parent = mesh;

                // Set the active camera
                this.scene.activeCamera = camera;
            }

            setIsometricCamera() {
                let camera = this.scene.activeCamera;
                if (camera) {
                    // If the current camera is a UniversalCamera (like our FPS one),
                    // we need to dispose it and create a new ArcRotateCamera for isometric view.
                    if (camera instanceof BABYLON.UniversalCamera) {
                        camera.dispose();
                        camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 4, 10, BABYLON.Vector3.Zero(), this.scene);
                        camera.attachControl(this.canvas, true);
                        this.scene.activeCamera = camera;
                    }
                    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                    const aspectRatio = this.engine.getRenderingCanvas().width / this.engine.getRenderingCanvas().height;
                    const orthoSize = 10;
                    camera.orthoLeft = -orthoSize * aspectRatio;
                    camera.orthoRight = orthoSize * aspectRatio;
                    camera.orthoBottom = -orthoSize;
                    camera.orthoTop = orthoSize;
                    camera.alpha = BABYLON.Tools.ToRadians(45);
                    camera.beta = BABYLON.Tools.ToRadians(45); // Classic isometric angle
                    camera.radius = 20;
                    camera.setTarget(BABYLON.Vector3.Zero());

                    // Detach controls to lock the camera angle
                    camera.detachControl(this.canvas);
                }
            }

            destroyObject(target) {
                const mesh = this._getMesh(target);
                if (mesh) {
                    mesh.dispose();
                    let name;
                    if (typeof target === 'string') {
                        name = target;
                    } else if (target && typeof target === 'object' && target.name) {
                        name = target.name;
                    }
                    if (name && this.objects[name]) {
                        delete this.objects[name];
                    }
                }
            }

            onButtonPress(button, callback) {
                if (!this.buttonPressActions[button]) {
                    this.buttonPressActions[button] = [];
                }
                this.buttonPressActions[button].push(callback);
            }


            async playSound(url) {
                if (!isValidAssetURL(url)) {
                    return;
                }
                // Create a new sound and play it.

                if (!this.audioEngine) {
                    return;
                }

                let sound = await BABYLON.CreateStreamingSoundAsync("sound", url);

                this.sounds.push(sound);

                await this.audioEngine.unlockAsync();

                sound.play();
            }

            async playSoundAsset(name, assetManager) {
                let asset = await assetManager.getAsset(name);
                if (asset && asset.data instanceof ArrayBuffer) {
                    this.playSound(URL.createObjectURL(new Blob([asset.data])));
                }
            }

            playNote(frequency, duration) {
                if (!this.audioContext) return;
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.type = 'sine'; // 'sine', 'square', 'sawtooth', 'triangle'
                oscillator.frequency.value = frequency;

                // Fade out to avoid clicking
                gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + duration);
            }

            initInputListeners() {
                window.addEventListener('keydown', (event) => {
                    this.inputState.keys[event.key.toLowerCase()] = true;
                });
                window.addEventListener('keyup', (event) => {
                    this.inputState.keys[event.key.toLowerCase()] = false;
                });
            }

            initScene() {
                const camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 4, 10, BABYLON.Vector3.Zero(), this.scene);
                camera.attachControl(this.canvas, true);

                // Smooth navigation
                // TODO: Via blocks
                camera.inertia = 0.2;
                camera.wheelPrecision = 10;

                const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0), this.scene);
                const physicsPlugin = new BABYLON.CannonJSPlugin();
                this.scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), physicsPlugin);
            }

            runRenderLoop() {
                let lastTime = performance.now();
                this.engine.runRenderLoop(() => {
                    this.processedCollisions.clear();
                    const currentTime = performance.now();
                    const deltaTime = currentTime - lastTime;
                    lastTime = currentTime;

                    // Reset movement direction at the start of the frame
                    this.moveDirection.set(0, 0, 0);

                    // Handle continuous button presses via input map
                    for (const key in this.inputState.keys) {
                        if (this.inputState.keys[key]) { // If the physical key is pressed
                            const button = this.inputMap[key]; // Find the logical button
                            if (button && this.buttonPressActions[button]) {
                                this.buttonPressActions[button].forEach(action => action());
                            }
                        }
                    }

                    // Handle joystick state
                    if (this.joystick_state.left && this.buttonPressActions['Left']) {
                        this.buttonPressActions['Left'].forEach(action => action());
                    }
                    if (this.joystick_state.right && this.buttonPressActions['Right']) {
                        this.buttonPressActions['Right'].forEach(action => action());
                    }
                    if (this.joystick_state.up && this.buttonPressActions['Up']) {
                        this.buttonPressActions['Up'].forEach(action => action());
                    }
                    if (this.joystick_state.down && this.buttonPressActions['Down']) {
                        this.buttonPressActions['Down'].forEach(action => action());
                    }

                    // Apply calculated movement
                    if (this.player && this.player.physicsImpostor) {
                        const currentVelocity = this.player.physicsImpostor.getLinearVelocity();
                        let newVelocity = new BABYLON.Vector3(0, currentVelocity.y, 0);

                        if (this.moveDirection.lengthSquared() > 0) {
                            const camera = this.scene.activeCamera;
                            let finalMoveDirection;

                            // If we have a camera, adjust movement to be camera-relative
                            if (camera) {
                                // Get camera's forward and right vectors on the horizontal plane
                                const cameraForward = camera.getForwardRay(1).direction;
                                const forward = new BABYLON.Vector3(cameraForward.x, 0, cameraForward.z).normalize();
                                const right = new BABYLON.Vector3(forward.z, 0, -forward.x);

                                // Calculate the final move direction based on camera orientation
                                // Z input moves along the camera's forward, X input moves along its right
                                finalMoveDirection = forward.scale(this.moveDirection.z).add(right.scale(this.moveDirection.x));
                            } else {
                                // Fallback to original behavior if no camera
                                finalMoveDirection = this.moveDirection.clone();
                            }

                            // Normalize to prevent faster diagonal movement and apply speed
                            if (finalMoveDirection.lengthSquared() > 0) {
                                const normalizedMove = finalMoveDirection.normalize().scale(this.playerSpeed);
                                newVelocity.x = normalizedMove.x;
                                newVelocity.z = normalizedMove.z;
                            }

                        } else {
                            // If no input, stop horizontal movement
                            newVelocity.x = 0;
                            newVelocity.z = 0;
                        }

                        this.player.physicsImpostor.setLinearVelocity(newVelocity);
                    }

                    this.perFrameFunctions.forEach(task => {
                        if (task.targetMesh && !task.targetMesh.isDisposed() && typeof task.func === 'function') {
                            try {
                                task.func(task.targetMesh, deltaTime);
                            } catch (e) {
                                console.error(`Error executing per-frame function for mesh ${task.targetMesh.name}:`, e);
                            }
                        }
                    });
                    this.scene.render();
                });
            }

            clear() {
                if (this.joystickManager) {
                    this.joystickManager.destroy();
                    this.joystickManager = null;
                }
                this.uiManager.clear();
                this.scene.dispose();
                this.scene = new BABYLON.Scene(this.engine);
                this.initScene();
                this.uiManager = new UIManager(this.scene); // Re-initialize UIManager for the new scene
                this.objects = {};
                this.materials = {};

                // Dispose all sounds
                for (let i = 0; i < this.sounds.length; i++) {
                    this.sounds[i].dispose();
                }
                this.sounds = [];

                this.player = null;
                this.perFrameFunctions = [];
                this.buttonPressActions = {};
                this.inputState = { keys: {} }; // Reset state on clear
            }

            dispose() {
                if (this.joystickManager) {
                    this.joystickManager.destroy();
                    this.joystickManager = null;
                }
                this.uiManager.dispose();
                this.scene.dispose();
                this.engine.dispose();
            }

            getMeshNames() {
                return Object.keys(this.objects);
            }

            _getMesh(target) {
                let name;
                if (typeof target === 'string') {
                    name = target;
                } else if (target && typeof target === 'object' && target.name) {
                    name = target.name;
                }
                return this.objects[name];
            }

            getProperty(target, property) {
                if (!target || !property) {
                    return null;
                }
                // Special handling for UI controls, which are not in the main 'objects' list
                if (typeof target === 'string' && this.uiManager.controls[target]) {
                    target = this.uiManager.controls[target];
                }

                const propertyPath = property.split('.');
                let current = target;

                for (let i = 0; i < propertyPath.length; i++) {
                    if (current === null || current === undefined || typeof current[propertyPath[i]] === 'undefined') {
                        return null;
                    }
                    current = current[propertyPath[i]];
                }
                return current;
            }

            getMetadata(target, key) {
                const mesh = this._getMesh(target);
                if (!mesh || !mesh.metadata || typeof mesh.metadata[key] === 'undefined') {
                    return null;
                }
                return mesh.metadata[key];
            }

            setMetadata(target, key, value) {
                const mesh = this._getMesh(target);
                if (!mesh) return;

                if (!mesh.metadata) {
                    mesh.metadata = {};
                }
                mesh.metadata[key] = value;
            }

            animateProperty(target, property, from, to, duration, loop, loopMode) {
                const mesh = this._getMesh(target);
                if (!mesh) return;

                const frameRate = 30;
                const totalFrames = frameRate * duration;

                // Determine the data type of the property
                let propertyType;
                const propertyPath = property.split('.');
                let temp = mesh;
                for (let i = 0; i < propertyPath.length; i++) {
                    if (temp[propertyPath[i]] === undefined) {
                        console.error("Invalid property path");
                        return;
                    }
                    temp = temp[propertyPath[i]];
                }

                if (typeof temp === 'number') {
                    propertyType = BABYLON.Animation.ANIMATIONTYPE_FLOAT;
                } else if (temp instanceof BABYLON.Vector3) {
                    propertyType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                } else if (temp instanceof BABYLON.Color3) {
                    propertyType = BABYLON.Animation.ANIMATIONTYPE_COLOR3;
                } else {
                    console.error("Unsupported animation property type");
                    return;
                }

                const bjsLoopMode = BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE;

                const animation = new BABYLON.Animation(
                    "animation",
                    property,
                    frameRate,
                    propertyType,
                    bjsLoopMode
                );

                const keys = [];
                keys.push({ frame: 0, value: from });
                keys.push({ frame: totalFrames, value: to });
                if (loopMode === 'PINGPONG') {
                    keys.push({ frame: totalFrames * 2, value: from });
                }

                animation.setKeys(keys);

                // Stop any previous animations on the same property before starting a new one
                this.scene.stopAnimation(mesh, property);

                const endFrame = loopMode === 'PINGPONG' ? totalFrames * 2 : totalFrames;
                this.scene.beginDirectAnimation(mesh, [animation], 0, endFrame, loop);
            }
            animateKeyframes(target, property, keyframes, loop, loopMode) {
                const mesh = this._getMesh(target);
                if (!mesh) return;

                const frameRate = 30;

                // Determine the data type of the property
                let propertyType;
                const propertyPath = property.split(".");
                let temp = mesh;
                for (let i = 0; i < propertyPath.length; i++) {
                    if (temp[propertyPath[i]] === undefined) {
                        console.error("Invalid property path");
                        return;
                    }
                    temp = temp[propertyPath[i]];
                }

                if (typeof temp === "number") {
                    propertyType = BABYLON.Animation.ANIMATIONTYPE_FLOAT;
                } else if (temp instanceof BABYLON.Vector3) {
                    propertyType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                } else if (temp instanceof BABYLON.Color3) {
                    propertyType = BABYLON.Animation.ANIMATIONTYPE_COLOR3;
                } else {
                    console.error("Unsupported animation property type");
                    return;
                }

                const bjsLoopMode = BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE;

                const animation = new BABYLON.Animation(
                    "keyframeAnimation",
                    property,
                    frameRate,
                    propertyType,
                    bjsLoopMode
                );

                // Sort keyframes by frame number
                keyframes.sort((a, b) => a.frame - b.frame);

                const finalKeyframes = [...keyframes];
                let endFrame = keyframes[keyframes.length - 1].frame;

                if (loopMode === "PINGPONG") {
                    for (let i = keyframes.length - 2; i >= 0; i--) {
                        const original = keyframes[i];
                        const durationFromNext = keyframes[i + 1].frame - original.frame;
                        endFrame += durationFromNext;
                        finalKeyframes.push({ frame: endFrame, value: original.value });
                    }
                }

                animation.setKeys(finalKeyframes);

                // Stop any previous animations on the same property before starting a new one
                this.scene.stopAnimation(mesh, property);

                this.scene.beginDirectAnimation(mesh, [animation], 0, endFrame, loop);
            }


            async importAnimation(url) {
                if (!isValidAssetURL(url)) {
                    return null;
                }
                try {
                    // Note: LoadAssetContainerAsync is better for animations as it doesn't add to scene automatically.
                    const container = await BABYLON.SceneLoader.LoadAssetContainerAsync("", url, this.scene);
                    if (container.animationGroups.length > 0) {
                        const animationGroup = container.animationGroups[0];
                        animationGroup.stop(); // Stop by default
                        // We don't add meshes to the scene, just return the animation group
                        return animationGroup;
                    }
                } catch (error) {
                    console.error(`Failed to load animation from URL: ${url}`, error);
                }
                return null;
            }

            applyAnimation(animationGroup, target) {
                const mesh = this._getMesh(target);
                if (mesh && animationGroup) {
                    // Target the animation to the mesh's skeleton
                    animationGroup.targetedAnimations.forEach(anim => {
                        const targetNode = this.scene.getBoneByName(anim.target.name) || this.scene.getTransformNodeByName(anim.target.name);
                        if(targetNode) {
                            anim.target = targetNode;
                        }
                    });
                    mesh.animationGroups = mesh.animationGroups || [];
                    mesh.animationGroups.push(animationGroup);
                }
            }

            playAnimation(target, from, to, loop) {
                const mesh = this._getMesh(target);
                if (mesh && mesh.animationGroups && mesh.animationGroups.length > 0) {
                    mesh.animationGroups.forEach(ag => {
                        ag.start(loop, 1.0, from, to);
                    });
                }
            }

            stopSkeletalAnimation(target) {
                const mesh = this._getMesh(target);
                if (mesh && mesh.animationGroups) {
                    mesh.animationGroups.forEach(ag => ag.stop());
                }
            }

            stopPropertyAnimation(target) {
                const mesh = this._getMesh(target);
                if (mesh) {
                    this.scene.stopAnimation(mesh);
                }
            }

            animateRotation(target, x, y, z, duration, loop, loopMode) {
                const mesh = this._getMesh(target);
                if (!mesh) return;

                // Ensure the mesh is using quaternions for rotation
                if (!mesh.rotationQuaternion) {
                    mesh.rotationQuaternion = BABYLON.Quaternion.FromEulerVector(mesh.rotation);
                }

                const frameRate = 30;
                const totalFrames = frameRate * duration;

                const animation = new BABYLON.Animation(
                    "rotationAnimation",
                    "rotationQuaternion",
                    frameRate,
                    BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );

                const startRotation = mesh.rotationQuaternion;
                const endRotation = BABYLON.Quaternion.FromEulerAngles(
                    BABYLON.Tools.ToRadians(x),
                    BABYLON.Tools.ToRadians(y),
                    BABYLON.Tools.ToRadians(z)
                );

                const keys = [];
                keys.push({ frame: 0, value: startRotation });
                keys.push({ frame: totalFrames, value: endRotation });
                if (loopMode === 'PINGPONG') {
                    keys.push({ frame: totalFrames * 2, value: startRotation });
                }

                animation.setKeys(keys);

                // Use shortest path for quaternion interpolation
                animation.useShortestPath = true;

                this.scene.stopAnimation(mesh, "rotationQuaternion");

                const endFrame = loopMode === 'PINGPONG' ? totalFrames * 2 : totalFrames;
                this.scene.beginDirectAnimation(mesh, [animation], 0, endFrame, loop);
            }

            animatePosition(target, x, y, z, duration, loop, loopMode) {
                const mesh = this._getMesh(target);
                if (!mesh) return;

                const frameRate = 30;
                const totalFrames = frameRate * duration;

                const animation = new BABYLON.Animation(
                    "positionAnimation",
                    "position",
                    frameRate,
                    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );

                const startPosition = mesh.position;
                const endPosition = new BABYLON.Vector3(x, y, z);

                const keys = [];
                keys.push({ frame: 0, value: startPosition });
                keys.push({ frame: totalFrames, value: endPosition });
                if (loopMode === 'PINGPONG') {
                    keys.push({ frame: totalFrames * 2, value: startPosition });
                }

                animation.setKeys(keys);

                this.scene.stopAnimation(mesh, "position");

                const endFrame = loopMode === 'PINGPONG' ? totalFrames * 2 : totalFrames;
                this.scene.beginDirectAnimation(mesh, [animation], 0, endFrame, loop);
            }

            animateScale(target, x, y, z, duration, loop, loopMode) {
                const mesh = this._getMesh(target);
                if (!mesh) return;

                const frameRate = 30;
                const totalFrames = frameRate * duration;

                const animation = new BABYLON.Animation(
                    "scaleAnimation",
                    "scaling",
                    frameRate,
                    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );

                const startScale = mesh.scaling;
                const endScale = new BABYLON.Vector3(x, y, z);

                const keys = [];
                keys.push({ frame: 0, value: startScale });
                keys.push({ frame: totalFrames, value: endScale });
                if (loopMode === 'PINGPONG') {
                    keys.push({ frame: totalFrames * 2, value: startScale });
                }

                animation.setKeys(keys);

                this.scene.stopAnimation(mesh, "scaling");

                const endFrame = loopMode === 'PINGPONG' ? totalFrames * 2 : totalFrames;
                this.scene.beginDirectAnimation(mesh, [animation], 0, endFrame, loop);
            }

            createEnvironment(options) {
                this._clearBackground();
                this.environmentHelper = this.scene.createDefaultEnvironment(options);
            }

            setBackground(backgroundInput) {
                this._clearBackground();

                // Check if the input is a hex color
                if (/^#([0-9A-F]{3}){1,2}$/i.test(backgroundInput)) {
                    this.scene.clearColor = BABYLON.Color3.FromHexString(backgroundInput);
                    this.background = 'color';
                } else {
                    // Assume it's a texture name
                    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, this.scene);
                    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", this.scene);
                    skyboxMaterial.backFaceCulling = false;
                    skyboxMaterial.disableLighting = true;

                    skybox.infiniteDistance = true;

                    let texture;
                    switch (backgroundInput) {
                        case 'brick':
                            texture = new BABYLON.BrickProceduralTexture("brickTexture", 512, this.scene);
                            texture.numberOfBricksHeight = 6;
                            texture.numberOfBricksWidth = 10;
                            //skyboxMaterial.diffuseTexture = texture;
                            break;
                        case 'grass':
                            texture = new BABYLON.GrassProceduralTexture("grassTexture", 256, this.scene);
                            //skyboxMaterial.ambientTexture = texture;
                            break;
                        case 'road':
                            texture = new BABYLON.BrickProceduralTexture("roadTexture", 512, this.scene);
                            //skyboxMaterial.diffuseTexture = texture;
                            break;
                        case 'wood':
                            texture = new BABYLON.WoodProceduralTexture("woodTexture", 1024, this.scene);
                            texture.ampScale = 80.0;
                            //skyboxMaterial.diffuseTexture = texture;
                            break;
                        case 'marble':
                            texture = new BABYLON.MarbleProceduralTexture("marbleTexture", 512, this.scene);
                            texture.numberOfTilesHeight = 5;
                            texture.numberOfTilesWidth = 5;
                            //skyboxMaterial.ambientTexture = texture;
                            break;
                        case 'fire':
                            texture = new BABYLON.FireProceduralTexture("fireTexture", 256, this.scene);
                            //skyboxMaterial.diffuseTexture = texture;
                            //skyboxMaterial.opacityTexture = texture;
                            break;
                        case 'clouds':
                            texture = new BABYLON.CloudProceduralTexture("cloudTexture", 1024, this.scene);
                            //skyboxMaterial.emissiveTexture = texture;
                            //skyboxMaterial.backFaceCulling = false;
                            //skyboxMaterial.emissiveTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
                            break;
                        default:
                            console.warn(`Unknown background texture: ${backgroundInput}`);
                            skybox.dispose(); // clean up the created skybox
                            return;
                    }

                    skyboxMaterial.reflectionTexture = texture;
                    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
                    skybox.material = skyboxMaterial;
                    this.background = skybox;
                }
            }

            _clearBackground() {
                if (this.background) {
                    if (this.background.dispose) {
                        this.background.dispose();
                    }
                    this.background = null;
                }
                if (this.backgroundLayer) {
                    this.backgroundLayer.dispose();
                    this.backgroundLayer = null;
                }
                if (this.environmentHelper) {
                    this.environmentHelper.dispose();
                    this.environmentHelper = null;
                }
                // Reset clear color to default, Babylon's default is cornflower blue, let's use it
                this.scene.clearColor = new BABYLON.Color4(100 / 255, 149 / 255, 237 / 255, 1);
            }
        }

export class UIManager {
            constructor(scene) {
                this.scene = scene;
                this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
                this.controls = {};
                this.assetUrls = {};
            }

            createText(name, text, options = {}) {
                const textBlock = new BABYLON.GUI.TextBlock(name, text);
                textBlock.resizeToFit = true;
                textBlock.color = options.color || "white";
                textBlock.fontSize = options.fontSize || 24;
                textBlock.top = options.top || "0px";
                textBlock.left = options.left || "0px";
                textBlock.horizontalAlignment = options.horizontalAlignment !== undefined ? options.horizontalAlignment : BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                textBlock.verticalAlignment = options.verticalAlignment !== undefined ? options.verticalAlignment : BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                this.advancedTexture.addControl(textBlock);
                this.controls[name] = textBlock;
                return textBlock;
            }

            setText(name, text) {
                if (this.controls[name] && this.controls[name].text !== undefined) {
                    this.controls[name].text = text;
                }
            }

            createInput(name, options = {}) {
                const inputText = new BABYLON.GUI.InputText(name);
                inputText.width = options.width || "200px";
                inputText.height = options.height || "40px";
                inputText.color = options.color || "white";
                inputText.background = options.background || "grey";
                inputText.top = options.top || "0px";
                inputText.left = options.left || "0px";
                inputText.horizontalAlignment = options.horizontalAlignment !== undefined ? options.horizontalAlignment : BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                inputText.verticalAlignment = options.verticalAlignment !== undefined ? options.verticalAlignment : BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                this.advancedTexture.addControl(inputText);
                this.controls[name] = inputText;
                return inputText;
            }

            getInputText(name) {
                if (this.controls[name] && this.controls[name].text !== undefined) {
                    return this.controls[name].text;
                }
                return "";
            }


            createButton(name, text, options = {}) {
                const button = BABYLON.GUI.Button.CreateSimpleButton(name, text);
                button.width = options.width || "150px";
                button.height = options.height || "40px";
                button.color = options.color || "white";
                button.background = options.background || "green";
                button.top = options.top || "0px";
                button.left = options.left || "0px";
                button.horizontalAlignment = options.horizontalAlignment !== undefined ? options.horizontalAlignment : BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                button.verticalAlignment = options.verticalAlignment !== undefined ? options.verticalAlignment : BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                this.advancedTexture.addControl(button);
                this.controls[name] = button;
                return button;
            }

            createImage(name, url, options = {}) {
                if (!isValidAssetURL(url)) {
                    return null;
                }
                const image = new BABYLON.GUI.Image(name, url);
                image.width = options.width || "100px";
                image.height = options.height || "100px";
                image.top = options.top || "0px";
                image.left = options.left || "0px";
                image.horizontalAlignment = options.horizontalAlignment !== undefined ? options.horizontalAlignment : BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                image.verticalAlignment = options.verticalAlignment !== undefined ? options.verticalAlignment : BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                this.advancedTexture.addControl(image);
                this.controls[name] = image;
                return image;
            }

            createImageFromAsset(name, asset, options = {}) {
                if (this.controls[name]) {
                    this.controls[name].dispose();
                }

                if (this.assetUrls[name]) {
                    URL.revokeObjectURL(this.assetUrls[name]);
                }

                const url = URL.createObjectURL(asset.data);
                this.assetUrls[name] = url; // Store the URL
                const image = new BABYLON.GUI.Image(name, url);

                // Set properties
                Object.keys(options).forEach(key => {
                    if (key in image) {
                        image[key] = options[key];
                    }
                });

                this.advancedTexture.addControl(image);
                this.controls[name] = image;

                return image;
            }

            onControlClick(name, callback) {
                if (this.controls[name]) {
                    this.controls[name].onPointerClickObservable.add(callback);
                }
            }

            getControlByName(name) {
                return this.controls[name];
            }

            createPopup(name, title, options = {}) {
                if (this.controls[name]) {
                    console.warn(`Popup with name "${name}" already exists. Creation ignored.`);
                    return;
                }

                // Create a full-screen, semi-transparent container
                const container = new BABYLON.GUI.Rectangle(name);
                container.width = "100%";
                container.height = "100%";
                container.thickness = 0; // No border
                container.background = "rgba(0, 0, 0, 0.7)";
                container.isVisible = false; // Initially hidden
                this.advancedTexture.addControl(container);
                this.controls[name] = container;

                // Create a stack panel for vertical alignment of content
                const panel = new BABYLON.GUI.StackPanel();
                panel.width = "80%";
                panel.maxWidth = "500px";
                container.addControl(panel);

                // Add Image if provided
                if (options.image) {
                    const image = new BABYLON.GUI.Image(`${name}_image`, options.image);
                    image.width = "150px";
                    image.height = "150px";
                    image.paddingBottom = "20px";
                    panel.addControl(image);
                }

                // Add Title
                const titleBlock = new BABYLON.GUI.TextBlock(`${name}_title`, title);
                titleBlock.resizeToFit = true;
                titleBlock.color = "white";
                titleBlock.fontSize = 32;
                titleBlock.paddingBottom = "20px";
                panel.addControl(titleBlock);

                // Add Text if provided
                if (options.text) {
                    const textBlock = new BABYLON.GUI.TextBlock(`${name}_text`, options.text);
                    textBlock.resizeToFit = true;
                    textBlock.color = "white";
                    textBlock.fontSize = 24;
                    textBlock.paddingBottom = "20px";
                    panel.addControl(textBlock);
                }

                // Add Button 1 if text is provided
                if (options.button1_text) {
                    const button1_name = options.button1_name || `${name}_button1`;
                    const button1 = BABYLON.GUI.Button.CreateSimpleButton(button1_name, options.button1_text);
                    button1.width = "200px";
                    button1.height = "50px";
                    button1.color = "white";
                    button1.background = "green";
                    button1.paddingBottom = "10px";
                    panel.addControl(button1);
                    this.controls[button1_name] = button1;
                }

                // Add Button 2 if text is provided
                if (options.button2_text) {
                    const button2_name = options.button2_name || `${name}_button2`;
                    const button2 = BABYLON.GUI.Button.CreateSimpleButton(button2_name, options.button2_text);
                    button2.width = "200px";
                    button2.height = "50px";
                    button2.color = "white";
                    button2.background = "blue";
                    panel.addControl(button2);
                    this.controls[button2_name] = button2;
                }

                return container;
            }

            showPopup(target) {
                let control = null;
                if (typeof target === 'string') {
                    control = this.controls[target];
                } else if (target && typeof target.isVisible !== 'undefined') {
                    control = target;
                }

                if (control) {
                    control.isVisible = true;
                } else {
                    console.warn(`Popup not found.`);
                }
            }

            hidePopup(target) {
                let control = null;
                if (typeof target === 'string') {
                    control = this.controls[target];
                } else if (target && typeof target.isVisible !== 'undefined') {
                    control = target;
                }

                if (control) {
                    control.isVisible = false;
                } else {
                    console.warn(`Popup not found.`);
                }
            }

            clear() {
                // Dispose all controls
                for (const name in this.controls) {
                    this.controls[name].dispose();
                }
                this.controls = {};

                // Revoke all created asset URLs
                for (const name in this.assetUrls) {
                    URL.revokeObjectURL(this.assetUrls[name]);
                }
                this.assetUrls = {};
            }

            dispose() {
                this.clear();
                this.advancedTexture.dispose();
            }
        }
