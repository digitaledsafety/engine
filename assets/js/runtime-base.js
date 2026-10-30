/**
 * Base Runtime Engine & Interface for Spatial/Game Engines.
 * Standardizes lifecycle, input actions, event triggers, and game state across runtimes.
 */
(function (global) {
    'use strict';

    class BaseRuntimeEngine {
        constructor(canvas, options = {}) {
            this.canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
            this.options = options;
            this.isInitialized = false;
            this.isRunning = false;

            // Common Observables / Observers
            this.sceneStartObservers = [];
            this.perFrameObservers = [];
            this.gameStateChangeObservers = [];
            this.actionObservers = new Map();

            // High-Level Game State
            this.gameState = 'INITIALIZING';
            this.gameScore = 0;
            this.gameHealth = 100;
        }

        /**
         * Initialize runtime resources, canvas context, and render loops.
         */
        async init() {
            this.isInitialized = true;
            this.gameState = 'READY';
        }

        /**
         * Start or resume main engine loop.
         */
        start() {
            this.isRunning = true;
            this.gameState = 'RUNNING';
        }

        /**
         * Pause main engine loop.
         */
        stop() {
            this.isRunning = false;
            this.gameState = 'PAUSED';
        }

        /**
         * Dispose all resources, event listeners, and engine assets.
         */
        dispose() {
            this.stop();
            this.sceneStartObservers = [];
            this.perFrameObservers = [];
            this.gameStateChangeObservers = [];
            this.actionObservers.clear();
            this.isInitialized = false;
            this.gameState = 'DISPOSED';
        }

        /**
         * Reset engine state to initial conditions.
         */
        reset() {
            this.gameScore = 0;
            this.gameHealth = 100;
            this.gameState = 'READY';
        }

        // --- Event Subscription & Execution Hooks ---

        onSceneStart(callback) {
            if (typeof callback === 'function') {
                this.sceneStartObservers.push(callback);
            }
        }

        async triggerSceneStart() {
            for (const observer of this.sceneStartObservers) {
                try {
                    await observer();
                } catch (err) {
                    console.error('[RuntimeEngine] Error in scene start callback:', err);
                }
            }
        }

        everyFrame(callback) {
            if (typeof callback === 'function') {
                this.perFrameObservers.push(callback);
            }
        }

        onAction(actionType, callback) {
            if (!this.actionObservers.has(actionType)) {
                this.actionObservers.set(actionType, []);
            }
            this.actionObservers.get(actionType).push(callback);
        }

        triggerAction(actionType, data = {}) {
            const handlers = this.actionObservers.get(actionType);
            if (handlers && handlers.length > 0) {
                for (const handler of handlers) {
                    try {
                        handler(data);
                    } catch (err) {
                        console.error(`[RuntimeEngine] Error in action '${actionType}' callback:`, err);
                    }
                }
            }
        }

        isActionActive(actionType) {
            return false;
        }

        // --- High Level Game State APIs ---

        setGameState(state) {
            const oldState = this.gameState;
            this.gameState = state;
            for (const observer of this.gameStateChangeObservers) {
                try {
                    observer(state, oldState);
                } catch (err) {
                    console.error('[RuntimeEngine] Error in game state change observer:', err);
                }
            }
        }

        getGameState() {
            return this.gameState;
        }

        onGameStateChange(callback) {
            if (typeof callback === 'function') {
                this.gameStateChangeObservers.push(callback);
            }
        }

        setGameScore(score) {
            this.gameScore = Number(score) || 0;
        }

        addGameScore(points) {
            this.gameScore += Number(points) || 0;
            return this.gameScore;
        }

        getGameScore() {
            return this.gameScore;
        }

        setGameHealth(health) {
            this.gameHealth = Number(health) || 0;
        }

        changeGameHealth(delta) {
            this.gameHealth += Number(delta) || 0;
            return this.gameHealth;
        }

        getGameHealth() {
            return this.gameHealth;
        }

        triggerGameOver(isWin = false, score = this.gameScore) {
            this.setGameState(isWin ? 'VICTORY' : 'GAME_OVER');
        }

        // --- Game Timer APIs ---

        createTimer(duration = 60, autoStart = true) {
            const initialDuration = Number(duration) || 60;
            return {
                initialDuration: initialDuration,
                duration: initialDuration,
                remaining: initialDuration,
                isRunning: !!autoStart,
                isFinished: false,
                onFinish: function(cb) { return this; },
                start: function() { this.isRunning = true; return this; },
                pause: function() { this.isRunning = false; return this; },
                stop: function() { this.isRunning = false; return this; },
                reset: function(dur = null, auto = null) {
                    if (dur !== null && dur !== undefined) this.initialDuration = Number(dur) || 0;
                    this.remaining = this.initialDuration;
                    this.isFinished = false;
                    if (auto !== null && auto !== undefined) this.isRunning = !!auto;
                    return this;
                },
                getRemaining: function() { return Math.max(0, Math.ceil(this.remaining)); },
                getTimeRemaining: function() { return Math.max(0, Math.ceil(this.remaining)); },
                dispose: function() {}
            };
        }

        setGameTimer(duration, autoStart = true) {
            this.gameTimer = Math.max(0, Number(duration) || 0);
            this.gameTimerInitial = this.gameTimer;
            this.gameTimerRunning = !!autoStart;
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
            if (!this.timerFinishCallbacks) {
                this.timerFinishCallbacks = [];
            }
            if (typeof callback === 'function') {
                this.timerFinishCallbacks.push(callback);
            }
        }

        displayGameHUD(showScore = true, showHealth = true, maxHealth = 100, showTimer = false, timerDuration = 60) {
            // Base implementation stub for HUD display
        }

        setCameraProperties(inertia, wheelPrecision) {
            // Base implementation stub for camera properties
        }

        // --- Abstract Methods to be implemented by Specific Runtimes (3D, 2D, Headless) ---

        createPrimitive(type, options = {}) {
            throw new Error(`[BaseRuntimeEngine] 'createPrimitive' not implemented in runtime ${this.constructor.name}`);
        }

        importModel(url, name, options = {}) {
            throw new Error(`[BaseRuntimeEngine] 'importModel' not implemented in runtime ${this.constructor.name}`);
        }

        destroyObject(target) {
            throw new Error(`[BaseRuntimeEngine] 'destroyObject' not implemented in runtime ${this.constructor.name}`);
        }

        getSceneObject(identifier) {
            return null;
        }
    }

    /**
     * Engine Runtime Registry & Singleton Manager
     */
    class EngineRuntimeRegistry {
        constructor() {
            this._runtimes = new Map();
            this._activeInstance = null;
        }

        register(name, runtimeClass) {
            this._runtimes.set(name.toLowerCase(), runtimeClass);
        }

        getRegistered(name) {
            return this._runtimes.get(name.toLowerCase());
        }

        setActive(instance) {
            this._activeInstance = instance;
            // Provide controlled window.sceneManager alias for existing Blockly generated script execution
            if (global) {
                global.sceneManager = instance;
            }
        }

        getActive() {
            return this._activeInstance;
        }

        createRuntime(name, canvas, options = {}) {
            const RuntimeClass = this.getRegistered(name);
            if (!RuntimeClass) {
                throw new Error(`[EngineRuntimeRegistry] Unknown runtime type '${name}'`);
            }
            const instance = new RuntimeClass(canvas, options);
            this.setActive(instance);
            return instance;
        }
    }

    const registryInstance = new EngineRuntimeRegistry();

    // Export to module systems or browser global safely
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { BaseRuntimeEngine, EngineRuntime: registryInstance };
    } else {
        global.BaseRuntimeEngine = BaseRuntimeEngine;
        global.EngineRuntime = registryInstance;
    }
})(typeof window !== 'undefined' ? window : this);
