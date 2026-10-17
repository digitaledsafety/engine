# Runtime Architecture & Pluggable Engine System

## Overview

The Engine platform decouples visual logic programming (**Blockly**) from specific graphics rendering implementations (**Babylon.js**, 2D Canvas, etc.). By extracting graphics-specific and low-level logic into modular JavaScript runtime layers, the engine supports multiple runtime backends (such as 3D, 2D Canvas, Phaser, or Headless test environments) without cluttering core workspace visual scripts.

---

## Engine vs. Blockly Decision Framework

A fundamental design goal of the platform is keeping visual Blockly workspaces clean, readable, and maintainable, while delegating complex driver logic and raw browser capabilities to the JavaScript runtime engine layer.

### Rule-of-Thumb: Engine vs. Blockly

| Functionality Category | Place in Engine (`assets/js/*.js`) | Place in Blockly Blocks |
| :--- | :--- | :--- |
| **Workspace Manageability & Complexity** | Multi-block boilerplate routines, complex calculations requiring dozens of blocks, or repetitive setup helper code that would clutter visual workspaces. | High-level game rules, decision trees, conditionals, score thresholds, and user interaction logic. |
| **Hardware & Web API Access** | Raw browser Web APIs (webcam tracking, Web Speech TTS/STT, audio synthesis, camera framing, canvas rendering, peer data channels). | High-level trigger blocks (e.g., `when object detected`, `speak retro voice`, `on action`). |
| **Graphics & Physics Engine Calls** | Direct Babylon.js mesh instantiation, material texturing, particle systems, light/camera matrices, or physics impostor creation. | Object selector blocks, asset reference blocks, and event handling hooks. |
| **Performance & Frequency** | Operations running inside continuous `requestAnimationFrame` loops or high-frequency physics tick handlers. | Event-driven callbacks triggered by scene events (`event_on_scene_start`, `event_on_click`, `event_on_swipe`). |

### How Will You Know When New Engine Functionality Is Required?

#### 1. For Game Creators (End Users)
Users building games or spatial scenes will know new engine functionality is required when:
* **Visual Workspace Clutter:** Building a desired system in Blockly requires dozens of repetitive or deeply nested blocks that make the workspace visually overwhelming or difficult to maintain/remix.
* **Unreachable Engine Capabilities:** A feature cannot be expressed using existing high-level blocks because it requires direct access to underlying Babylon.js rendering properties, physical impostors, or browser Web APIs not yet exposed by the active engine runtime.
* **Performance Bottlenecks:** A script running per-frame in Blockly causes visual stutter or delayed execution that would be smoother if encapsulated inside a compiled per-frame observer in JavaScript.

#### 2. For Platform Developers & Contributors
Contributors extending the platform will know to add functionality to the Engine runtime when:
* Encapsulating boilerplate logic into a single runtime engine helper method allows exposing a single, concise Blockly block instead of asking users to assemble multi-block visual constructs.
* Creating new hardware drivers, rendering modes (e.g. 2D Canvas or Phaser), or multiplayer synchronization hooks that operate at the framework layer.

---

## Bundling Runtime-Specific Blocks (Option 1 Architecture)

To ensure the base engine (`BaseRuntimeEngine`) remains strictly clean and decoupled from specific rendering backends, runtime-specific Blockly blocks are bundled directly within their corresponding runtime engine classes via a static `registerBlocks(Blockly, generator)` method.

### Static Block Registration Architecture

Each runtime class implements a static `registerBlocks` hook:

```javascript
class Canvas2DRuntimeEngine extends BaseRuntimeEngine {
    /**
     * Bundled static method for registering 2D Canvas runtime Blockly blocks and generators.
     */
    static registerBlocks(Blockly, generator) {
        if (!Blockly || !Blockly.Blocks) return false;

        // Register block definition
        Blockly.Blocks['canvas2d_draw_rect'] = {
            init: function() {
                this.appendValueInput("X").setCheck("Number").appendField("draw 2D rect X");
                this.appendValueInput("Y").setCheck("Number").appendField("Y");
                this.appendValueInput("WIDTH").setCheck("Number").appendField("width");
                this.appendValueInput("HEIGHT").setCheck("Number").appendField("height");
                this.appendValueInput("COLOR").setCheck("String").appendField("color");
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setStyle("scene_blocks");
            }
        };

        // Register JavaScript code generator
        if (generator && generator.forBlock) {
            generator.forBlock['canvas2d_draw_rect'] = function(block, gen) {
                const x = gen.valueToCode(block, 'X', gen.ORDER_ATOMIC) || '0';
                const y = gen.valueToCode(block, 'Y', gen.ORDER_ATOMIC) || '0';
                const w = gen.valueToCode(block, 'WIDTH', gen.ORDER_ATOMIC) || '100';
                const h = gen.valueToCode(block, 'HEIGHT', gen.ORDER_ATOMIC) || '100';
                const c = gen.valueToCode(block, 'COLOR', gen.ORDER_ATOMIC) || '"#FF0000"';
                return `if (window.sceneManager && window.sceneManager.drawRect) { window.sceneManager.drawRect(${x}, ${y}, ${w}, ${h}, ${c}); }\n`;
            };
        }
        return true;
    }
}
```

### Registry Block Integration (`EngineRuntime`)

The `EngineRuntime` singleton registry automatically triggers block registration during runtime instantiation or workspace initialization:

```javascript
// Register blocks for a specific runtime
EngineRuntime.registerBlocks('canvas2d', Blockly, javascriptGenerator);

// Or register blocks across all loaded runtimes at once
EngineRuntime.registerAllBlocks(Blockly, javascriptGenerator);

// Creating a runtime automatically invokes its registerBlocks if Blockly exists
const activeRuntime = EngineRuntime.createRuntime('canvas2d', canvasElement);
```

---

## Key Components

### 1. Base Runtime Interface (`assets/js/runtime-base.js`)

`BaseRuntimeEngine` defines the abstract contract that all runtime engines must implement:

* **Lifecycle Management:** `init()`, `start()`, `stop()`, `dispose()`, `reset()`.
* **Event System:** `onSceneStart()`, `triggerSceneStart()`, `everyFrame()`, `onAction()`, `triggerAction()`.
* **High-Level Game State:** `setGameState()`, `getGameState()`, `setGameScore()`, `addGameScore()`, `setGameHealth()`, `changeGameHealth()`, `triggerGameOver()`.
* **Abstract Entity Hooks:** `createPrimitive()`, `importModel()`, `destroyObject()`, `getSceneObject()`.

#### `EngineRuntime` Singleton Registry
The `EngineRuntime` registry manages runtime instantiation and block registration without polluting global window scope:

```javascript
// Register a runtime engine class
EngineRuntime.register('babylon', BabylonSceneManager);
EngineRuntime.register('canvas2d', Canvas2DRuntimeEngine);

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

### 3. 2D Canvas Runtime (`assets/js/runtime-canvas2d.js`)

`Canvas2DRuntimeEngine` extends `BaseRuntimeEngine` to provide a lightweight 2D rendering environment with bundled block registration for 2D visual workspaces.

---

### 4. Workspace Runtime Configuration (`_workspaces/*.md`)

Each workspace specifies its active runtime engine using the `runtime` frontmatter field in its markdown configuration:

```yaml
---
runtime: "babylon"
layout: "default"
title: "Space Shooter"
---
```

When a workspace is loaded, `_layouts/default.html` inspects `{{ page.runtime }}` and invokes `EngineRuntime.createRuntime(runtimeType, canvas)` automatically.
