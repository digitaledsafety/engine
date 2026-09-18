---
layout: "docs"
title: "Usage Guide"
---

# Usage Guide

This guide explains how to use the block-based coding environment to build 3D worlds, import models, handle inputs, and program interactive logic.

---

## The Interface

The environment consists of several key interactive areas:

* **Toolbox:** Located on the left, containing categorized visual blocks (e.g., Objects, Physics, Events, Assets, Co-Host, GUI, Actions).
* **Workspace:** The central canvas where you drag, drop, and snap blocks together to program your 3D application.
* **3D Viewport:** The interactive WebGL canvas powered by Babylon.js where your 3D scene renders in real time.
* **Play Overlay & Toolbar:** Controls to play/stop scene execution, reset workspace, framing camera views, and switching workspaces.

---

## Creating & Manipulating 3D Objects

1. **Primitives:** Drag blocks from the "Create" or "Objects" category to instantiate primitive shapes (e.g., Box, Sphere, Cylinder, Plane, Voxel Mesh).
2. **Importing Models & Avatars:** Use blocks like `import 3D model` or `import VRM avatar` to load GLTF/GLB models, VRM characters, or `.mcstructure` voxel files directly into your scene.
3. **Materials & Textures:** Apply colors, PBR materials, or image textures to objects using texture blocks from the Assets category.

---

## Adding Physics & Interactions

* **Physics & Collisions:** Enable physics on objects, select impostors (Box, Sphere, Mesh), and register collision handlers with `when [object A] collides with [object B]`.
* **Unified Input Actions:** Program cross-device interactions using unified action events (`select`, `context`, `zoom`, `navigate`, `menu`) that seamlessly map across touch screens, desktop mouse/keyboard, and game controllers.
* **GUI & Popups:** Create 2D user interface elements, buttons, input fields, and popups over the 3D scene.
