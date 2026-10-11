# Runtime Architecture & Pluggable Engine System

## Overview

The Engine platform decouples visual logic programming (**Blockly**) from specific 3D graphics rendering implementations (**Babylon.js**). By extracting graphics-specific logic into modular JavaScript runtime layers, the engine supports multiple runtime backends (such as 3D, 2D Canvas, Phaser, or Headless test environments) without modifying the core workspace or visual programming interface.

---

## Key Components

### 1. Base Runtime Interface (`assets/js/runtime-base.js`)

`BaseRuntimeEngine` defines the abstract contract that all runtime engines must implement:

* **Lifecycle Management:** `init()`, `start()`, `stop()`, `dispose()`, `reset()`.
* **Event System:** `onSceneStart()`, `triggerSceneStart()`, `everyFrame()`, `onAction()`, `triggerAction()`.
* **High-Level Game State:** `setGameState()`, `getGameState()`, `setGameScore()`, `addGameScore()`, `setGameHealth()`, `changeGameHealth()`, `triggerGameOver()`.
* **Abstract Entity Hooks:** `createPrimitive()`, `importModel()`, `destroyObject()`, `getSceneObject()`.

#### `EngineRuntime` Singleton Registry
The `EngineRuntime` registry manages runtime instantiation without polluting global window scope:

```javascript
// Register a runtime engine class
EngineRuntime.register('babylon', BabylonSceneManager);

// Create active runtime instance bound to canvas
const activeRuntime = EngineRuntime.createRuntime('babylon', canvasElement);
```

---

### 2. 3D Graphics Runtime (`assets/js/babylon-runtime.js`)

`BabylonSceneManager` extends `BaseRuntimeEngine` to provide complete 3D graphics rendering, physics, and UI capabilities:

* **Rendering Engine:** Powered by **Babylon.js** (`BABYLON.Engine`, `BABYLON.Scene`).
* **3D Object Lifecycle:** Standard primitives (box, sphere, cylinder, cone, torus, ground), `.glb`/`.gltf` model loading, VRM avatar loading, particle SPS cubes, and `.mcstructure` voxel loading.
* **Physics Integration:** Impostor resolution (Box, Sphere, Plane, Mesh), gravity, restitution, friction, and collision observables.
* **Lighting & Cameras:** Perspective, Isometric, First-Person, Orbit, framing, and procedural flight cameras.
* **3D & Fullscreen GUI (`UIManager`):** Babylon Dynamic Textures, text blocks, buttons, popups, and speech bubbles.

---

### 3. Workspace Runtime Configuration (`_workspaces/*.md`)

Each workspace specifies its active runtime engine using the `runtime` frontmatter field in its markdown configuration:

```yaml
---
runtime: "babylon"
layout: "default"
title: "Space Shooter"
---
```

When a workspace is loaded, `_layouts/default.html` inspects `{{ page.runtime }}` and invokes `EngineRuntime.createRuntime(runtimeType, canvas)` automatically.

---

## Decoupling Blockly Blocks

Blockly blocks are categorized into two tiers:

1. **Generic Programming Blocks:** Standard logic, loops, math, variables, text, lists, and unified input action blocks (`event_on_action`, `is_action_active`). These function across any runtime.
2. **Runtime-Specific Blocks:** Blocks operating on 3D meshes, 3D materials, particle SPS cubes, 3D lights, or VRM avatars. These generate code interacting with the active runtime interface.

---

## Adding a New Runtime Backend

To add a new runtime engine (for instance, a 2D Canvas engine or Phaser backend):

1. **Create the Runtime Class:** Create a new file in `assets/js/runtime-[name].js` extending `BaseRuntimeEngine`:

   ```javascript
   class Canvas2DRuntimeEngine extends BaseRuntimeEngine {
       constructor(canvas, options = {}) {
           super(canvas, options);
           this.ctx = this.canvas.getContext('2d');
       }

       async init() {
           await super.init();
           // Initialize 2D canvas context and render loop
       }

       createPrimitive(type, options = {}) {
           // Implement 2D primitive creation
       }

       destroyObject(target) {
           // Implement 2D object cleanup
       }
   }

   EngineRuntime.register('canvas2d', Canvas2DRuntimeEngine);
   ```

2. **Include Script in Layout:** Add `<script src="{{ '/assets/js/runtime-canvas2d.js' | relative_url }}"></script>` to `_layouts/default.html`.

3. **Configure Workspace:** Set `runtime: "canvas2d"` in target workspace frontmatter.
