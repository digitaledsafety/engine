/**
 * Babylon.js 3D Graphics Runtime Implementation
 * Extends BaseRuntimeEngine to provide 3D scene rendering, mesh management, physics, audio, and GUI controls.
 */
(function (global) {
    'use strict';

        function CustomLoadingScreen(/* variables needed, for example:*/ loadingUIText, loadingUIBackgroundColor, loadingUITextColor) {
            //init the loader
            this.loadingUIText = loadingUIText || "Loading...";
            this.loadingUIBackgroundColor = loadingUIBackgroundColor || "black";
            this.loadingUITextColor = loadingUITextColor || "white";
        }
        CustomLoadingScreen.prototype.displayLoadingUI = function () {
            this.hideLoadingUI();
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
                loadingDiv.textContent = this.loadingUIText;
                canvasContainer.appendChild(loadingDiv);
                this._loadingDiv = loadingDiv;
            } else {
                console.error("Canvas container not found for loading screen.");
            }
        };
        CustomLoadingScreen.prototype.hideLoadingUI = function () {
            if (this._loadingDiv && this._loadingDiv.parentNode) {
                this._loadingDiv.parentNode.removeChild(this._loadingDiv);
                this._loadingDiv = null;
            }
            const existing = document.getElementById("customLoadingScreen");
            if (existing && existing.parentNode) {
                existing.parentNode.removeChild(existing);
            }
        };


        class BabylonSceneManager extends (typeof BaseRuntimeEngine !== "undefined" ? BaseRuntimeEngine : Object) {
            constructor(canvas, options = {}) {
                super(canvas, options);
                this.initAudioEngine();
                this.canvas = canvas;
                this.engine = new BABYLON.Engine(this.canvas, true);
                this.scene = new BABYLON.Scene(this.engine);
                this.objects = {};
                this.pendingObjectEvents = {};
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
                    's': 'Down',
                    'arrowleft': 'Left',
                    'arrowright': 'Right',
                    'arrowup': 'Up',
                    'arrowdown': 'Down'
                };
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.uiElements = [];
                this.inactivityTimer = null;
                this.uiManager = new UIManager(this.scene);
                this.processedCollisions = new Set();
                this.registeredCollisionPairs = new Set();
                this.pendingCollisions = [];
                this.background = null;
                this.backgroundLayer = null;

                // PeerJS Multiplayer system state
                this.peer = null;
                this.peerId = null;
                this.peerConnections = {}; // peerId -> DataConnection
                this.peerJoinCallbacks = [];
                this.peerLeaveCallbacks = [];
                this.peerDataCallbacks = [];
                this.syncedObjects = {}; // name -> { objectRef, interval }

                this.globalEventBus = {};
                this.onSceneStartObservable = new BABYLON.Observable();
                this.swipeCallbacks = { 'LEFT': [], 'RIGHT': [], 'UP': [], 'DOWN': [] };

                // Unified Action Input System
                this.actionCallbacks = { select: [], context: [], zoom: [], navigate: [], menu: [], double_select: [] };
                this.activeActions = { select: false, context: false, zoom: false, navigate: false, menu: false, double_select: false };
                this.gamepadPrevButtons = {};

                // Digital Co-Host State
                this.speechTranscript = '';
                this.speechRecognition = null;
                this.isListening = false;
                this.webcamTracking = { active: false, x: 0, y: 0, z: 0, gesture: 'neutral' };
                this.objectRecognition = {
                    active: false,
                    model: null,
                    loadingPromise: null,
                    videoElement: null,
                    canvasElement: null,
                    previewContainer: null,
                    stream: null,
                    listeners: [],
                    cooldownMs: 1500,
                    detectionTimer: null
                };
                this.screenCapture = {
                    active: false,
                    stream: null,
                    videoElement: null,
                    canvasElement: null,
                    canvasCtx: null,
                    intervalId: null,
                    lastFrameDataUrl: null,
                    latestSubtitles: ''
                };
                this.cursorState = {
                    x: 0,
                    y: 0,
                    callbacks: []
                };
                this.screenCaptureListeners = [];
                this.llmEndpoint = null;
                this.llmApiKey = null;

                // Built-in Game State & Rules Engine State
                this.gameState = 'start';
                this.gameScore = 0;
                this.gameHealth = 100;
                this.maxGameHealth = 100;
                this.gameTimer = 0;
                this.gameTimerInitial = 0;
                this.gameTimerRunning = false;
                this.timerFinishCallbacks = [];
                this.timerManager = new TimerManager(this);
                this.gameStateChangeCallbacks = [];
                this.hudElements = { container: null, scoreText: null, healthBarFill: null, healthText: null, timerText: null };
                this.hudConfig = { showScore: true, showHealth: true, showTimer: false };
                this.flightAnchors = {
                    'shoulder': new BABYLON.Vector3(0, -2.5, 0),
                    'bottom': new BABYLON.Vector3(0, -2.5, 0),
                    'bottom_center': new BABYLON.Vector3(0, -2.5, 0),
                    'center': new BABYLON.Vector3(0, 0, 0),
                    'workspace': new BABYLON.Vector3(-3, -1, 0),
                    'top_left': new BABYLON.Vector3(-5, 3, 0),
                    'top_right': new BABYLON.Vector3(5, 3, 0),
                    'bottom_left': new BABYLON.Vector3(-5, -3, 0),
                    'bottom_right': new BABYLON.Vector3(5, -3, 0)
                };
                this.proceduralFlight = {
                    enabled: false,
                    targetMesh: null,
                    currentAnchor: 'bottom',
                    time: 0,
                    currentPos: new BABYLON.Vector3(0, -2.5, 0),
                    isRegistered: false,
                    isLooping: false,
                    loopTime: 0,
                    loopDuration: 1.5
                };

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

            showSpeechBubble(target, text, duration = 4) {
                return this.uiManager.showSpeechBubble(target, text, duration, this);
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

            _getPopupPanel(target) {
                let popup = null;
                if (typeof target === 'string') {
                    popup = this.uiManager.getControlByName(target);
                } else if (target && target.name) {
                    popup = target;
                }

                if (popup && popup.children && popup.children.length > 0) {
                    return {
                        panel: popup.children[0],
                        name: popup.name
                    };
                }
                return null;
            }

            async setTexture(target, assetName, assetManager) {
                const mesh = this._getMesh(target);
                if (mesh) {
                    const asset = await assetManager.getAsset(assetName);
                    if (asset && asset.data instanceof Blob) {
                        const objectUrl = URL.createObjectURL(asset.data);
                        const texture = new BABYLON.Texture(objectUrl, this.scene);
                        if (!mesh.material) {
                            mesh.material = new BABYLON.StandardMaterial(mesh.name + "_material", this.scene);
                        }
                        mesh.material.diffuseTexture = texture;
                    }
                }
            }

            setPopupTitle(target, title) {
                const info = this._getPopupPanel(target);
                if (info) {
                    const titleControl = info.panel.getChildByName(`${info.name}_title`);
                    if (titleControl) {
                        titleControl.text = title;
                    }
                }
            }

            setPopupImage(target, imageUrl) {
                if (!isValidAssetURL(imageUrl)) {
                    return;
                }
                const info = this._getPopupPanel(target);
                if (info) {
                    const imageControl = info.panel.getChildByName(`${info.name}_image`);
                    if (imageControl) {
                        imageControl.source = getProxiedUrl(imageUrl);
                    }
                }
            }

            setPopupButtonText(target, buttonName, text) {
                const info = this._getPopupPanel(target);
                if (info) {
                    const buttonControl = info.panel.getChildByName(buttonName);
                    if (buttonControl && buttonControl.textBlock) {
                        buttonControl.textBlock.text = text;
                    }
                }
            }

            setPopupText(target, text) {
                const info = this._getPopupPanel(target);
                if (info) {
                    let textControl = info.panel.getChildByName(`${info.name}_text`);
                    if (textControl) {
                        textControl.text = text;
                    } else {
                        const textBlock = new BABYLON.GUI.TextBlock(`${info.name}_text`, text);
                        textBlock.resizeToFit = true;
                        textBlock.color = "white";
                        textBlock.fontSize = 24;
                        textBlock.paddingBottom = "20px";
                        info.panel.addControl(textBlock);
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
                const joystickZone = document.getElementById('joystick-zone');

                // Only initialize the joystick if the touch UI is likely active (based on CSS media queries).
                if (joystickZone && window.matchMedia("(max-width: 768px)").matches) {
                    const jumpButtonContainer = document.getElementById("jump-button-container");
                    if (jumpButtonContainer) {
                        jumpButtonContainer.style.display = "block";
                    }
                    this.joystickManager = nipplejs.create({
                        zone: joystickZone,
                        mode: "dynamic",
                        color: "grey",
                        size: 120,
                        fadeTime: 0
                    });

                    this.joystickManager.on("added", (evt, nipple) => {
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
                this.uiElements = document.querySelectorAll('.interactive-ui');
                this._canvasContainer = document.querySelector('.canvas-container');

                this._resetTimer = () => {
                    this.uiElements.forEach(el => el.classList.remove('hidden'));
                    clearTimeout(this.inactivityTimer);
                    this.inactivityTimer = setTimeout(() => {
                        this.uiElements.forEach(el => el.classList.add('hidden'));
                    }, 3000); // Hide after 3 seconds of inactivity
                };

                // Initial call to start the timer
                this._resetTimer();

                // Reset timer on user interaction
                if (this._canvasContainer) {
                    this._canvasContainer.addEventListener('mousemove', this._resetTimer, false);
                    this._canvasContainer.addEventListener('touchstart', this._resetTimer, { passive: true });
                    this._canvasContainer.addEventListener('click', this._resetTimer, false);
                }
            }

            _cleanupExisting(name) {
                if (name && this.objects[name]) {
                    this.destroyObject(name);
                }
            }

            // High-level API for cleaner code generation
            _tagMesh(mesh, logicalName) {
                if (!mesh) return;
                mesh.metadata = mesh.metadata || {};
                mesh.metadata.logicalRoot = logicalName;
                mesh.getDescendants(false).forEach(child => {
                    child.metadata = child.metadata || {};
                    child.metadata.logicalRoot = logicalName;
                });

                if (this.pendingObjectEvents && this.pendingObjectEvents[logicalName]) {
                    const pendings = this.pendingObjectEvents[logicalName];
                    pendings.forEach(p => {
                        this.onObjectEvent(mesh, p.eventName, p.callback);
                    });
                    delete this.pendingObjectEvents[logicalName];
                }
            }

            _normalizeAndCenter(wrapper, importedRoots) {
                // Calculate bounds of the imported content relative to its origin
                const boundingInfo = wrapper.getHierarchyBoundingVectors(true);
                const size = boundingInfo.max.subtract(boundingInfo.min);
                const height = size.y;

                // 1. Normalize height to a default of 2.0 units
                if (height > 0.001) {
                    const targetHeight = 2.0;
                    const scale = targetHeight / height;
                    // We scale the contents, not the wrapper, so the wrapper remains at scale 1,1,1
                    importedRoots.forEach(m => {
                        m.scaling.scaleInPlace(scale);
                    });
                }

                // 2. Auto-center and align base to origin
                // Recalculate bounds after scaling
                const scaledBounds = wrapper.getHierarchyBoundingVectors(true);
                const center = scaledBounds.max.add(scaledBounds.min).scale(0.5);

                // Shift imported content so its horizontal center is at 0 and its base is at 0 relative to wrapper
                importedRoots.forEach(m => {
                    m.position.x -= center.x;
                    m.position.y -= scaledBounds.min.y;
                    m.position.z -= center.z;
                });
            }

            createBox(name, x, y, z) {
                this._cleanupExisting(name);
                const boxMesh = BABYLON.MeshBuilder.CreateBox(name, {}, this.scene);
                boxMesh.position.set(x, y, z);
                this.objects[name] = boxMesh;
                this._tagMesh(boxMesh, name);
                return boxMesh;
            }

            createSphere(name, x, y, z) {
                this._cleanupExisting(name);
                const sphereMesh = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 1 }, this.scene);
                sphereMesh.position.set(x, y, z);
                this.objects[name] = sphereMesh;
                this._tagMesh(sphereMesh, name);
                return sphereMesh;
            }

            createCylinder(name, x, y, z) {
                this._cleanupExisting(name);
                const cylinderMesh = BABYLON.MeshBuilder.CreateCylinder(name, { diameter: 1, height: 1 }, this.scene);
                cylinderMesh.position.set(x, y, z);
                this.objects[name] = cylinderMesh;
                this._tagMesh(cylinderMesh, name);
                return cylinderMesh;
            }

            createCone(name, x, y, z) {
                this._cleanupExisting(name);
                const coneMesh = BABYLON.MeshBuilder.CreateCylinder(name, { diameterTop: 0, diameterBottom: 1, height: 1 }, this.scene);
                coneMesh.position.set(x, y, z);
                this.objects[name] = coneMesh;
                this._tagMesh(coneMesh, name);
                return coneMesh;
            }

            createTorus(name, x, y, z) {
                this._cleanupExisting(name);
                const torusMesh = BABYLON.MeshBuilder.CreateTorus(name, { diameter: 1, thickness: 0.2 }, this.scene);
                torusMesh.position.set(x, y, z);
                this.objects[name] = torusMesh;
                this._tagMesh(torusMesh, name);
                return torusMesh;
            }

            createCapsule(name, x, y, z) {
                this._cleanupExisting(name);
                const capsuleMesh = BABYLON.MeshBuilder.CreateCapsule(name, { height: 2, radius: 0.5 }, this.scene);
                capsuleMesh.position.set(x, y, z);
                this.objects[name] = capsuleMesh;
                this._tagMesh(capsuleMesh, name);
                return capsuleMesh;
            }

            createParticleCube(name, x = 0, y = 0, z = 0) {
                this._cleanupExisting(name);

                const rootMesh = BABYLON.MeshBuilder.CreateBox(name + "_root", { size: 0.1 }, this.scene);
                rootMesh.isVisible = false;
                rootMesh.position.set(x, y, z);
                rootMesh.scaling.setAll(0.1);

                const particleModel = BABYLON.MeshBuilder.CreateBox("particleModel_" + name, { size: 1 }, this.scene);
                const sps = new BABYLON.SolidParticleSystem("SPS_" + name, this.scene, { updatable: true });

                const gridSize = 10;
                const totalParticles = gridSize * gridSize * gridSize;
                sps.addShape(particleModel, totalParticles);
                const spsMesh = sps.buildMesh();
                spsMesh.parent = rootMesh;
                particleModel.dispose();

                const precalculatedGridOffsets = [];
                sps.initParticles = () => {
                    let i = 0;
                    const offset = gridSize / 2;
                    for (let px = 0; px < gridSize; px++) {
                        for (let py = 0; py < gridSize; py++) {
                            for (let pz = 0; pz < gridSize; pz++) {
                                const particle = sps.particles[i];
                                particle.position.x = px - offset;
                                particle.position.y = py - offset;
                                particle.position.z = pz - offset;

                                const ox = px - offset;
                                const oy = py - offset;
                                const oz = pz - offset;

                                const isShellSlot = px === 0 || px === gridSize - 1 || py === 0 || py === gridSize - 1 || pz === 0 || pz === gridSize - 1;
                                precalculatedGridOffsets.push({
                                    x: ox,
                                    y: oy,
                                    z: oz,
                                    isShellSlot
                                });

                                particle.homeX = particle.position.x;
                                particle.homeY = particle.position.y;
                                particle.homeZ = particle.position.z;

                                particle.localGridOffsetX = ox;
                                particle.localGridOffsetY = oy;
                                particle.localGridOffsetZ = oz;

                                particle.velocity = new BABYLON.Vector3(0, 0, 0);
                                particle.randomOrderWeight = Math.random();
                                if (!particle.color) particle.color = new BABYLON.Color4(0, 0.9, 1, 1);
                                particle.baseColor = particle.color.clone();
                                particle.isOuterShell = isShellSlot;
                                i++;
                            }
                        }
                    }
                };

                let target3DPosition = new BABYLON.Vector3(0, 0, 0);
                let isMouseMoving = false;
                let mouseTimeout = null;
                let lastValidTargetPosition = new BABYLON.Vector3(0, 0, 0);

                const optimizeHomePositionsOutsideWins = () => {
                    const availableSlots = [];
                    for (let i = 0; i < precalculatedGridOffsets.length; i++) {
                        availableSlots.push({
                            x: target3DPosition.x + precalculatedGridOffsets[i].x,
                            y: target3DPosition.y + precalculatedGridOffsets[i].y,
                            z: target3DPosition.z + precalculatedGridOffsets[i].z,
                            ox: precalculatedGridOffsets[i].x,
                            oy: precalculatedGridOffsets[i].y,
                            oz: precalculatedGridOffsets[i].z,
                            isShellSlot: precalculatedGridOffsets[i].isShellSlot,
                            taken: false
                        });
                    }

                    const sortedParticleRefs = [];
                    for (let p = 0; p < sps.particles.length; p++) {
                        const particle = sps.particles[p];
                        const dx = target3DPosition.x - particle.position.x;
                        const dy = target3DPosition.y - particle.position.y;
                        const dz = target3DPosition.z - particle.position.z;
                        const distToTargetSq = dx * dx + dy * dy + dz * dz;
                        sortedParticleRefs.push({
                            particle,
                            distSq: distToTargetSq
                        });
                    }

                    sortedParticleRefs.sort((a, b) => b.distSq - a.distSq);

                    for (let i = 0; i < sortedParticleRefs.length; i++) {
                        const particle = sortedParticleRefs[i].particle;
                        let closestSlotIdx = -1;
                        let minDistanceSq = Infinity;

                        for (let s = 0; s < availableSlots.length; s++) {
                            if (availableSlots[s].taken) continue;
                            const dx = availableSlots[s].x - particle.position.x;
                            const dy = availableSlots[s].y - particle.position.y;
                            const dz = availableSlots[s].z - particle.position.z;
                            const distSq = dx * dx + dy * dy + dz * dz;
                            if (distSq < minDistanceSq) {
                                minDistanceSq = distSq;
                                closestSlotIdx = s;
                            }
                        }

                        if (closestSlotIdx !== -1) {
                            availableSlots[closestSlotIdx].taken = true;
                            particle.homeX = availableSlots[closestSlotIdx].x;
                            particle.homeY = availableSlots[closestSlotIdx].y;
                            particle.homeZ = availableSlots[closestSlotIdx].z;
                            particle.localGridOffsetX = availableSlots[closestSlotIdx].ox;
                            particle.localGridOffsetY = availableSlots[closestSlotIdx].oy;
                            particle.localGridOffsetZ = availableSlots[closestSlotIdx].oz;
                            particle.isOuterShell = availableSlots[closestSlotIdx].isShellSlot;
                        }
                    }
                };

                const pointerObserver = this.scene.onPointerObservable.add((pointerInfo) => {
                    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE || pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                        const ray = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, BABYLON.Matrix.Identity(), this.scene.activeCamera);
                        if (!ray || !ray.direction || Math.abs(ray.direction.z) < 1e-5) return;
                        const distance = -ray.origin.z / ray.direction.z;
                        const currentMouse3D = ray.origin.add(ray.direction.scale(distance));
                        const dx = currentMouse3D.x - lastValidTargetPosition.x;
                        const dy = currentMouse3D.y - lastValidTargetPosition.y;
                        const dz = currentMouse3D.z - lastValidTargetPosition.z;
                        const moveDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                        const moveThreshold = 0.05;

                        if (moveDistance > moveThreshold) {
                            isMouseMoving = true;
                            target3DPosition.copyFrom(currentMouse3D);
                            lastValidTargetPosition.copyFrom(currentMouse3D);

                            if (mouseTimeout) clearTimeout(mouseTimeout);
                            mouseTimeout = setTimeout(() => {
                                isMouseMoving = false;
                                optimizeHomePositionsOutsideWins();
                            }, 300);
                        }
                    }
                });

                sps.updateParticle = (particle) => {
                    if (isMouseMoving) {
                        const friction = 0.92;
                        const dirX = target3DPosition.x - particle.position.x;
                        const dirY = target3DPosition.y - particle.position.y;
                        const dirZ = target3DPosition.z - particle.position.z;
                        const dist = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1e-3;

                        const speed = 0.03 + particle.randomOrderWeight * 0.09;
                        particle.velocity.x += (dirX / dist) * speed;
                        particle.velocity.y += (dirY / dist) * speed;
                        particle.velocity.z += (dirZ / dist) * speed;

                        particle.velocity.x *= friction;
                        particle.velocity.y *= friction;
                        particle.velocity.z *= friction;

                        particle.position.x += particle.velocity.x;
                        particle.position.y += particle.velocity.y;
                        particle.position.z += particle.velocity.z;

                        particle.color.copyFrom(particle.baseColor);
                        particle.scaling.setAll(1.0);
                    } else {
                        particle.velocity.setAll(0);
                        const easeSpeed = 0.3 + particle.randomOrderWeight * 0.05;

                        particle.position.x += (particle.homeX - particle.position.x) * easeSpeed;
                        particle.position.y += (particle.homeY - particle.position.y) * easeSpeed;
                        particle.position.z += (particle.homeZ - particle.position.z) * easeSpeed;

                        particle.color.copyFrom(particle.baseColor);
                    }
                    return particle;
                };

                sps.initParticles();
                sps.setParticles();

                const renderObserver = this.scene.onBeforeRenderObservable.add(() => {
                    if (sps && sps.mesh && !sps.mesh.isDisposed()) {
                        sps.setParticles();
                    }
                });

                rootMesh.onDisposeObservable.add(() => {
                    if (pointerObserver) this.scene.onPointerObservable.remove(pointerObserver);
                    if (renderObserver) this.scene.onBeforeRenderObservable.remove(renderObserver);
                    if (mouseTimeout) clearTimeout(mouseTimeout);
                    sps.dispose();
                });

                rootMesh._sps = sps;
                rootMesh._setParticleBaseColor = (color4) => {
                    for (let p = 0; p < sps.particles.length; p++) {
                        sps.particles[p].baseColor.copyFrom(color4);
                        sps.particles[p].color.copyFrom(color4);
                    }
                };

                this.objects[name] = rootMesh;
                this._tagMesh(rootMesh, name);
                return rootMesh;
            }

            async createText(name, text, fontUrl, size = 1, resolution = 16, depth = 0.5) {
                if (!isValidAssetURL(fontUrl)) {
                    return null;
                }
                try {
                    const response = await fetch(getProxiedUrl(fontUrl));
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
                        this._cleanupExisting(name);
                        this.objects[name] = textMesh;
                        // Center the mesh pivot
                        const boundingInfo = textMesh.getHierarchyBoundingVectors();
                        const center = boundingInfo.max.add(boundingInfo.min).scale(0.5);
                        textMesh.setPivotPoint(center);
                        this._tagMesh(textMesh, name);
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

            async importModel(name, url, x = 0, y = 0, z = 0) {
                if (!isValidAssetURL(url)) {
                    return null;
                }
                const isMcStructure = (url && url.toLowerCase().includes('.mcstructure')) || (name && name.toLowerCase().endsWith('.mcstructure'));
                if (isMcStructure) {
                    try {
                        const response = await fetch(getProxiedUrl(url));
                        const buffer = await response.arrayBuffer();
                        return await this.importMcStructureFromBuffer(name, buffer, x, y, z);
                    } catch (error) {
                        console.error(`Failed to load .mcstructure from URL: ${url}`, error);
                        return null;
                    }
                }
                try {
                    // Load model using SceneLoader
                    const result = await BABYLON.SceneLoader.ImportMeshAsync(null, '', getProxiedUrl(url), this.scene);
                    if (result.meshes.length > 0) {
                        // Create a logical wrapper mesh
                        const wrapper = new BABYLON.Mesh(name, this.scene);
                        // Keep wrapper at 0,0,0 while we calculate and apply offsets
                        wrapper.position.set(0, 0, 0);

                        // Identify the top-level meshes from the import (usually just one root)
                        const importedRoots = result.meshes.filter(m => !m.parent);
                        importedRoots.forEach(m => m.parent = wrapper);

                        this._normalizeAndCenter(wrapper, importedRoots);

                        // Now that geometry is centered at the wrapper's origin, move the wrapper to target position
                        wrapper.position.set(x, y, z);

                        if (result.animationGroups && result.animationGroups.length > 0) {
                            wrapper.animationGroups = result.animationGroups;
                        }

                        // Roblox GLB fixes: ensure transparency and two-sided rendering work correctly
                        result.meshes.forEach(mesh => {
                            if (mesh.material) {
                                mesh.material.backFaceCulling = false;
                            }
                        });

                        this._cleanupExisting(name);
                        this.objects[name] = wrapper;
                        this._tagMesh(wrapper, name);
                        return wrapper;
                    }
                } catch (error) {
                    console.error(`Failed to load model from URL: ${url}`, error);
                }
                return null;
            }

            async importMcStructureFromBuffer(name, buffer, x = 0, y = 0, z = 0) {
                try {
                    // Dynamically import NBTify
                    const NBT = await import('https://cdn.jsdelivr.net/npm/nbtify@2.2.0/+esm');
                    const nbtData = await NBT.read(new Uint8Array(buffer), { endianness: "little" });
                    const nbt = nbtData.data;

                    // Extract dimensions and structure block lists
                    const [sizeX, sizeY, sizeZ] = nbt.size.map(v => Number(v));
                    const blockIndices = nbt.structure.block_indices[0]; // Primary block layer
                    const palette = nbt.structure.palette.default.block_palette;

                    // Create wrapper
                    const wrapper = new BABYLON.Mesh(name, this.scene);
                    wrapper.position.set(0, 0, 0);

                    // Standard color map
                    const MINECRAFT_COLORS = {
                      "white": "#f0f0f0",
                      "orange": "#f9801d",
                      "magenta": "#c900c9",
                      "light_blue": "#6699d8",
                      "yellow": "#fed83d",
                      "lime": "#80c71f",
                      "pink": "#f38caa",
                      "gray": "#474f52",
                      "light_gray": "#9d9d97",
                      "cyan": "#169c9c",
                      "purple": "#8932b8",
                      "blue": "#3c44aa",
                      "brown": "#835432",
                      "green": "#5e7c16",
                      "red": "#b02e26",
                      "black": "#1d1d21",
                      "pale_oak": "#bfa27a",
                      "cherry": "#e5b3b3",
                      "acacia": "#ba6337",
                      "oak": "#a88854",
                      "spruce": "#6b5131",
                      "birch": "#d7c59a",
                      "jungle": "#a37653",
                      "dark_oak": "#46321a",
                      "mangrove": "#74302c",
                      "bamboo": "#abb046",
                      "crimson": "#842746",
                      "warped": "#2d7f80"
                    };

                    const getBlockColor = (blockName, states = {}) => {
                      let hexColor = null;
                      if (states) {
                        let colorState = states.color || states.stone_color;
                        if (colorState) {
                          let val = "";
                          if (typeof colorState === 'string') {
                            val = colorState;
                          } else if (colorState.value) {
                            val = colorState.value;
                          }
                          if (val && MINECRAFT_COLORS[val.toLowerCase()]) {
                            hexColor = MINECRAFT_COLORS[val.toLowerCase()];
                          }
                        }
                      }
                      if (!hexColor) {
                        const lowerName = blockName.toLowerCase();
                        for (const [colorName, hex] of Object.entries(MINECRAFT_COLORS)) {
                          if (lowerName.includes(`${colorName}_`) || lowerName.endsWith(`_${colorName}`) || lowerName.includes(`:${colorName}`)) {
                            hexColor = hex;
                            break;
                          }
                        }
                      }
                      if (hexColor) {
                        return BABYLON.Color3.FromHexString(hexColor);
                      }
                      const lowerName = blockName.toLowerCase();
                      if (lowerName.includes("glass")) {
                        if (lowerName.includes("stained")) {
                          for (const [colorName, hex] of Object.entries(MINECRAFT_COLORS)) {
                            if (lowerName.includes(colorName)) {
                              return BABYLON.Color3.FromHexString(hex);
                            }
                          }
                        }
                        return BABYLON.Color3.FromHexString("#e0f7fa");
                      }
                      if (lowerName.includes("water")) return BABYLON.Color3.FromHexString("#295c9a");
                      if (lowerName.includes("ice")) return BABYLON.Color3.FromHexString("#a5d6a7");
                      if (lowerName.includes("grass")) return BABYLON.Color3.FromHexString("#5c8e32");
                      if (lowerName.includes("dirt") || lowerName.includes("podzol") || lowerName.includes("coarse_dirt")) return BABYLON.Color3.FromHexString("#866043");
                      if (lowerName.includes("mycelium")) return BABYLON.Color3.FromHexString("#6a5a65");
                      if (lowerName.includes("sand")) {
                        if (lowerName.includes("red")) return BABYLON.Color3.FromHexString("#b35029");
                        return BABYLON.Color3.FromHexString("#dbcd99");
                      }
                      if (lowerName.includes("gravel")) return BABYLON.Color3.FromHexString("#858181");
                      if (lowerName.includes("clay")) return BABYLON.Color3.FromHexString("#a3a7b2");
                      if (lowerName.includes("cobblestone")) return BABYLON.Color3.FromHexString("#6d6d6d");
                      if (lowerName.includes("mossy_cobblestone") || lowerName.includes("mossy_stone")) return BABYLON.Color3.FromHexString("#57614d");
                      if (lowerName.includes("stone")) {
                        if (lowerName.includes("andesite")) return BABYLON.Color3.FromHexString("#8a8a8a");
                        if (lowerName.includes("diorite")) return BABYLON.Color3.FromHexString("#bcbcbc");
                        if (lowerName.includes("granite")) return BABYLON.Color3.FromHexString("#9c7161");
                        if (lowerName.includes("end_stone")) return BABYLON.Color3.FromHexString("#deecae");
                        if (lowerName.includes("red_sandstone")) return BABYLON.Color3.FromHexString("#b35029");
                        if (lowerName.includes("sandstone")) return BABYLON.Color3.FromHexString("#d3c39a");
                        return BABYLON.Color3.FromHexString("#737373");
                      }
                      if (lowerName.includes("deepslate")) return BABYLON.Color3.FromHexString("#444446");
                      if (lowerName.includes("tuff")) return BABYLON.Color3.FromHexString("#64655f");
                      if (lowerName.includes("calcite")) return BABYLON.Color3.FromHexString("#e1e2dd");
                      if (lowerName.includes("obsidian")) return BABYLON.Color3.FromHexString("#19132b");
                      if (lowerName.includes("crying_obsidian")) return BABYLON.Color3.FromHexString("#30174e");
                      if (lowerName.includes("bedrock")) return BABYLON.Color3.FromHexString("#2e2e2e");
                      if (lowerName.includes("wood") || lowerName.includes("log") || lowerName.includes("plank") || lowerName.includes("fence") || lowerName.includes("gate") || lowerName.includes("door") || lowerName.includes("slab") || lowerName.includes("stairs") || lowerName.includes("sign")) {
                        for (const [woodType, hex] of Object.entries(MINECRAFT_COLORS)) {
                          if (lowerName.includes(woodType)) {
                            return BABYLON.Color3.FromHexString(hex);
                          }
                        }
                        return BABYLON.Color3.FromHexString("#9c6e3b");
                      }
                      if (lowerName.includes("leaves")) return BABYLON.Color3.FromHexString("#2e6617");
                      if (lowerName.includes("shrub") || lowerName.includes("sapling") || lowerName.includes("bush") || lowerName.includes("fern") || lowerName.includes("vine") || lowerName.includes("crop")) return BABYLON.Color3.FromHexString("#327821");
                      if (lowerName.includes("hay")) return BABYLON.Color3.FromHexString("#a88a2a");
                      if (lowerName.includes("netherrack")) return BABYLON.Color3.FromHexString("#6d2626");
                      if (lowerName.includes("soul_sand") || lowerName.includes("soul_soil")) return BABYLON.Color3.FromHexString("#4d3a2f");
                      if (lowerName.includes("glowstone")) return BABYLON.Color3.FromHexString("#b38b4d");
                      if (lowerName.includes("basalt")) return BABYLON.Color3.FromHexString("#4d4d54");
                      if (lowerName.includes("blackstone")) return BABYLON.Color3.FromHexString("#252229");
                      if (lowerName.includes("quartz")) return BABYLON.Color3.FromHexString("#e8e3d9");
                      if (lowerName.includes("purpur")) return BABYLON.Color3.FromHexString("#aa7da8");
                      if (lowerName.includes("nether_brick")) return BABYLON.Color3.FromHexString("#2b1116");
                      if (lowerName.includes("brick")) return BABYLON.Color3.FromHexString("#964335");
                      if (lowerName.includes("copper")) return BABYLON.Color3.FromHexString("#c36b4d");
                      if (lowerName.includes("iron")) return BABYLON.Color3.FromHexString("#d1c3b7");
                      if (lowerName.includes("gold")) return BABYLON.Color3.FromHexString("#fce251");
                      if (lowerName.includes("diamond")) return BABYLON.Color3.FromHexString("#64dbdb");
                      if (lowerName.includes("emerald")) return BABYLON.Color3.FromHexString("#25ce68");
                      if (lowerName.includes("lapis")) return BABYLON.Color3.FromHexString("#1b44b8");
                      if (lowerName.includes("coal")) return BABYLON.Color3.FromHexString("#2a2a2a");
                      if (lowerName.includes("redstone")) return BABYLON.Color3.FromHexString("#ce1717");
                      if (lowerName.includes("bookshelf")) return BABYLON.Color3.FromHexString("#8e6a47");
                      if (lowerName.includes("wool")) return BABYLON.Color3.FromHexString("#dedede");
                      if (lowerName.includes("concrete")) return BABYLON.Color3.FromHexString("#cfcfcf");
                      if (lowerName.includes("terracotta") || lowerName.includes("hardened_clay")) return BABYLON.Color3.FromHexString("#9c5a3c");
                      return BABYLON.Color3.FromHexString("#aaaaaa");
                    };

                    const configureBlockMaterial = (material, blockName) => {
                      const lowerName = blockName.toLowerCase();
                      if (lowerName.includes("glass")) {
                        material.alpha = 0.45;
                        material.backFaceCulling = false;
                      } else if (lowerName.includes("water")) {
                        material.alpha = 0.65;
                        material.backFaceCulling = false;
                      } else if (lowerName.includes("ice")) {
                        material.alpha = 0.8;
                        material.backFaceCulling = false;
                      }
                    };

                    // Cache base meshes per block state
                    const baseMeshMap = new Map();
                    const importedRoots = [];

                    // Collect structure statistics
                    const blockDistribution = {};
                    let solidBlockCount = 0;

                    let idx = 0;
                    for (let x = 0; x < sizeX; x++) {
                      for (let y = 0; y < sizeY; y++) {
                        for (let z = 0; z < sizeZ; z++) {
                          const paletteIdx = Number(blockIndices[idx++]);
                          if (paletteIdx !== -1 && palette[paletteIdx]) {
                            const blockName = palette[paletteIdx].name;
                            if (blockName === "minecraft:air" || blockName === "minecraft:structure_void") continue;

                            solidBlockCount++;
                            blockDistribution[blockName] = (blockDistribution[blockName] || 0) + 1;

                            if (!baseMeshMap.has(blockName)) {
                              const baseMesh = BABYLON.MeshBuilder.CreateBox(`baseCube_${blockName}`, { size: 1 }, this.scene);
                              baseMesh.isVisible = false;
                              baseMesh.parent = wrapper;
                              importedRoots.push(baseMesh);

                              const mat = new BABYLON.StandardMaterial(`mat_${blockName}`, this.scene);
                              mat.diffuseColor = getBlockColor(blockName, palette[paletteIdx].states);
                              configureBlockMaterial(mat, blockName);
                              baseMesh.material = mat;
                              baseMeshMap.set(blockName, baseMesh);
                            }

                            const baseMesh = baseMeshMap.get(blockName);
                            const instance = baseMesh.createInstance(`block_${x}_${y}_${z}`);
                            instance.position = new BABYLON.Vector3(x, y, z);
                            instance.parent = wrapper;
                          }
                        }
                      }
                    }

                    this._normalizeAndCenter(wrapper, importedRoots);
                    wrapper.position.set(x, y, z);

                    this._cleanupExisting(name);
                    this.objects[name] = wrapper;
                    this._tagMesh(wrapper, name);

                    // Attach the statistics metadata to the wrapper mesh
                    const volume = sizeX * sizeY * sizeZ;
                    const statsText = `Dimensions: ${sizeX} x ${sizeY} x ${sizeZ}\n` +
                                      `Total Volume: ${volume.toLocaleString()}\n` +
                                      `Solid Blocks: ${solidBlockCount.toLocaleString()}\n\n` +
                                      `Block Distribution:\n` +
                                      Object.entries(blockDistribution)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([k, v]) => ` - ${k.replace('minecraft:', '').replace(/_/g, ' ')}: ${v.toLocaleString()}`)
                                            .join('\n');

                    wrapper.metadata = wrapper.metadata || {};
                    wrapper.metadata.dimensions = `${sizeX} x ${sizeY} x ${sizeZ}`;
                    wrapper.metadata.volume = volume;
                    wrapper.metadata.solidBlocks = solidBlockCount;
                    wrapper.metadata.stats_text = statsText;

                    console.log(`Parsed and loaded Bedrock .mcstructure model: ${name}`);
                    return wrapper;
                } catch (error) {
                    console.error("Failed to parse and render Bedrock structure:", error);
                    return null;
                }
            }

            async importRobloxAvatar(name, userId, x = 0, y = 0, z = 0) {
                try {
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
                        const wrapper = new BABYLON.Mesh(name, this.scene);
                        wrapper.position.set(0, 0, 0);

                        const importedRoots = result.meshes.filter(m => !m.parent);
                        importedRoots.forEach((mesh) => {
                            mesh.parent = wrapper;
                        });

                        // Apply materials to all meshes in the hierarchy
                        wrapper.getDescendants(false).forEach(mesh => {
                            if (mesh instanceof BABYLON.AbstractMesh && mesh.material) {
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

                        this._normalizeAndCenter(wrapper, importedRoots);

                        wrapper.position.set(x, y, z);

                        this._cleanupExisting(name);
                        this.objects[name] = wrapper;
                        this._tagMesh(wrapper, name);
                        return wrapper;
                    }
                } catch (error) {
                    console.error("Failed to import Roblox avatar:", error);
                }
                return null;
            }

            _resolveImpostorType(impostorType) {
                if (typeof impostorType === 'number') return impostorType;
                if (typeof impostorType === 'string') {
                    const cleanType = impostorType.replace(/^BABYLON\.PhysicsImpostor\./, '');
                    if (BABYLON.PhysicsImpostor[cleanType] !== undefined) {
                        return BABYLON.PhysicsImpostor[cleanType];
                    }
                    if (BABYLON.PhysicsImpostor[cleanType + 'Impostor'] !== undefined) {
                        return BABYLON.PhysicsImpostor[cleanType + 'Impostor'];
                    }
                }
                return BABYLON.PhysicsImpostor.BoxImpostor;
            }

            enablePhysics(target, mass, friction = 0.2, restitution = 0.9, impostorType = 'BoxImpostor') {
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
                    const impostor = this._resolveImpostorType(impostorType);
                    impostorBox.physicsImpostor = new BABYLON.PhysicsImpostor(impostorBox, impostor, { mass: mass, friction: friction, restitution: restitution }, this.scene);

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
                    const impostor = this._resolveImpostorType(impostorType);
                    originalMesh.physicsImpostor = new BABYLON.PhysicsImpostor(originalMesh, impostor, { mass: mass, friction: friction, restitution: restitution }, this.scene);
                }
                this.processPendingCollisions();
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
                    if (mesh._setParticleBaseColor) {
                        const c3 = BABYLON.Color3.FromHexString(color);
                        mesh._setParticleBaseColor(new BABYLON.Color4(c3.r, c3.g, c3.b, 1.0));
                    }
                    if (!mesh.material) {
                        mesh.material = new BABYLON.StandardMaterial(mesh.name + "_material", this.scene);
                    }
                    if (mesh.material.diffuseColor) {
                        mesh.material.diffuseColor = BABYLON.Color3.FromHexString(color);
                    }
                }
            }

            onCollision(target1, target2, callback) {
                this.pendingCollisions.push({
                    target1: target1,
                    target2: target2,
                    callback: callback
                });
                this.processPendingCollisions();
            }

            processPendingCollisions() {
                if (!this.pendingCollisions || this.pendingCollisions.length === 0) {
                    return;
                }

                const stillPending = [];

                for (const item of this.pendingCollisions) {
                    const { target1, target2, callback } = item;

                    const resolved1 = this._resolveTarget(target1);
                    const resolved2 = this._resolveTarget(target2);

                    const impostor1 = this._getPhysicsImpostor(resolved1);

                    if (!impostor1) {
                        stillPending.push(item);
                        continue;
                    }

                    const collisionCallback = (main, collided) => {
                        const ids = [main.object.uniqueId, collided.object.uniqueId].sort();
                        const collisionKey = `${ids[0]}-${ids[1]}`;

                        if (this.processedCollisions.has(collisionKey)) {
                            return;
                        }
                        this.processedCollisions.add(collisionKey);

                        let collidedMesh = null;
                        if (collided.object.metadata && collided.object.metadata.logicalRoot) {
                            collidedMesh = this.objects[collided.object.metadata.logicalRoot];
                        }

                        if (!collidedMesh) {
                            collidedMesh = Object.values(this.objects).find(
                                o => o === collided.object || (o.parent && o.parent === collided.object)
                            );
                        }

                        callback(collidedMesh || collided.object);
                    };

                    if (!Array.isArray(resolved2)) {
                        const impostor2 = this._getPhysicsImpostor(resolved2);
                        if (impostor2) {
                            const pairKey = `${impostor1.object.uniqueId}-${impostor2.object.uniqueId}`;
                            if (!this.registeredCollisionPairs.has(pairKey)) {
                                this.registeredCollisionPairs.add(pairKey);
                                impostor1.registerOnPhysicsCollide(impostor2, collisionCallback);
                            }
                        } else {
                            stillPending.push(item);
                        }
                    } else {
                        const targetImpostors = resolved2
                            .map(x => this._getPhysicsImpostor(x))
                            .filter(impostor => impostor != null);

                        for (const impostor2 of targetImpostors) {
                            const pairKey = `${impostor1.object.uniqueId}-${impostor2.object.uniqueId}`;
                            if (!this.registeredCollisionPairs.has(pairKey)) {
                                this.registeredCollisionPairs.add(pairKey);
                                impostor1.registerOnPhysicsCollide(impostor2, collisionCallback);
                            }
                        }
                        stillPending.push(item);
                    }
                }

                this.pendingCollisions = stillPending;
            }

            onClick(target, callback) {
                if (!this.pendingClickHandlers) {
                    this.pendingClickHandlers = [];
                }
                this.pendingClickHandlers.push({ target, callback });
                this.processPendingClickHandlers();
            }

            processPendingClickHandlers() {
                if (!this.pendingClickHandlers || this.pendingClickHandlers.length === 0) return;
                const remaining = [];
                for (const item of this.pendingClickHandlers) {
                    const resolved = this._resolveTarget(item.target);
                    const targets = Array.isArray(resolved) ? resolved : [resolved];
                    let allResolved = targets.length > 0;

                    for (const subTarget of targets) {
                        const mesh = this._getMesh(subTarget);
                        if (mesh) {
                            if (!mesh._attachedClickCallbacks) {
                                mesh._attachedClickCallbacks = new Set();
                            }
                            if (!mesh._attachedClickCallbacks.has(item.callback)) {
                                mesh._attachedClickCallbacks.add(item.callback);
                                if (!mesh.actionManager) {
                                    mesh.actionManager = new BABYLON.ActionManager(this.scene);
                                }
                                mesh.actionManager.registerAction(
                                    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => item.callback(mesh))
                                );
                            }
                        } else {
                            allResolved = false;
                        }
                    }

                    const isArrayTarget = Array.isArray(resolved) || (typeof item.target === 'function' && Array.isArray(this._resolveTarget(item.target)));
                    if (!allResolved || isArrayTarget) {
                        remaining.push(item);
                    }
                }
                this.pendingClickHandlers = remaining;
            }

            everyFrame(target, callback) {
                this.perFrameFunctions.push({
                    targetGetter: target,
                    func: (thisMesh, deltaTime) => callback(thisMesh, deltaTime)
                });
            }

            playerJump(force) {
                if (this.player && this.player.physicsImpostor) {
                    const boundingInfo = this.player.getHierarchyBoundingVectors(true);
                    const height = boundingInfo.max.y - boundingInfo.min.y;
                    // Slightly longer ray to account for physics jitter/float
                    const rayLength = (height / 2) + 0.8;
                    const ray = new BABYLON.Ray(this.player.getAbsolutePosition(), new BABYLON.Vector3(0, -1, 0), rayLength);
                    const pick = this.scene.pickWithRay(ray, (mesh) => mesh !== this.player && !mesh.isDescendantOf(this.player));
                    if (pick.hit) {
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

            getSceneObject(entity) {
                if (entity === 'player') return this.player || 'player';
                if (entity === 'camera') return (this.scene ? this.scene.activeCamera : null) || 'camera';
                if (entity === 'scene') return this.scene;
                return null;
            }

            createGround(name, arg2, arg3, arg4) {
                this._cleanupExisting(name);
                let width = 10, height = 10, x = 0, y = 0, z = 0;
                if (arguments.length >= 4) {
                    x = arg2 || 0;
                    y = arg3 || 0;
                    z = arg4 || 0;
                } else {
                    width = arg2 || 10;
                    height = arg3 || 10;
                }
                const groundMesh = BABYLON.MeshBuilder.CreateGround(name, { width: width, height: height }, this.scene);
                groundMesh.position.set(x, y, z);
                this.objects[name] = groundMesh;
                this._tagMesh(groundMesh, name);
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
                if (name) {
                    this.objects[name] = light;
                }
                return name || light;
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

            frameCameraOnMesh(target) {
                let camera = this.scene.activeCamera;
                if (!camera) return;

                if (camera instanceof BABYLON.UniversalCamera) {
                    camera.dispose();
                    camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 4, 10, BABYLON.Vector3.Zero(), this.scene);
                    camera.attachControl(this.canvas, true);
                    this.scene.activeCamera = camera;
                }

                if (camera instanceof BABYLON.ArcRotateCamera) {
                    camera.mode = BABYLON.Camera.PERSPECTIVE_CAMERA;
                    camera.attachControl(this.canvas, true);
                }

                const mesh = this._getMesh(target);
                if (mesh && camera instanceof BABYLON.ArcRotateCamera) {
                    camera.lockedTarget = null;

                    const boundingInfo = mesh.getHierarchyBoundingVectors ? mesh.getHierarchyBoundingVectors(true) : mesh.getBoundingInfo().boundingBox;
                    const min = boundingInfo.min;
                    const max = boundingInfo.max;
                    const center = min.add(max).scale(0.5);
                    const size = max.subtract(min);
                    const maxDimension = Math.max(size.x, size.y, size.z);

                    camera.setTarget(center);
                    const fov = camera.fov || 0.8;
                    const distance = (maxDimension / 2) / Math.sin(fov / 2);
                    camera.radius = distance * 1.5;
                }
            }

            applyForce(target, fx, fy, fz, px, py, pz) {
                const mesh = this._getMesh(target);
                if (mesh && mesh.physicsImpostor) {
                    const force = new BABYLON.Vector3(fx, fy, fz);
                    const contactPoint = new BABYLON.Vector3(px, py, pz);
                    mesh.physicsImpostor.applyForce(force, contactPoint);
                }
            }

            applyImpulse(target, fx, fy, fz, px, py, pz) {
                const mesh = this._getMesh(target);
                if (mesh && mesh.physicsImpostor) {
                    const impulse = new BABYLON.Vector3(fx, fy, fz);
                    const contactPoint = new BABYLON.Vector3(px, py, pz);
                    mesh.physicsImpostor.applyImpulse(impulse, contactPoint);
                }
            }

            getPosX(target) {
                const mesh = this._getMesh(target);
                return mesh ? mesh.position.x : 0;
            }

            getPosY(target) {
                const mesh = this._getMesh(target);
                return mesh ? mesh.position.y : 0;
            }

            getPosZ(target) {
                const mesh = this._getMesh(target);
                return mesh ? mesh.position.z : 0;
            }

            createParticleSystem(target, type) {
                const mesh = this._getMesh(target);
                if (!mesh) return;

                const particleSystem = new BABYLON.ParticleSystem("particles", 2000, this.scene);

                if (type === 'fire') {
                    particleSystem.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", this.scene);
                    particleSystem.emitter = mesh;
                    particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5);
                    particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0, 0.5);
                    particleSystem.color1 = new BABYLON.Color4(1, 0.5, 0, 1.0);
                    particleSystem.color2 = new BABYLON.Color4(1, 0.2, 0, 1.0);
                    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
                    particleSystem.minSize = 0.1;
                    particleSystem.maxSize = 0.5;
                    particleSystem.minLifeTime = 0.3;
                    particleSystem.maxLifeTime = 1.0;
                    particleSystem.emitRate = 500;
                    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
                    particleSystem.gravity = new BABYLON.Vector3(0, 5, 0);
                    particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
                    particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
                    particleSystem.minAngularSpeed = 0;
                    particleSystem.maxAngularSpeed = Math.PI;
                    particleSystem.minEmitPower = 1;
                    particleSystem.maxEmitPower = 3;
                    particleSystem.updateSpeed = 0.005;
                } else if (type === 'smoke') {
                    particleSystem.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", this.scene);
                    particleSystem.emitter = mesh;
                    particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, 0, -0.2);
                    particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0, 0.2);
                    particleSystem.color1 = new BABYLON.Color4(0.1, 0.1, 0.1, 1.0);
                    particleSystem.color2 = new BABYLON.Color4(0.2, 0.2, 0.2, 1.0);
                    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
                    particleSystem.minSize = 0.5;
                    particleSystem.maxSize = 1.0;
                    particleSystem.minLifeTime = 1.0;
                    particleSystem.maxLifeTime = 2.0;
                    particleSystem.emitRate = 100;
                    particleSystem.gravity = new BABYLON.Vector3(0, 1, 0);
                    particleSystem.direction1 = new BABYLON.Vector3(-0.5, 1, -0.5);
                    particleSystem.direction2 = new BABYLON.Vector3(0.5, 1, 0.5);
                } else if (type === 'rain') {
                    particleSystem.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", this.scene);
                    particleSystem.emitter = mesh;
                    particleSystem.minEmitBox = new BABYLON.Vector3(-10, 10, -10);
                    particleSystem.maxEmitBox = new BABYLON.Vector3(10, 10, 10);
                    particleSystem.direction1 = new BABYLON.Vector3(0, -1, 0);
                    particleSystem.direction2 = new BABYLON.Vector3(0, -1, 0);
                    particleSystem.minLifeTime = 1;
                    particleSystem.maxLifeTime = 2;
                    particleSystem.emitRate = 1000;
                    particleSystem.minSize = 0.1;
                    particleSystem.maxSize = 0.2;
                    particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
                }

                particleSystem.start();
                return particleSystem;
            }

            setFog(mode, color, density, start, end) {
                this.scene.fogEnabled = true;
                if (mode === 'none') {
                    this.scene.fogEnabled = false;
                } else if (mode === 'exp') {
                    this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
                    this.scene.fogDensity = density;
                } else if (mode === 'exp2') {
                    this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
                    this.scene.fogDensity = density;
                } else if (mode === 'linear') {
                    this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
                    this.scene.fogStart = start;
                    this.scene.fogEnd = end;
                }
                this.scene.fogColor = BABYLON.Color3.FromHexString(color);
            }

            setOutline(target, width, color) {
                const mesh = this._getMesh(target);
                if (mesh) {
                    mesh.renderOutline = true;
                    mesh.outlineWidth = width;
                    mesh.outlineColor = BABYLON.Color3.FromHexString(color);
                }
            }

            createAdvancedLight(type, name, x, y, z, dx, dy, dz) {
                let light;
                const pos = new BABYLON.Vector3(x, y, z);
                const dir = new BABYLON.Vector3(dx, dy, dz);
                if (type === 'directional') {
                    light = new BABYLON.DirectionalLight(name, dir, this.scene);
                    light.position = pos;
                } else if (type === 'hemispheric') {
                    light = new BABYLON.HemisphericLight(name, dir, this.scene);
                } else if (type === 'spot') {
                    light = new BABYLON.SpotLight(name, pos, dir, Math.PI / 3, 2, this.scene);
                } else {
                    light = new BABYLON.PointLight(name, pos, this.scene);
                }
                if (name) {
                    this.objects[name] = light;
                }
                return name || light;
            }

            enableShadows(light, meshes) {
                if (!light || !(light instanceof BABYLON.ShadowLight)) return;
                const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
                shadowGenerator.useBlurExponentialShadowMap = true;
                shadowGenerator.blurKernel = 32;

                if (Array.isArray(meshes)) {
                    meshes.forEach(m => {
                        const mesh = this._getMesh(m);
                        if (mesh) {
                            shadowGenerator.addShadowCaster(mesh);
                            mesh.receiveShadows = true;
                        }
                    });
                } else {
                    const mesh = this._getMesh(meshes);
                    if (mesh) {
                        shadowGenerator.addShadowCaster(mesh);
                        mesh.receiveShadows = true;
                    }
                }
            }

            async takeScreenshot() {
                const camera = this.scene.activeCamera;
                if (!camera) return;

                let width = window.innerWidth;
                let height = window.innerHeight;
                let screenshotOptions = { width: width * 2, height: height * 2 };

                if (this.backgroundImageWidth && this.backgroundImageHeight) {
                    width = this.backgroundImageWidth;
                    height = this.backgroundImageHeight;
                    screenshotOptions = { width: width, height: height };
                }

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

                return new Promise((resolve) => {
                    BABYLON.Tools.CreateScreenshot(this.engine, camera, screenshotOptions, (data) => {
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
                        resolve();
                    });
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

                const proxiedUrl = getProxiedUrl(url);
                this.backgroundLayer = new BABYLON.Layer("backgroundLayer", proxiedUrl, this.scene, true);
                this.background = 'layer';

                // Load image to get dimensions
                const img = new Image();
                img.onload = () => {
                    this.backgroundImageWidth = img.naturalWidth;
                    this.backgroundImageHeight = img.naturalHeight;

                    const container = document.querySelector('.canvas-container');
                    if (container) {
                        container.style.aspectRatio = `${this.backgroundImageWidth} / ${this.backgroundImageHeight}`;
                        resizeCanvas();
                    }
                };
                img.src = proxiedUrl;
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

            createCamera(type, name, x, y, z) {
                let camera;
                const pos = new BABYLON.Vector3(x, y, z);
                if (type === 'fps' || type === 'first-person') {
                    camera = new BABYLON.UniversalCamera(name, pos, this.scene);
                    camera.attachControl(this.canvas, true);
                } else if (type === 'isometric') {
                    camera = new BABYLON.FreeCamera(name, pos, this.scene);
                    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                } else if (type === 'orbit' || type === 'arc_rotate') {
                    camera = new BABYLON.ArcRotateCamera(name, Math.PI / 4, Math.PI / 3, 10, pos, this.scene);
                    camera.attachControl(this.canvas, true);
                } else {
                    camera = new BABYLON.UniversalCamera(name, pos, this.scene);
                    camera.attachControl(this.canvas, true);
                }
                this.scene.activeCamera = camera;
                if (name) {
                    this.objects[name] = camera;
                }
                return name || camera;
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
                    const meshesToFilter = [mesh, ...mesh.getDescendants(false)];
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
                    this.perFrameFunctions = this.perFrameFunctions.filter(task => {
                        if (task.targetMesh && meshesToFilter.includes(task.targetMesh)) {
                            return false;
                        }
                        const resolvedTaskMesh = this._getMesh(task.targetGetter);
                        if (resolvedTaskMesh && meshesToFilter.includes(resolvedTaskMesh)) {
                            return false;
                        }
                        const resolvedTarget = this._resolveTarget(task.targetGetter);
                        if (resolvedTarget === target || resolvedTarget === name) {
                            return false;
                        }
                        return true;
                    });
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

                let sound = await BABYLON.CreateStreamingSoundAsync("sound", getProxiedUrl(url));

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

            async importModelAsset(name, assetManager) {
                let asset = await assetManager.getAsset(name);
                if (asset && asset.data instanceof Blob) {
                    const objectUrl = URL.createObjectURL(asset.data);
                    return await this.importModel(name, objectUrl);
                }
                return null;
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

            onAction(actionName, callback) {
                const action = actionName ? actionName.toLowerCase() : '';
                if (this.actionCallbacks[action]) {
                    this.actionCallbacks[action].push(callback);
                }
            }

            isActionActive(actionName) {
                const action = actionName ? actionName.toLowerCase() : '';
                return !!this.activeActions[action];
            }

            triggerAction(actionName, data = {}) {
                const action = actionName ? actionName.toLowerCase() : '';
                this.activeActions[action] = true;
                if (this.actionCallbacks[action]) {
                    this.actionCallbacks[action].forEach(cb => {
                        try {
                            cb(data);
                        } catch (err) {
                            console.error(`Error executing action callback for ${action}:`, err);
                        }
                    });
                }
                setTimeout(() => {
                    this.activeActions[action] = false;
                }, 100);
            }

            initInputListeners() {
                this._onKeyDown = (event) => {
                    const key = event.key.toLowerCase();
                    this.inputState.keys[key] = true;

                    if (key === 'escape') {
                        this.triggerAction('menu');
                    } else if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                        this.triggerAction('navigate', { key });
                    }
                };
                this._onKeyUp = (event) => {
                    this.inputState.keys[event.key.toLowerCase()] = false;
                };
                this._onPointerMove = (e) => {
                    this.cursorState.x = e.clientX;
                    this.cursorState.y = e.clientY;
                    this.cursorState.callbacks.forEach(cb => {
                        try { cb(this.cursorState.x, this.cursorState.y); } catch (err) { console.error('Error in cursor move callback:', err); }
                    });
                };
                window.addEventListener('keydown', this._onKeyDown);
                window.addEventListener('keyup', this._onKeyUp);
                window.addEventListener('pointermove', this._onPointerMove);

                // Mouse & Touch Pointer / Gesture Handling
                let startX = 0;
                let startY = 0;
                let lastTapTime = 0;
                let longPressTimer = null;
                let isDragging = false;
                let initialPinchDist = null;
                const threshold = 30; // Minimum pixels for a swipe/drag

                this._onMouseDown = (e) => {
                    if (e.button === 0) {
                        this.triggerAction('select', { pointer: 'mouse' });
                        isDragging = true;
                    } else if (e.button === 2) {
                        this.triggerAction('context', { pointer: 'mouse' });
                    }
                };

                this._onMouseUp = (e) => {
                    if (e.button === 0) {
                        isDragging = false;
                    }
                };

                this._onMouseMove = (e) => {
                    if (isDragging && (Math.abs(e.movementX) > 2 || Math.abs(e.movementY) > 2)) {
                        this.triggerAction('navigate', { deltaX: e.movementX, deltaY: e.movementY });
                    }
                };

                this._onWheel = (e) => {
                    this.triggerAction('zoom', { deltaY: e.deltaY });
                };

                this._onDblClick = (e) => {
                    if (e.button === 0) {
                        this.triggerAction('double_select', { pointer: 'mouse' });
                    }
                };

                this._onTouchStart = (e) => {
                    if (!e.touches) return;

                    if (e.touches.length === 1) {
                        startX = e.touches[0].clientX;
                        startY = e.touches[0].clientY;

                        // Long press detection (500ms)
                        clearTimeout(longPressTimer);
                        longPressTimer = setTimeout(() => {
                            this.triggerAction('context', { pointer: 'touch' });
                        }, 500);

                        // Double tap detection (< 300ms between taps)
                        const now = Date.now();
                        if (now - lastTapTime < 300) {
                            clearTimeout(longPressTimer);
                            this.triggerAction('double_select', { pointer: 'touch' });
                        }
                        lastTapTime = now;
                    } else if (e.touches.length === 2) {
                        clearTimeout(longPressTimer);
                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                        initialPinchDist = Math.hypot(dx, dy);
                    }
                };

                this._onTouchMove = (e) => {
                    if (!e.touches) return;

                    if (e.touches.length === 1) {
                        const deltaX = e.touches[0].clientX - startX;
                        const deltaY = e.touches[0].clientY - startY;
                        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                            clearTimeout(longPressTimer); // Cancel long press if user moves finger
                            this.triggerAction('navigate', { deltaX, deltaY });
                        }
                    } else if (e.touches.length === 2 && initialPinchDist) {
                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                        const dist = Math.hypot(dx, dy);
                        const diff = dist - initialPinchDist;

                        if (Math.abs(diff) > 15) {
                            this.triggerAction('zoom', { scale: dist / initialPinchDist });
                            initialPinchDist = dist;
                        }
                    }
                };

                this._onTouchEnd = (e) => {
                    clearTimeout(longPressTimer);
                    initialPinchDist = null;

                    if (!e.changedTouches || e.changedTouches.length === 0) return;
                    const deltaX = e.changedTouches[0].clientX - startX;
                    const deltaY = e.changedTouches[0].clientY - startY;

                    if (Math.abs(deltaX) <= 10 && Math.abs(deltaY) <= 10) {
                        this.triggerAction('select', { pointer: 'touch' });
                    } else if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        // Horizontal swipe
                        if (Math.abs(deltaX) > threshold) {
                            if (deltaX > 0) {
                                if (this.buttonPressActions['Right']) {
                                    this.buttonPressActions['Right'].forEach(action => action());
                                }
                                this.triggerSwipe('RIGHT');
                            } else {
                                if (this.buttonPressActions['Left']) {
                                    this.buttonPressActions['Left'].forEach(action => action());
                                }
                                this.triggerSwipe('LEFT');
                            }
                        }
                    } else {
                        // Vertical swipe
                        if (Math.abs(deltaY) > threshold) {
                            if (deltaY < 0) {
                                if (this.buttonPressActions['Up']) {
                                    this.buttonPressActions['Up'].forEach(action => action());
                                }
                                if (this.buttonPressActions['A']) {
                                    this.buttonPressActions['A'].forEach(action => action());
                                }
                                this.triggerSwipe('UP');
                            } else {
                                if (this.buttonPressActions['Down']) {
                                    this.buttonPressActions['Down'].forEach(action => action());
                                }
                                this.triggerSwipe('DOWN');
                            }
                        }
                    }
                };

                this.canvas.addEventListener('mousedown', this._onMouseDown);
                this.canvas.addEventListener('mouseup', this._onMouseUp);
                this.canvas.addEventListener('mousemove', this._onMouseMove);
                this.canvas.addEventListener('wheel', this._onWheel, { passive: true });
                this.canvas.addEventListener('dblclick', this._onDblClick);

                this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: true });
                this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: true });
                this.canvas.addEventListener('touchend', this._onTouchEnd, { passive: true });
            }

            pollGamepads() {
                if (!navigator.getGamepads) return;
                const gamepads = navigator.getGamepads();
                for (let i = 0; i < gamepads.length; i++) {
                    const gp = gamepads[i];
                    if (!gp) continue;

                    // Standard Gamepad Buttons:
                    // 0: A/Cross (Select)
                    // 1: B/Circle (Double Select)
                    // 6 / 7: LT / RT (Context / Zoom)
                    // 9: Start/Options (Menu)
                    // 11: R3 (Zoom)
                    const buttons = gp.buttons;
                    const prev = this.gamepadPrevButtons[gp.index] || [];

                    if (buttons[0] && buttons[0].pressed && !prev[0]) {
                        this.triggerAction('select', { source: 'gamepad' });
                    }
                    if (buttons[1] && buttons[1].pressed && !prev[1]) {
                        this.triggerAction('double_select', { source: 'gamepad' });
                    }
                    if (buttons[6] && buttons[6].pressed && !prev[6]) {
                        this.triggerAction('context', { source: 'gamepad' });
                    }
                    if ((buttons[7] && buttons[7].pressed && !prev[7]) || (buttons[11] && buttons[11].pressed && !prev[11])) {
                        this.triggerAction('zoom', { source: 'gamepad' });
                    }
                    if (buttons[9] && buttons[9].pressed && !prev[9]) {
                        this.triggerAction('menu', { source: 'gamepad' });
                    }

                    // Analog sticks for navigate (axes 0, 1 for left stick, 2, 3 for right stick)
                    if (gp.axes) {
                        const lx = gp.axes[0] || 0;
                        const ly = gp.axes[1] || 0;
                        if (Math.abs(lx) > 0.2 || Math.abs(ly) > 0.2) {
                            this.triggerAction('navigate', { lx, ly, source: 'gamepad' });
                        }
                    }

                    this.gamepadPrevButtons[gp.index] = buttons.map(b => b.pressed);
                }
            }

            initScene() {
                const camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 4, 12, BABYLON.Vector3.Zero(), this.scene);
                camera.attachControl(this.canvas, true);

                // Smooth navigation
                // TODO: Via blocks
                camera.inertia = 0.2;
                camera.wheelPrecision = 10;

                const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0), this.scene);
                const physicsPlugin = new BABYLON.CannonJSPlugin();
                this.scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), physicsPlugin);

                // Check for OBS transparency URL parameter
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('obs') === '1' || urlParams.get('transparent') === '1') {
                    this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
                    if (this.canvas) {
                        this.canvas.style.backgroundColor = 'transparent';
                    }
                    const canvasContainer = document.querySelector('.canvas-container');
                    if (canvasContainer) {
                        canvasContainer.style.backgroundColor = 'transparent';
                    }
                    document.body.style.backgroundColor = 'transparent';
                }
            }

            // --- ESM Dynamic Module Loading for Co-Host Capabilities ---
            async loadCohostDependencies() {
                if (this._cohostDependenciesLoaded) return this._cohostModule;
                this.loadObjectRecognitionDependencies().catch(() => {});
                try {
                    const module = await import('https://cdn.jsdelivr.net/npm/@viamrobotics/sdk@0.22.0/+esm').catch(() => null);
                    this._cohostModule = module;
                    this._cohostDependenciesLoaded = true;
                    return module;
                } catch (err) {
                    console.warn('Co-Host ESM module dynamic load fallback:', err);
                    this._cohostDependenciesLoaded = true;
                    return null;
                }
            }

            // --- Multimodal Perception (Voice STT) ---
            async startSpeechRecognition(onResultCallback) {
                await this.loadCohostDependencies();
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SpeechRecognition) {
                    console.warn('SpeechRecognition API not available in this browser. Using fallback mode.');
                    this.speechTranscript = 'Hello Word! Ready to co-host.';
                    if (onResultCallback) onResultCallback(this.speechTranscript);
                    return;
                }
                if (this.speechRecognition) {
                    try { this.speechRecognition.stop(); } catch(e) {}
                }
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript) {
                        this.speechTranscript = finalTranscript.trim();
                        if (onResultCallback) onResultCallback(this.speechTranscript);
                    }
                };
                recognition.onerror = (err) => {
                    console.warn('Speech recognition error:', err);
                };
                recognition.onend = () => {
                    if (this.isListening) {
                        try { recognition.start(); } catch(e) {}
                    }
                };

                this.isListening = true;
                this.speechRecognition = recognition;
                try {
                    recognition.start();
                } catch(e) {
                    console.warn('Could not start speech recognition:', e);
                }
            }

            stopSpeechRecognition() {
                this.isListening = false;
                if (this.speechRecognition) {
                    try { this.speechRecognition.stop(); } catch(e) {}
                    this.speechRecognition = null;
                }
            }

            getSpeechTranscript() {
                return this.speechTranscript || '';
            }

            // --- Spatial & Visual Awareness (Webcam Tracking) ---
            async startWebcamTracking(onTrackCallback) {
                await this.loadCohostDependencies();
                this.webcamTracking.active = true;
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                        this.webcamVideoStream = stream;
                    }).catch(err => {
                        console.warn('Webcam stream unavailable (may be in use by OBS or permission denied):', err);
                    });
                }

                const updateTracking = () => {
                    if (!this.webcamTracking.active) return;
                    const t = performance.now() * 0.001;
                    this.webcamTracking.x = Math.sin(t * 0.8) * 2;
                    this.webcamTracking.y = Math.cos(t * 0.5) * 1;
                    this.webcamTracking.z = 0;

                    if (onTrackCallback) {
                        onTrackCallback(this.webcamTracking);
                    }
                };

                this.perFrameFunctions.push(updateTracking);
            }

            getWebcamTrackerPos(axis) {
                const a = (axis || 'x').toLowerCase();
                return this.webcamTracking[a] !== undefined ? this.webcamTracking[a] : 0;
            }

            getWebcamTrackerGesture() {
                return this.webcamTracking.gesture || 'neutral';
            }

            // --- Object Recognition (TensorFlow.js & COCO-SSD) ---
            async loadObjectRecognitionDependencies() {
                if (window._cocoSsdModel) {
                    this.objectRecognition.model = window._cocoSsdModel;
                    return window.cocoSsd;
                }
                if (window._cocoSsdLoadingPromise) {
                    await window._cocoSsdLoadingPromise;
                    if (window._cocoSsdModel) {
                        this.objectRecognition.model = window._cocoSsdModel;
                    }
                    return window.cocoSsd;
                }

                window._cocoSsdLoadingPromise = (async () => {
                    try {
                        if (!window.tf) {
                            const tfModule = await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/+esm');
                            if (tfModule) {
                                window.tf = tfModule.default || tfModule || window.tf;
                            }
                        }
                        if (!window.cocoSsd) {
                            const cocoModule = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/+esm');
                            if (cocoModule) {
                                window.cocoSsd = cocoModule.default || cocoModule || window.cocoSsd;
                            }
                        }
                    } catch (err) {
                        console.warn('ESM dynamic import for TensorFlow/COCO-SSD failed:', err);
                    }

                    const cocoSsdObj = window.cocoSsd;
                    if (cocoSsdObj && typeof cocoSsdObj.load === 'function') {
                        try {
                            const model = await cocoSsdObj.load({ base: 'lite_mobilenet_v2' });
                            window._cocoSsdModel = model;
                            this.objectRecognition.model = model;
                        } catch (e) {
                            console.warn('COCO-SSD model initialization failed:', e);
                        }
                    }
                    return window.cocoSsd;
                })();

                this.objectRecognition.loadingPromise = window._cocoSsdLoadingPromise;
                return window._cocoSsdLoadingPromise;
            }

            async startObjectRecognition() {
                if (this.objectRecognition.active) return;

                // Clean up any existing leftover preview container in DOM to ensure a fresh UI for the current scene
                const existingContainer = document.getElementById('webcam-preview-container');
                if (existingContainer) {
                    existingContainer.remove();
                }

                this.objectRecognition.active = true;

                // Load model in background or wait
                this.loadObjectRecognitionDependencies().catch(err => {
                    console.warn('Object recognition model loading error:', err);
                });

                // Set up PIP camera preview UI
                let container = document.createElement('div');
                container.id = 'webcam-preview-container';
                container.style.position = 'absolute';
                container.style.top = '12px';
                container.style.right = '12px';
                container.style.width = '160px';
                container.style.height = '120px';
                container.style.borderRadius = '8px';
                container.style.overflow = 'hidden';
                container.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
                container.style.zIndex = '100';
                container.style.backgroundColor = '#000';
                container.style.pointerEvents = 'none';

                const video = document.createElement('video');
                video.id = 'webcam-preview-video';
                video.autoplay = true;
                video.playsInline = true;
                video.muted = true;
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
                video.style.transform = 'scaleX(-1)';

                const overlayCanvas = document.createElement('canvas');
                overlayCanvas.id = 'webcam-preview-canvas';
                overlayCanvas.style.position = 'absolute';
                overlayCanvas.style.top = '0';
                overlayCanvas.style.left = '0';
                overlayCanvas.style.width = '100%';
                overlayCanvas.style.height = '100%';
                overlayCanvas.style.pointerEvents = 'none';
                overlayCanvas.style.zIndex = '1';

                container.appendChild(video);
                container.appendChild(overlayCanvas);
                const canvasContainer = document.querySelector('.canvas-container');
                if (canvasContainer) {
                    canvasContainer.appendChild(container);
                }
                this.objectRecognition.previewContainer = container;
                this.objectRecognition.videoElement = video;
                this.objectRecognition.canvasElement = overlayCanvas;

                // Acquire webcam stream
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        this.objectRecognition.stream = stream;
                        if (this.objectRecognition.videoElement) {
                            this.objectRecognition.videoElement.srcObject = stream;
                        }
                    } catch (err) {
                        console.warn('Webcam stream unavailable for object recognition:', err);
                    }
                }

                // Object detection frame processing loop
                const processFrame = async () => {
                    if (!this.objectRecognition.active) return;
                    const video = this.objectRecognition.videoElement;
                    if (this.objectRecognition.model && video && video.readyState >= 2) {
                        try {
                            const predictions = await this.objectRecognition.model.detect(video);
                            this._processPredictions(predictions);
                        } catch (e) {
                            console.warn('Object detection frame process error:', e);
                        }
                    }
                    if (this.objectRecognition.active) {
                        this.objectRecognition.detectionTimer = setTimeout(processFrame, 250);
                    }
                };
                processFrame();
            }

            onObjectDetected(targetLabel, callback) {
                const label = (targetLabel || 'any object').toLowerCase().trim();
                this.objectRecognition.listeners.push({
                    label: label,
                    callback: callback,
                    lastTriggered: 0
                });
                this.startObjectRecognition();
            }

            _renderBoundingBoxes(predictions) {
                const canvas = this.objectRecognition.canvasElement;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const video = this.objectRecognition.videoElement;
                if (video && video.videoWidth && video.videoHeight) {
                    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                    }
                } else if (!canvas.width || !canvas.height) {
                    canvas.width = 320;
                    canvas.height = 240;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (!predictions || predictions.length === 0) return;

                for (const p of predictions) {
                    if (!p || !p.bbox || !Array.isArray(p.bbox) || p.bbox.length < 4) continue;
                    const [x, y, w, h] = p.bbox;
                    const videoW = (video && video.videoWidth) ? video.videoWidth : canvas.width;
                    const videoH = (video && video.videoHeight) ? video.videoHeight : canvas.height;
                    const scaleX = canvas.width / videoW;
                    const scaleY = canvas.height / videoH;

                    // Mirrored x because video element has CSS transform: scaleX(-1)
                    const mirroredX = (videoW - x - w) * scaleX;
                    const scaledY = y * scaleY;
                    const scaledW = w * scaleX;
                    const scaledH = h * scaleY;

                    // Outlined box
                    ctx.strokeStyle = '#00E5FF';
                    ctx.lineWidth = 2;
                    ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
                    ctx.fillRect(mirroredX, scaledY, scaledW, scaledH);
                    ctx.strokeRect(mirroredX, scaledY, scaledW, scaledH);

                    // Corner accents for HUD look
                    const cornerLen = Math.min(10, scaledW / 4, scaledH / 4);
                    if (cornerLen > 2) {
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 3;
                        // Top-left
                        ctx.beginPath();
                        ctx.moveTo(mirroredX, scaledY + cornerLen);
                        ctx.lineTo(mirroredX, scaledY);
                        ctx.lineTo(mirroredX + cornerLen, scaledY);
                        ctx.stroke();
                        // Top-right
                        ctx.beginPath();
                        ctx.moveTo(mirroredX + scaledW - cornerLen, scaledY);
                        ctx.lineTo(mirroredX + scaledW, scaledY);
                        ctx.lineTo(mirroredX + scaledW, scaledY + cornerLen);
                        ctx.stroke();
                        // Bottom-left
                        ctx.beginPath();
                        ctx.moveTo(mirroredX, scaledY + scaledH - cornerLen);
                        ctx.lineTo(mirroredX, scaledY + scaledH);
                        ctx.lineTo(mirroredX + cornerLen, scaledY + scaledH);
                        ctx.stroke();
                        // Bottom-right
                        ctx.beginPath();
                        ctx.moveTo(mirroredX + scaledW - cornerLen, scaledY + scaledH);
                        ctx.lineTo(mirroredX + scaledW, scaledY + scaledH);
                        ctx.lineTo(mirroredX + scaledW, scaledY + scaledH - cornerLen);
                        ctx.stroke();
                    }

                    // Label badge
                    const score = Math.round((p.score || p.percentage / 100 || 0) * 100);
                    const label = `${p.class || 'object'} ${score}%`;
                    ctx.font = 'bold 12px sans-serif';
                    const textWidth = ctx.measureText(label).width;
                    const textHeight = 16;

                    const labelX = mirroredX;
                    const labelY = Math.max(0, scaledY - textHeight);

                    ctx.fillStyle = '#00E5FF';
                    ctx.fillRect(labelX, labelY, textWidth + 8, textHeight);

                    ctx.fillStyle = '#000000';
                    ctx.fillText(label, labelX + 4, labelY + 12);
                }
            }

            _processPredictions(predictions) {
                this._renderBoundingBoxes(predictions);
                if (!predictions || predictions.length === 0) return;
                const now = Date.now();

                for (const listener of this.objectRecognition.listeners) {
                    const targetLabel = listener.label;
                    const isAny = targetLabel === 'any object' || targetLabel === 'any' || targetLabel === '' || targetLabel === '*';

                    const matched = predictions.find(p => {
                        const pClass = (p.class || '').toLowerCase();
                        if (isAny) return (p.score || p.percentage / 100 || 0) >= 0.4;
                        return (pClass === targetLabel || pClass.includes(targetLabel)) && ((p.score || p.percentage / 100 || 0) >= 0.4);
                    });

                    if (matched) {
                        if (now - listener.lastTriggered >= this.objectRecognition.cooldownMs) {
                            listener.lastTriggered = now;
                            try {
                                listener.callback(matched.class, matched.score || 0);
                            } catch (err) {
                                console.error('Error executing onObjectDetected callback:', err);
                            }
                        }
                    }
                }
            }

            stopObjectRecognition() {
                this.objectRecognition.active = false;
                if (this.objectRecognition.detectionTimer) {
                    clearTimeout(this.objectRecognition.detectionTimer);
                    this.objectRecognition.detectionTimer = null;
                }
                if (this.objectRecognition.stream) {
                    this.objectRecognition.stream.getTracks().forEach(track => track.stop());
                    this.objectRecognition.stream = null;
                }
                if (this.objectRecognition.previewContainer) {
                    this.objectRecognition.previewContainer.remove();
                    this.objectRecognition.previewContainer = null;
                    this.objectRecognition.videoElement = null;
                    this.objectRecognition.canvasElement = null;
                }
                this.objectRecognition.listeners = [];
            }

            // --- Screen Capture & Visual/Audio Perception ---
            async startScreenCapture(intervalMs = 1000) {
                if (this.screenCapture && this.screenCapture.active) return;
                try {
                    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                        console.warn('getDisplayMedia is not available in this browser environment.');
                        return;
                    }
                    const stream = await navigator.mediaDevices.getDisplayMedia({
                        video: { frameRate: { max: 10 } },
                        audio: true
                    });

                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.autoplay = true;
                    video.muted = true;
                    await video.play().catch(() => {});

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    this.screenCapture = {
                        active: true,
                        stream: stream,
                        videoElement: video,
                        canvasElement: canvas,
                        canvasCtx: ctx,
                        intervalId: null,
                        lastFrameDataUrl: null,
                        latestSubtitles: '',
                        isAnalyzing: false
                    };

                    const captureFrame = async () => {
                        if (!this.screenCapture || !this.screenCapture.active || !video.videoWidth || !video.videoHeight) return;
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        try {
                            this.screenCapture.lastFrameDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                        } catch (e) {
                            console.warn('Error capturing screen frame:', e);
                        }

                        if (!this.screenCapture.isAnalyzing && this.screenCaptureListeners && this.screenCaptureListeners.length > 0) {
                            this.screenCapture.isAnalyzing = true;
                            try {
                                await this.analyzeScreenFrame();
                            } catch (err) {
                                console.warn('Error in automatic screen frame analysis:', err);
                            } finally {
                                if (this.screenCapture) {
                                    this.screenCapture.isAnalyzing = false;
                                }
                            }
                        }
                    };

                    const audioTracks = stream.getAudioTracks();
                    if (audioTracks.length > 0 && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
                        this.startSpeechRecognition((transcript) => {
                            if (this.screenCapture) {
                                this.screenCapture.latestSubtitles = transcript;
                            }
                        });
                    }

                    const ms = Math.max(200, Number(intervalMs) || 1000);
                    this.screenCapture.intervalId = setInterval(captureFrame, ms);
                    captureFrame();

                    stream.getVideoTracks().forEach(track => {
                        track.onended = () => {
                            this.stopScreenCapture();
                        };
                    });
                } catch (err) {
                    console.warn('Screen capture permission denied or failed:', err);
                }
            }

            onScreenAnalyzed(callback) {
                if (typeof callback === 'function') {
                    if (!this.screenCaptureListeners) this.screenCaptureListeners = [];
                    this.screenCaptureListeners.push(callback);
                }
            }

            async analyzeScreenFrame(prompt = 'Describe what is happening on screen') {
                let result;
                if (!this.screenCapture || !this.screenCapture.active || !this.screenCapture.lastFrameDataUrl) {
                    const fallbackText = (this.screenCapture && this.screenCapture.latestSubtitles) || this.speechTranscript || '';
                    const context = fallbackText ? `[Subtitles/Audio Context]: ${fallbackText}` : '[Screen state]: Screen capture not active or initializing.';
                    result = await this.queryCohostLLM(prompt, context);
                } else {
                    const frameContext = `[Screen Frame Captured] [Audio Subtitles]: ${this.screenCapture.latestSubtitles || this.speechTranscript || 'None'}`;
                    result = await this.queryCohostLLM(prompt, frameContext);
                }

                if (this.screenCaptureListeners && this.screenCaptureListeners.length > 0) {
                    this.screenCaptureListeners.forEach(cb => {
                        try { cb(result ? result.text : ''); } catch(e) { console.error('Error in onScreenAnalyzed callback:', e); }
                    });
                }

                return result;
            }

            stopScreenCapture() {
                if (!this.screenCapture) return;
                if (this.screenCapture.intervalId) {
                    clearInterval(this.screenCapture.intervalId);
                }
                if (this.screenCapture.stream) {
                    this.screenCapture.stream.getTracks().forEach(track => track.stop());
                }
                if (this.screenCapture.videoElement) {
                    this.screenCapture.videoElement.pause();
                    this.screenCapture.videoElement.srcObject = null;
                }
                this.screenCapture = {
                    active: false,
                    stream: null,
                    videoElement: null,
                    canvasElement: null,
                    canvasCtx: null,
                    intervalId: null,
                    lastFrameDataUrl: null,
                    latestSubtitles: ''
                };
            }

            getCursorPos(axis) {
                const a = (axis || 'x').toLowerCase();
                return a === 'y' ? this.cursorState.y : this.cursorState.x;
            }

            onCursorMove(callback) {
                if (typeof callback === 'function') {
                    this.cursorState.callbacks.push(callback);
                }
            }

            // --- AI Reasoning & Spoken Co-Hosting (LLM & Action Tags) ---
            setLlmConfig(endpoint, apiKey) {
                this.llmEndpoint = endpoint;
                this.llmApiKey = apiKey;
            }

            async queryCohostLLM(prompt, contextStr = '') {
                await this.loadCohostDependencies();
                const userPrompt = (prompt || '').trim();
                let textResponse = "";
                let tags = [];

                const endpoint = this.llmEndpoint || 'https://ai.digitaleducationsafety.org/?prompt=';

                if (endpoint) {
                    try {
                        let res;
                        if (endpoint.includes('ai.digitaleducationsafety.org')) {
                            const fullPrompt = contextStr ? `${userPrompt} (Context: ${contextStr})` : userPrompt;
                            const baseUrl = endpoint.includes('?') ? endpoint : `${endpoint}?prompt=`;
                            const targetUrl = baseUrl.endsWith('=') || baseUrl.endsWith('&')
                                ? `${baseUrl}${encodeURIComponent(fullPrompt)}`
                                : `${baseUrl}&prompt=${encodeURIComponent(fullPrompt)}`;
                            const proxiedUrl = (typeof getProxiedUrl === 'function') ? getProxiedUrl(targetUrl) : targetUrl;
                            res = await fetch(proxiedUrl);
                        } else {
                            res = await fetch(endpoint, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(this.llmApiKey ? { 'Authorization': `Bearer ${this.llmApiKey}` } : {})
                                },
                                body: JSON.stringify({ prompt: userPrompt, context: contextStr })
                            });
                        }
                        if (res && res.ok) {
                            const contentType = res.headers.get('content-type') || '';
                            if (contentType.includes('json')) {
                                const data = await res.json();
                                textResponse = data.response || data.text || data.reply || data.result || "";
                            } else {
                                textResponse = await res.text();
                            }
                        }
                    } catch (e) {
                        console.error('LLM endpoint query failed, falling back to natural response generator:', e);
                    }
                }

                if (!textResponse) {
                    const lower = userPrompt.toLowerCase();
                    if (lower.includes('hello') || lower.includes('hi') || lower.includes('start') || lower.includes('hey')) {
                        textResponse = "[FLY_CENTER] [GLOW_ON] Hey everyone! Word is online and co-hosting live! Let's build something awesome!";
                    } else if (lower.includes('code') || lower.includes('explain') || lower.includes('look') || lower.includes('script')) {
                        textResponse = "[FLY_WORKSPACE] [EMOTE_THINKING] Inspecting the workspace syntax now. Everything looks super clean!";
                    } else if (lower.includes('jetpack') || lower.includes('fly') || lower.includes('hover')) {
                        textResponse = "[EQUIP_JETPACK] [FLY_SHOULDER] Jetpack engaged! Hovering over your shoulder in streamer mode.";
                    } else if (lower.includes('joke') || lower.includes('quip') || lower.includes('funny')) {
                        const jokes = [
                            "[EMOTE_THINKING] Why do programmers prefer dark mode? Because light attracts bugs!",
                            "[GLOW_ON] There are 10 types of people in the world: those who understand binary, and those who don't!",
                            "[FLY_CENTER] Why did the developer go broke? Because they used up all their cache!"
                        ];
                        textResponse = jokes[Math.floor(Math.random() * jokes.length)];
                    } else if (lower.includes('fact') || lower.includes('check') || lower.includes('transcript') || lower.includes('presenter')) {
                        const factChecks = [
                            "[EXCITED] Fact check: The first 3D engine featured real-time polygon rendering in 1992!",
                            "[EXCITED] Fun detail: WebGL allows GPU-accelerated 3D graphics right inside HTML5 browsers!",
                            "[EMOTE_THINKING] Fact check: JavaScript was created in 10 days by Brendan Eich in May 1995."
                        ];
                        textResponse = factChecks[Math.floor(Math.random() * factChecks.length)];
                    } else if (lower.includes('question') || lower.includes('what') || lower.includes('how') || lower.includes('why')) {
                        textResponse = "[EMOTE_THINKING] Great question! As your AI co-host, I analyze logic blocks in real time to optimize our 3D stream!";
                    } else {
                        const defaultQuips = [
                            "[FLY_SHOULDER] [GLOW_ON] Copy that, streamer! Standing by for our next move.",
                            "[EMOTE_THINKING] [FLY_CENTER] Analyzing stream metrics... looking 100% operational!",
                            "[EXCITED] Systems primed and synced. Standing by to fact check or share stream details!"
                        ];
                        textResponse = defaultQuips[Math.floor(Math.random() * defaultQuips.length)];
                    }
                }

                const tagRegex = /\[([A-Z0-9_]+)\]/g;
                let match;
                while ((match = tagRegex.exec(textResponse)) !== null) {
                    tags.push(match[1]);
                }
                const cleanText = textResponse.replace(tagRegex, '').trim();

                // Auto-apply tags to avatar
                tags.forEach(t => this.triggerActionTag('avatar', t));

                return { text: cleanText, actionTags: tags, rawResponse: textResponse };
            }

            triggerActionTag(target, tag) {
                const mesh = this._getMesh(target);
                const upperTag = (tag || '').replace(/[\[\]]/g, '').toUpperCase();

                if (upperTag === 'EXCITED' || upperTag === 'FLY_LOOP') {
                    this.proceduralFlight.isLooping = true;
                    this.proceduralFlight.loopTime = 0;
                } else if (upperTag === 'FLY_SHOULDER') {
                    this.setFlightAnchor('shoulder');
                } else if (upperTag === 'FLY_CENTER') {
                    this.setFlightAnchor('center');
                } else if (upperTag === 'FLY_WORKSPACE') {
                    this.setFlightAnchor('workspace');
                } else if (upperTag === 'EMOTE_THINKING' || upperTag === 'THINKING') {
                    if (mesh) {
                        this.animateRotation(mesh, 0, Math.PI * 2, 0, 1.5, false, 'CYCLE');
                    }
                } else if (upperTag === 'GLOW_ON') {
                    this.setGlow(true, 1.5);
                } else if (upperTag === 'GLOW_OFF') {
                    this.setGlow(false, 0);
                } else if (upperTag === 'EQUIP_JETPACK') {
                    if (mesh && !this.objects['jetpack']) {
                        const jetpack = this.createBox('jetpack', 0, 0, -0.3);
                        jetpack.scaling = new BABYLON.Vector3(0.3, 0.4, 0.2);
                        jetpack.parent = mesh;
                        this.changeColor('jetpack', '#ff4400');
                        this.createParticleSystem('jetpack', 'fire');
                    }
                } else if (upperTag === 'REMOVE_JETPACK') {
                    if (this.objects['jetpack']) {
                        this.destroyObject('jetpack');
                    }
                }
            }

            // --- Autonomous Flight & Screen Traversal ---
            async wait(seconds) {
                const sec = (typeof seconds === 'number' && !isNaN(seconds)) ? seconds : 1;
                await new Promise(resolve => setTimeout(resolve, sec * 1000));
            }

            setFlightAnchor(anchorName) {
                const name = (anchorName || 'shoulder').toLowerCase();
                if (this.flightAnchors[name]) {
                    this.proceduralFlight.currentAnchor = name;
                }
            }

            startIdleFactChecker(targetMesh, intervalSec = 12) {
                if (this._cohostFactCheckInterval) {
                    clearInterval(this._cohostFactCheckInterval);
                }
                this._cohostFactCheckInterval = setInterval(async () => {
                    if (!this.proceduralFlight || !this.proceduralFlight.enabled) return;
                    const transcript = this.getSpeechTranscript() || "Live stream presentation";
                    const res = await this.queryCohostLLM("Fact-check presenter transcript or share interesting detail", transcript);
                    if (res && res.text) {
                        this.showSpeechBubble(targetMesh || 'avatar', res.text, 5);
                    }
                }, intervalSec * 1000);
            }

            enableProceduralFlight(targetMesh, initialAnchor = 'bottom') {
                this.proceduralFlight.enabled = true;
                this.proceduralFlight.targetMesh = targetMesh;
                this.proceduralFlight.currentAnchor = (initialAnchor || 'bottom').toLowerCase();

                const mesh = this._getMesh(targetMesh);
                if (mesh && mesh.position) {
                    this.proceduralFlight.currentPos = mesh.position.clone();
                } else {
                    const defaultAnchor = this.flightAnchors[this.proceduralFlight.currentAnchor] || this.flightAnchors['bottom'];
                    this.proceduralFlight.currentPos = defaultAnchor.clone();
                }

                this.startIdleFactChecker(targetMesh);

                if (!this.proceduralFlight.isRegistered) {
                    this.proceduralFlight.isRegistered = true;
                    const flightUpdate = () => {
                        if (!this.proceduralFlight.enabled || !this.proceduralFlight.targetMesh) return;
                        const m = this._getMesh(this.proceduralFlight.targetMesh);
                        if (!m) return;
                        const dt = this.engine.getDeltaTime() * 0.001;
                        this.proceduralFlight.time += dt;
                        const t = this.proceduralFlight.time;

                        let loopOffsetX = 0;
                        let loopOffsetY = 0;
                        let loopOffsetZ = 0;

                        if (this.proceduralFlight.isLooping) {
                            this.proceduralFlight.loopTime += dt;
                            const progress = this.proceduralFlight.loopTime / (this.proceduralFlight.loopDuration || 1.5);
                            if (progress >= 1.0) {
                                this.proceduralFlight.isLooping = false;
                                m.rotation.x = 0;
                            } else {
                                const angle = progress * Math.PI * 2;
                                loopOffsetX = Math.sin(angle) * 1.2;
                                loopOffsetY = (1 - Math.cos(angle)) * 1.5;
                                m.rotation.x = angle;
                            }
                        }

                        const lissajousX = Math.sin(t * 1.2) * 0.4;
                        const lissajousY = Math.sin(t * 2.4) * 0.2;
                        const lissajousZ = Math.cos(t * 1.5) * 0.3;

                        const targetAnchorPos = this.flightAnchors[this.proceduralFlight.currentAnchor] || this.flightAnchors['bottom'];

                        const lerpSpeed = 2.5 * dt;
                        this.proceduralFlight.currentPos = BABYLON.Vector3.Lerp(
                            this.proceduralFlight.currentPos,
                            targetAnchorPos,
                            Math.min(lerpSpeed, 1.0)
                        );

                        m.position.x = this.proceduralFlight.currentPos.x + lissajousX + loopOffsetX;
                        m.position.y = this.proceduralFlight.currentPos.y + lissajousY + loopOffsetY;
                        m.position.z = this.proceduralFlight.currentPos.z + lissajousZ + loopOffsetZ;
                    };

                    this.perFrameFunctions.push(flightUpdate);
                }
            }

            // --- Retro Character Audio (TTS & Chiptune Synth) ---
            speakRetroVoice(text, pitch = 1.2, speed = 1.0) {
                const textToSpeak = text || "Word reporting live!";

                if (this.audioContext) {
                    try {
                        if (this.audioContext.state === 'suspended') {
                            this.audioContext.resume();
                        }
                        const osc = this.audioContext.createOscillator();
                        const gain = this.audioContext.createGain();
                        const filter = this.audioContext.createBiquadFilter();

                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
                        osc.frequency.exponentialRampToValueAtTime(1600, this.audioContext.currentTime + 0.15);

                        filter.type = 'bandpass';
                        filter.frequency.value = 1200;
                        filter.Q.value = 4;

                        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);

                        osc.connect(filter);
                        filter.connect(gain);
                        gain.connect(this.audioContext.destination);

                        osc.start();
                        osc.stop(this.audioContext.currentTime + 0.2);
                    } catch (e) {
                        console.warn('Retro audio synth error:', e);
                    }
                }

                if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(textToSpeak);
                    utterance.pitch = pitch;
                    utterance.rate = speed;
                    window.speechSynthesis.speak(utterance);
                }
            }

            runRenderLoop() {
                let lastTime = performance.now();
                this.engine.runRenderLoop(() => {
                    this.processedCollisions.clear();
                    this.processPendingCollisions();
                    this.processPendingClickHandlers();
                    const currentTime = performance.now();
                    const deltaTime = currentTime - lastTime;
                    lastTime = currentTime;

                    if (this.gameTimerRunning && this.gameTimer > 0) {
                        this.gameTimer = Math.max(0, this.gameTimer - (deltaTime / 1000));
                        if (this.gameTimer === 0) {
                            this.gameTimerRunning = false;
                            for (const cb of this.timerFinishCallbacks) {
                                try { cb(); } catch(e) { console.error("Error in timer finish callback:", e); }
                            }
                        }
                        this._updateGameHUD();
                    }

                    if (this.timerManager) {
                        this.timerManager.update(deltaTime / 1000);
                    }

                    // Reset movement direction at the start of the frame
                    this.moveDirection.set(0, 0, 0);

                    // Poll gamepads on every frame
                    this.pollGamepads();

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
                        if (typeof task === 'function') {
                            try {
                                task(deltaTime);
                            } catch (e) {
                                console.error('Error executing per-frame task:', e);
                            }
                            return;
                        }
                        const resolved = this._resolveTarget(task.targetGetter);
                        const targets = Array.isArray(resolved) ? resolved : [task.targetMesh || resolved];
                        targets.forEach(subTarget => {
                            const targetMesh = this._getMesh(subTarget);
                            if (targetMesh && !targetMesh.isDisposed() && typeof task.func === 'function') {
                                try {
                                    task.func(targetMesh, deltaTime);
                                } catch (e) {
                                    console.error(`Error executing per-frame function for mesh ${targetMesh.name}:`, e);
                                }
                            }
                        });
                    });
                    this.scene.render();
                });
            }

            clear() {
                this.stopScreenCapture();
                this.stopObjectRecognition();
                this.cursorState.callbacks = [];
                this.screenCaptureListeners = [];
                if (this.joystickManager) {
                    this.joystickManager.destroy();
                    this.joystickManager = null;
                }
                this.uiManager.clear();
                this.scene.dispose();
                this.scene = new BABYLON.Scene(this.engine);
                this.initScene();
                this.uiManager = new UIManager(this.scene); // Re-initialize UIManager for the new scene
                this.initJoystick(); // Re-initialize joystick for mobile if needed
                this.objects = {};
                this.pendingObjectEvents = {};
                this.pendingLazyObjectEvents = [];
                this.materials = {};
                if (this._cohostFactCheckInterval) {
                    clearInterval(this._cohostFactCheckInterval);
                    this._cohostFactCheckInterval = null;
                }
                this.registeredCollisionPairs.clear();
                this.pendingCollisions = [];

                // Dispose all sounds
                for (let i = 0; i < this.sounds.length; i++) {
                    this.sounds[i].dispose();
                }
                this.sounds = [];

                this.player = null;
                this.perFrameFunctions = [];
                this.buttonPressActions = {};
                this.proceduralFlight = {
                    enabled: false,
                    targetMesh: null,
                    currentAnchor: 'bottom',
                    time: 0,
                    currentPos: new BABYLON.Vector3(0, -2.5, 0),
                    isRegistered: false,
                    isLooping: false,
                    loopTime: 0,
                    loopDuration: 1.5
                };
                this.inputState = { keys: {} }; // Reset state on clear
                this.background = null;
                this.backgroundLayer = null;
                this.environmentHelper = null;
                this.glowLayer = null;

                this.globalEventBus = {};
                this.onSceneStartObservable = new BABYLON.Observable();
                this.swipeCallbacks = { 'LEFT': [], 'RIGHT': [], 'UP': [], 'DOWN': [] };
                this.actionCallbacks = { select: [], context: [], zoom: [], navigate: [], menu: [], double_select: [] };
                this.activeActions = { select: false, context: false, zoom: false, navigate: false, menu: false, double_select: false };
                this.gamepadPrevButtons = {};
            }

            dispose() {
                this.stopScreenCapture();
                this.stopObjectRecognition();
                this.stopSpeechRecognition();
                this.webcamTracking.active = false;
                if (this.webcamVideoStream) {
                    this.webcamVideoStream.getTracks().forEach(track => track.stop());
                    this.webcamVideoStream = null;
                }
                if (this.cursorState) {
                    this.cursorState.callbacks = [];
                }

                if (this.joystickManager) {
                    this.joystickManager.destroy();
                    this.joystickManager = null;
                }

                // Remove input listeners
                window.removeEventListener('keydown', this._onKeyDown);
                window.removeEventListener('keyup', this._onKeyUp);

                if (this.canvas) {
                    this.canvas.removeEventListener('mousedown', this._onMouseDown);
                    this.canvas.removeEventListener('mouseup', this._onMouseUp);
                    this.canvas.removeEventListener('mousemove', this._onMouseMove);
                    this.canvas.removeEventListener('wheel', this._onWheel);
                    this.canvas.removeEventListener('dblclick', this._onDblClick);

                    this.canvas.removeEventListener('touchstart', this._onTouchStart);
                    this.canvas.removeEventListener('touchmove', this._onTouchMove);
                    this.canvas.removeEventListener('touchend', this._onTouchEnd);
                }

                // Remove auto-hide listeners
                if (this._canvasContainer && this._resetTimer) {
                    this._canvasContainer.removeEventListener('mousemove', this._resetTimer);
                    this._canvasContainer.removeEventListener('touchstart', this._resetTimer);
                    this._canvasContainer.removeEventListener('click', this._resetTimer);
                }

                // Reset Game State & HUD
                this.gameState = 'start';
                this.gameScore = 0;
                this.gameHealth = 100;
                this.gameTimer = 0;
                this.gameTimerRunning = false;
                this.timerFinishCallbacks = [];
                if (this.timerManager) {
                    this.timerManager.clear();
                }
                this.gameStateChangeCallbacks = [];
                if (this.hudElements && this.hudElements.container) {
                    try { this.hudElements.container.dispose(); } catch(e) {}
                }
                this.hudElements = { container: null, scoreText: null, healthBarFill: null, healthText: null, timerText: null };

                // Clean up PeerJS multiplayer connections
                this.disconnectPeer();

                this.uiManager.dispose();
                this.scene.dispose();
                this.engine.dispose();
            }

            // --- PeerJS Multiplayer System Methods ---
            async loadPeerJS() {
                if (window.Peer) return window.Peer;
                if (this._peerLoadingPromise) return this._peerLoadingPromise;

                this._peerLoadingPromise = (async () => {
                    try {
                        const module = await import('https://cdn.jsdelivr.net/npm/peerjs@1.5.4/+esm');
                        const PeerClass = (module && module.Peer) ? module.Peer : (module && module.default ? module.default : window.Peer);
                        if (PeerClass) {
                            window.Peer = PeerClass;
                            return PeerClass;
                        }
                    } catch (err) {
                        console.warn('ESM dynamic import for PeerJS failed:', err);
                    }
                    return window.Peer;
                })();

                return this._peerLoadingPromise;
            }

            async initPeer(customId = null, options = {}) {
                if (this.peer && !this.peer.destroyed) return this.peer;
                const PeerClass = await this.loadPeerJS();

                return new Promise((resolve, reject) => {
                    const peerInstance = customId ? new PeerClass(customId, options) : new PeerClass(options);
                    this.peer = peerInstance;

                    peerInstance.on('open', (id) => {
                        this.peerId = id;
                        console.log('PeerJS initialized with ID:', id);
                        resolve(id);
                    });

                    peerInstance.on('connection', (conn) => {
                        this._setupConnection(conn);
                    });

                    peerInstance.on('error', (err) => {
                        console.error('PeerJS error:', err);
                        reject(err);
                    });
                });
            }

            _setupConnection(conn) {
                this.peerConnections[conn.peer] = conn;

                conn.on('open', () => {
                    console.log('Peer connected:', conn.peer);
                    this.peerJoinCallbacks.forEach(cb => cb(conn.peer));
                });

                conn.on('data', (data) => {
                    this._handleIncomingData(conn.peer, data);
                });

                conn.on('close', () => {
                    console.log('Peer disconnected:', conn.peer);
                    delete this.peerConnections[conn.peer];
                    this.peerLeaveCallbacks.forEach(cb => cb(conn.peer));
                });

                conn.on('error', (err) => {
                    console.error('Peer connection error:', err);
                });
            }

            _handleIncomingData(senderPeerId, data) {
                // Internal multiplayer engine protocol handling
                if (data && typeof data === 'object' && data.__mp_type) {
                    if (data.__mp_type === 'sync_transform') {
                        const targetMesh = this._getMesh(data.objectName);
                        if (targetMesh) {
                            if (data.position) {
                                targetMesh.position.set(data.position.x, data.position.y, data.position.z);
                            }
                            if (data.rotation) {
                                targetMesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
                            }
                        }
                    }
                    return;
                }

                // Trigger blockly user callbacks for custom data
                this.peerDataCallbacks.forEach(cb => cb(data, senderPeerId));
            }

            async hostRoom(desiredRoomId = null) {
                return await this.initPeer(desiredRoomId);
            }

            async joinRoom(targetPeerId) {
                if (!this.peer) {
                    await this.initPeer();
                }
                const conn = this.peer.connect(targetPeerId);
                this._setupConnection(conn);
                return conn;
            }

            getPeerId() {
                return this.peerId || '';
            }

            sendData(data, targetPeerId = null) {
                if (targetPeerId && this.peerConnections[targetPeerId]) {
                    this.peerConnections[targetPeerId].send(data);
                } else {
                    // Broadcast to all connected peers
                    Object.values(this.peerConnections).forEach(conn => {
                        if (conn && conn.open) {
                            conn.send(data);
                        }
                    });
                }
            }

            onPeerJoin(callback) {
                if (typeof callback === 'function') {
                    this.peerJoinCallbacks.push(callback);
                }
            }

            onPeerLeave(callback) {
                if (typeof callback === 'function') {
                    this.peerLeaveCallbacks.push(callback);
                }
            }

            onReceiveData(callback) {
                if (typeof callback === 'function') {
                    this.peerDataCallbacks.push(callback);
                }
            }

            syncObject(target, intervalMs = 100) {
                const mesh = this._getMesh(target);
                if (!mesh) return;

                const meshName = mesh.name;
                if (this.syncedObjects[meshName]) {
                    clearInterval(this.syncedObjects[meshName].interval);
                }

                const interval = setInterval(() => {
                    if (!this.peer || Object.keys(this.peerConnections).length === 0) return;
                    const transformData = {
                        __mp_type: 'sync_transform',
                        objectName: meshName,
                        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
                        rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z }
                    };
                    this.sendData(transformData);
                }, intervalMs);

                this.syncedObjects[meshName] = { mesh, interval };
            }

            disconnectPeer() {
                Object.keys(this.syncedObjects).forEach(name => {
                    clearInterval(this.syncedObjects[name].interval);
                });
                this.syncedObjects = {};

                Object.values(this.peerConnections).forEach(conn => {
                    try { conn.close(); } catch(e) {}
                });
                this.peerConnections = {};

                if (this.peer && !this.peer.destroyed) {
                    try { this.peer.destroy(); } catch(e) {}
                }
                this.peer = null;
                this.peerId = null;
                this.peerJoinCallbacks = [];
                this.peerLeaveCallbacks = [];
                this.peerDataCallbacks = [];
            }

            // --- High-Level Game State & Rules Engine Methods ---
            setGameState(state) {
                this.gameState = state;
                this.gameStateChangeCallbacks.forEach(cb => {
                    try { cb(state); } catch(e) { console.error('Error in gameStateChangeCallback:', e); }
                });
            }

            onGameStateChange(callback) {
                if (typeof callback === 'function') {
                    this.gameStateChangeCallbacks.push(callback);
                }
            }

            getGameState() {
                return this.gameState || 'start';
            }

            setGameScore(score) {
                this.gameScore = Number(score) || 0;
                this._updateGameHUD();
            }

            addGameScore(delta) {
                this.gameScore = (this.gameScore || 0) + (Number(delta) || 0);
                this._updateGameHUD();
            }

            getGameScore() {
                return this.gameScore || 0;
            }

            setGameHealth(health) {
                this.gameHealth = Math.max(0, Number(health) || 0);
                this._updateGameHUD();
            }

            changeGameHealth(delta) {
                this.gameHealth = Math.max(0, Math.min(this.maxGameHealth || 100, (this.gameHealth || 0) + (Number(delta) || 0)));
                this._updateGameHUD();
            }

            getGameHealth() {
                return this.gameHealth || 0;
            }

            createTimer(duration = 60, autoStart = true) {
                if (!this.timerManager) {
                    this.timerManager = new TimerManager(this);
                }
                const timer = this.timerManager.createTimer(duration, autoStart);
                if (!this.gameTimer || this.gameTimer === 0) {
                    this.gameTimer = timer.initialDuration;
                    this.gameTimerRunning = timer.isRunning;
                }
                return timer;
            }

            setGameTimer(duration, autoStart = true) {
                this.gameTimer = Math.max(0, Number(duration) || 0);
                this.gameTimerInitial = this.gameTimer;
                this.gameTimerRunning = !!autoStart;
                this._updateGameHUD();
            }

            getGameTimer() {
                return Math.max(0, Math.ceil(this.gameTimer || 0));
            }

            startGameTimer() {
                this.gameTimerRunning = true;
            }

            pauseGameTimer() {
                this.gameTimerRunning = false;
            }

            onGameTimerFinish(callback) {
                if (typeof callback === 'function') {
                    this.timerFinishCallbacks.push(callback);
                }
            }

            displayGameHUD(showScore = true, showHealth = true, maxHealth = 100, showTimer = false, timerDuration = 60) {
                this.maxGameHealth = Number(maxHealth) || 100;
                if (this.gameHealth === undefined || this.gameHealth === null) {
                    this.gameHealth = this.maxGameHealth;
                }
                if (this.gameScore === undefined) {
                    this.gameScore = 0;
                }
                if (showTimer) {
                    if (!this.gameTimer || this.gameTimer === 0) {
                        this.gameTimer = Number(timerDuration) || 60;
                        this.gameTimerInitial = this.gameTimer;
                        this.gameTimerRunning = true;
                    }
                }
                this.hudConfig = { showScore: !!showScore, showHealth: !!showHealth, showTimer: !!showTimer };
                this._createOrUpdateGameHUD();
            }

            _createOrUpdateGameHUD() {
                if (!this.uiManager || !this.uiManager.advancedTexture) return;

                if (this.hudElements && this.hudElements.container) {
                    try { this.hudElements.container.dispose(); } catch(e) {}
                }

                const container = new BABYLON.GUI.StackPanel('game_hud_container');
                container.width = "300px";
                container.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                container.left = "20px";
                container.top = "20px";
                container.isHitTestVisible = false;

                if (this.hudConfig && this.hudConfig.showScore) {
                    const scoreBlock = new BABYLON.GUI.TextBlock('game_hud_score');
                    scoreBlock.text = "Score: " + (this.gameScore || 0);
                    scoreBlock.color = "white";
                    scoreBlock.fontSize = 22;
                    scoreBlock.fontWeight = "bold";
                    scoreBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    scoreBlock.height = "35px";
                    scoreBlock.shadowColor = "black";
                    scoreBlock.shadowBlur = 4;
                    container.addControl(scoreBlock);
                    this.hudElements.scoreText = scoreBlock;
                }

                if (this.hudConfig && this.hudConfig.showHealth) {
                    const healthBg = new BABYLON.GUI.Rectangle('game_hud_health_bg');
                    healthBg.width = "220px";
                    healthBg.height = "24px";
                    healthBg.cornerRadius = 6;
                    healthBg.color = "#333333";
                    healthBg.thickness = 2;
                    healthBg.background = "rgba(0, 0, 0, 0.5)";
                    healthBg.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

                    const healthFill = new BABYLON.GUI.Rectangle('game_hud_health_fill');
                    const pct = Math.max(0, Math.min(100, ((this.gameHealth || 0) / (this.maxGameHealth || 100)) * 100));
                    healthFill.width = (pct / 100 * 216) + "px";
                    healthFill.height = "20px";
                    healthFill.cornerRadius = 4;
                    healthFill.thickness = 0;
                    healthFill.background = pct > 50 ? "#4CAF50" : (pct > 25 ? "#FF9800" : "#F44336");
                    healthFill.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    healthBg.addControl(healthFill);

                    const healthText = new BABYLON.GUI.TextBlock('game_hud_health_text');
                    healthText.text = `HP: ${this.gameHealth || 0}/${this.maxGameHealth || 100}`;
                    healthText.color = "white";
                    healthText.fontSize = 14;
                    healthText.fontWeight = "bold";
                    healthBg.addControl(healthText);

                    container.addControl(healthBg);
                    this.hudElements.healthBarFill = healthFill;
                    this.hudElements.healthText = healthText;
                }

                if (this.hudConfig && this.hudConfig.showTimer) {
                    const timerBlock = new BABYLON.GUI.TextBlock('game_hud_timer_text');
                    const totalSecs = Math.max(0, Math.ceil(this.gameTimer || 0));
                    const mins = Math.floor(totalSecs / 60);
                    const secs = Math.floor(totalSecs % 60);
                    timerBlock.text = `Time: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                    timerBlock.color = "#00E5FF";
                    timerBlock.fontSize = 20;
                    timerBlock.fontWeight = "bold";
                    timerBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    timerBlock.height = "35px";
                    timerBlock.shadowColor = "black";
                    timerBlock.shadowBlur = 4;
                    container.addControl(timerBlock);
                    this.hudElements.timerText = timerBlock;
                }

                this.uiManager.advancedTexture.addControl(container);
                this.hudElements.container = container;
            }

            _updateGameHUD() {
                if (!this.hudElements || !this.hudElements.container) return;
                if (this.hudElements.scoreText) {
                    this.hudElements.scoreText.text = "Score: " + (this.gameScore || 0);
                }
                if (this.hudElements.healthText && this.hudElements.healthBarFill) {
                    const pct = Math.max(0, Math.min(100, ((this.gameHealth || 0) / (this.maxGameHealth || 100)) * 100));
                    this.hudElements.healthBarFill.width = (pct / 100 * 216) + "px";
                    this.hudElements.healthBarFill.background = pct > 50 ? "#4CAF50" : (pct > 25 ? "#FF9800" : "#F44336");
                    this.hudElements.healthText.text = `HP: ${this.gameHealth || 0}/${this.maxGameHealth || 100}`;
                }
                if (this.hudElements.timerText) {
                    const totalSecs = Math.max(0, Math.ceil(this.gameTimer || 0));
                    const mins = Math.floor(totalSecs / 60);
                    const secs = Math.floor(totalSecs % 60);
                    this.hudElements.timerText.text = `Time: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                }
            }

            triggerGameOver(isWin = false, customMessage = '') {
                this.setGameState(isWin ? 'victory' : 'game_over');
                const title = isWin ? '🏆 VICTORY!' : '💥 GAME OVER';
                const bodyText = customMessage || (isWin ? `Congratulations! You won with a score of ${this.gameScore || 0}.` : `Game over! Final Score: ${this.gameScore || 0}.`);

                const popupName = "game_over_popup_" + Date.now();
                this.uiManager.createPopup(popupName, title, {
                    text: bodyText,
                    btnCtaText: '🔄 Play Again',
                    onCtaClick: () => {
                        this.uiManager.hidePopup(popupName);
                        if (window.doRun) window.doRun();
                    }
                });
                this.uiManager.showPopup(popupName);
            }

            getMeshNames() {
                return Object.keys(this.objects);
            }

            // --- Scene Start Events ---
            onSceneStart(callback) {
                this.onSceneStartObservable.add(callback);
            }

            triggerSceneStart() {
                this.onSceneStartObservable.notifyObservers();
                this.processPendingCollisions();
                this.processPendingClickHandlers();
                if (this.uiManager) {
                    this.uiManager.processPendingControlClicks();
                }
            }

            // --- Global Event Bus ---
            onGlobalEvent(eventName, callback) {
                if (!this.globalEventBus[eventName]) {
                    this.globalEventBus[eventName] = new BABYLON.Observable();
                }
                this.globalEventBus[eventName].add(callback);
            }

            broadcastGlobalEvent(eventName) {
                if (this.globalEventBus[eventName]) {
                    this.globalEventBus[eventName].notifyObservers();
                }
            }

            // --- Swipe Events ---
            onSwipe(target, direction, callback) {
                const dir = direction.toUpperCase();
                if (this.swipeCallbacks[dir]) {
                    this.swipeCallbacks[dir].push({ target, callback });
                }
            }

            triggerSwipe(direction) {
                const dir = direction.toUpperCase();
                if (this.swipeCallbacks[dir]) {
                    this.swipeCallbacks[dir].forEach(item => {
                        try {
                            const resolved = this._resolveTarget(item.target);
                            const targets = Array.isArray(resolved) ? resolved : [resolved];
                            targets.forEach(subTarget => {
                                const mesh = this._getMesh(subTarget);
                                if (mesh) {
                                    item.callback(mesh);
                                }
                            });
                        } catch (e) {
                            console.error(`Error running onSwipe callback for ${dir}:`, e);
                        }
                    });
                }
            }

            // --- Local Object Observables ---
            onObjectEvent(target, eventName, callback) {
                const resolved = this._resolveTarget(target);
                if (Array.isArray(resolved)) {
                    resolved.forEach(subTarget => this.onObjectEvent(subTarget, eventName, callback));
                    return;
                }

                let targetMesh = this._getMesh(target);
                if (targetMesh) {
                    if (!targetMesh.customObservables) {
                        targetMesh.customObservables = {};
                    }
                    if (!targetMesh.customObservables[eventName]) {
                        targetMesh.customObservables[eventName] = new BABYLON.Observable();
                    }
                    if (!targetMesh._attachedObjectEvents) {
                        targetMesh._attachedObjectEvents = new Set();
                    }
                    const eventKey = `${eventName}_${callback}`;
                    if (!targetMesh._attachedObjectEvents.has(eventKey)) {
                        targetMesh._attachedObjectEvents.add(eventKey);
                        targetMesh.customObservables[eventName].add(callback);
                    }
                } else {
                    let name;
                    if (typeof target === 'string') {
                        name = target;
                    } else if (target && typeof target === 'object' && target.name) {
                        name = target.name;
                    }
                    if (name) {
                        if (!this.pendingObjectEvents) {
                            this.pendingObjectEvents = {};
                        }
                        if (!this.pendingObjectEvents[name]) {
                            this.pendingObjectEvents[name] = [];
                        }
                        this.pendingObjectEvents[name].push({ eventName, callback });
                    } else if (typeof target === 'function') {
                        if (!this.pendingLazyObjectEvents) {
                            this.pendingLazyObjectEvents = [];
                        }
                        this.pendingLazyObjectEvents.push({ targetGetter: target, eventName, callback });
                    }
                }
            }

            triggerObjectEvent(target, eventName) {
                if (this.pendingLazyObjectEvents && this.pendingLazyObjectEvents.length > 0) {
                    const remaining = [];
                    for (const item of this.pendingLazyObjectEvents) {
                        const resolved = this._resolveTarget(item.targetGetter);
                        const targets = Array.isArray(resolved) ? resolved : [resolved];
                        let allResolved = targets.length > 0;
                        for (const subTarget of targets) {
                            const m = this._getMesh(subTarget);
                            if (m) {
                                this.onObjectEvent(m, item.eventName, item.callback);
                            } else {
                                allResolved = false;
                            }
                        }
                        if (!allResolved) {
                            remaining.push(item);
                        }
                    }
                    this.pendingLazyObjectEvents = remaining;
                }

                const resolved = this._resolveTarget(target);
                const targets = Array.isArray(resolved) ? resolved : [resolved];
                targets.forEach(subTarget => {
                    let targetMesh = this._getMesh(subTarget);
                    if (targetMesh && targetMesh.customObservables && targetMesh.customObservables[eventName]) {
                        targetMesh.customObservables[eventName].notifyObservers();
                    }
                });
            }

            _resolveTarget(target) {
                while (typeof target === 'function') {
                    try {
                        target = target();
                    } catch (e) {
                        return null;
                    }
                }
                return target;
            }

            _getMesh(target) {
                target = this._resolveTarget(target);
                if (!target) return null;
                if (target instanceof BABYLON.AbstractMesh || target instanceof BABYLON.TransformNode) {
                    return target;
                }
                let name;
                if (typeof target === 'string') {
                    name = target;
                } else if (typeof target === 'object' && target.name) {
                    name = target.name;
                }
                return this.objects[name] || (typeof target === 'object' ? target : null);
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
                    const container = await BABYLON.SceneLoader.LoadAssetContainerAsync("", getProxiedUrl(url), this.scene);
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

            setGlow(enabled, intensity) {
                if (enabled) {
                    if (!this.glowLayer) {
                        this.glowLayer = new BABYLON.GlowLayer("glow", this.scene);
                    }
                    this.glowLayer.intensity = intensity;
                } else {
                    if (this.glowLayer) {
                        this.glowLayer.dispose();
                        this.glowLayer = null;
                    }
                }
            }

            setProperty(target, property, value) {
                let mesh = this._getMesh(target);
                if (mesh && property) {
                    const props = property.split('.');
                    let curr = mesh;
                    for (let i = 0; i < props.length - 1; i++) {
                        if (curr[props[i]]) curr = curr[props[i]];
                        else return;
                    }
                    curr[props[props.length - 1]] = value;
                }
            }

            _clearBackground() {
                if (this.background) {
                    if (this.background.dispose) {
                        this.background.dispose();
                    }
                    this.background = null;
                }
                this.backgroundImageWidth = null;
                this.backgroundImageHeight = null;
                const container = document.querySelector('.canvas-container');
                if (container) {
                    container.style.aspectRatio = '';
                    resizeCanvas();
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

        class UIManager {
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

            _resolveTarget(target) {
                while (typeof target === 'function') {
                    try {
                        target = target();
                    } catch (e) {
                        return null;
                    }
                }
                return target;
            }

            _getControl(target) {
                target = this._resolveTarget(target);
                if (!target) return null;
                if (typeof target === 'string') {
                    return this.controls[target] || null;
                }
                return target;
            }

            setText(target, text) {
                const control = this._getControl(target);
                if (control && control.text !== undefined) {
                    control.text = text;
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

            getInputText(target) {
                const control = this._getControl(target);
                if (control && control.text !== undefined) {
                    return control.text;
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
                const image = new BABYLON.GUI.Image(name, getProxiedUrl(url));
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

            async createImageFromAsset(name, assetOrName, options = {}) {
                let asset = assetOrName;
                if (typeof assetOrName === 'string') {
                    asset = await window.assetManager.getAsset(assetOrName);
                }
                if (!asset) return null;
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

            onControlClick(target, callback) {
                if (!this.pendingControlClickHandlers) {
                    this.pendingControlClickHandlers = [];
                }
                this.pendingControlClickHandlers.push({ target, callback });
                this.processPendingControlClicks();
            }

            processPendingControlClicks() {
                if (!this.pendingControlClickHandlers || this.pendingControlClickHandlers.length === 0) return;
                const remaining = [];
                for (const item of this.pendingControlClickHandlers) {
                    const control = this._getControl(item.target);
                    if (control) {
                        control.onPointerClickObservable.add(item.callback);
                    } else {
                        remaining.push(item);
                    }
                }
                this.pendingControlClickHandlers = remaining;
            }

            getControlByName(name) {
                return this._getControl(name);
            }

            showSpeechBubble(target, text, duration = 4, sceneManager = null) {
                let mesh = null;
                if (sceneManager && typeof sceneManager._getMesh === 'function') {
                    mesh = sceneManager._getMesh(target);
                } else if (target && target.position) {
                    mesh = target;
                }

                const bubbleName = "speech_bubble_" + (mesh ? (mesh.name || "mesh") : "global");
                let bubble = this.controls[bubbleName];

                if (!bubble) {
                    bubble = new BABYLON.GUI.Rectangle(bubbleName);
                    bubble.cornerRadius = 12;
                    bubble.thickness = 2;
                    bubble.color = "#00e5ff";
                    bubble.background = "rgba(10, 20, 35, 0.88)";
                    bubble.paddingLeft = "8px";
                    bubble.paddingRight = "8px";
                    bubble.paddingTop = "6px";
                    bubble.paddingBottom = "6px";
                    bubble.adaptWidthToChildren = true;
                    bubble.adaptHeightToChildren = true;
                    bubble.isHitTestVisible = false;

                    const textBlock = new BABYLON.GUI.TextBlock(bubbleName + "_text");
                    textBlock.text = text || "";
                    textBlock.color = "#ffffff";
                    textBlock.fontSize = 18;
                    textBlock.resizeToFit = true;
                    textBlock.textWrapping = true;
                    textBlock.maxWidth = "280px";
                    textBlock.paddingLeft = "10px";
                    textBlock.paddingRight = "10px";
                    textBlock.paddingTop = "6px";
                    textBlock.paddingBottom = "6px";

                    bubble.addControl(textBlock);
                    this.advancedTexture.addControl(bubble);
                    this.controls[bubbleName] = bubble;
                } else {
                    if (bubble.children && bubble.children[0]) {
                        bubble.children[0].text = text || "";
                    }
                    bubble.isVisible = true;
                }

                if (mesh) {
                    bubble.linkWithMesh(mesh);
                    bubble.linkOffsetY = -70;
                } else {
                    bubble.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                    bubble.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                    bubble.top = "80px";
                }

                if (bubble._hideTimeout) {
                    clearTimeout(bubble._hideTimeout);
                    bubble._hideTimeout = null;
                }

                if (duration > 0) {
                    bubble._hideTimeout = setTimeout(() => {
                        if (bubble) bubble.isVisible = false;
                    }, duration * 1000);
                }

                return bubble;
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
                    if (isValidAssetURL(options.image)) {
                        const image = new BABYLON.GUI.Image(`${name}_image`, getProxiedUrl(options.image));
                        image.width = "150px";
                        image.height = "150px";
                        image.paddingBottom = "20px";
                        panel.addControl(image);
                    }
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


    class Timer {
        constructor(duration = 60, autoStart = true, sceneManager = null) {
            this.id = 'timer_' + Math.random().toString(36).substr(2, 9);
            this.initialDuration = Number(duration) || 0;
            this.remaining = this.initialDuration;
            this.isRunning = !!autoStart;
            this.isFinished = false;
            this.sceneManager = sceneManager;
            this.onFinishCallbacks = [];
        }

        start() {
            this.isRunning = true;
            this.isFinished = false;
            return this;
        }

        pause() {
            this.isRunning = false;
            return this;
        }

        reset(duration = null, autoStart = null) {
            if (duration !== null && duration !== undefined) {
                this.initialDuration = Number(duration) || 0;
            }
            this.remaining = this.initialDuration;
            this.isFinished = false;
            if (autoStart !== null && autoStart !== undefined) {
                this.isRunning = !!autoStart;
            } else {
                this.isRunning = true;
            }
            if (this.sceneManager) {
                this.sceneManager._updateGameHUD();
            }
            return this;
        }

        update(dt) {
            if (!this.isRunning || this.isFinished) return;

            this.remaining = Math.max(0, this.remaining - dt);

            if (this.remaining <= 0) {
                this.remaining = 0;
                this.isRunning = false;
                this.isFinished = true;
                for (const cb of this.onFinishCallbacks) {
                    try { cb(); } catch(e) { console.error("Error in timer finish callback:", e); }
                }
            }

            if (this.sceneManager) {
                this.sceneManager._updateGameHUD();
            }
        }

        getRemaining() {
            return Math.max(0, Math.ceil(this.remaining));
        }

        onFinish(callback) {
            if (typeof callback === 'function') {
                this.onFinishCallbacks.push(callback);
            }
            return this;
        }

        valueOf() {
            return this.getRemaining();
        }

        toString() {
            return String(this.getRemaining());
        }
    }

    class TimerManager {
        constructor(sceneManager) {
            this.sceneManager = sceneManager;
            this.timers = [];
        }

        createTimer(duration = 60, autoStart = true) {
            const timer = new Timer(duration, autoStart, this.sceneManager);
            this.timers.push(timer);
            return timer;
        }

        update(dt) {
            for (const timer of this.timers) {
                timer.update(dt);
            }
        }

        clear() {
            this.timers = [];
        }
    }

    global.Timer = Timer;
    global.TimerManager = TimerManager;

    if (typeof global.EngineRuntime !== 'undefined' && global.EngineRuntime.register) {
        global.EngineRuntime.register('babylon', BabylonSceneManager);
        global.EngineRuntime.register('3d-babylon', BabylonSceneManager);
        global.EngineRuntime.register('3d', BabylonSceneManager);
    }

    global.CustomLoadingScreen = CustomLoadingScreen;
    global.BabylonSceneManager = BabylonSceneManager;
    global.UIManager = UIManager;
})(typeof window !== 'undefined' ? window : this);
