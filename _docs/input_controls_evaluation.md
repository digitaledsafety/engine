# Input Controls Evaluation & Cross-Device Control Scheme

## Overview
This document evaluates the input control systems within our 3D engine and Blockly visual programming environment. It details the cross-device input mapping across Mobile Touch/Gestures, Laptop Touchpads, Desktop Mouse & Keyboard, and Game Controllers, establishing a unified, device-agnostic input architecture.

---

## 1. Input Mapping Evaluation Matrix

| Action | Mobile Gesture | Laptop Touchpad | Desktop Mouse & Keys | Game Controller Action |
| :--- | :--- | :--- | :--- | :--- |
| **Select / Primary** (`select`) | Single Tap | Single tap / Left click | Left Click | Primary Action / Select (A / Cross) |
| **Secondary / Context** (`context`) | Long Press / Two-finger tap | Two-finger tap | Right Click | Context Action / Aim (LT / L2 trigger hold) |
| **Zoom / Scope** (`zoom`) | Pinch to Zoom | Two fingers together/apart | Mouse Scroll Wheel / Ctrl + Scroll | Right Stick Click (R3) / LT |
| **Navigate / Pan / Look** (`navigate`) | Swipe / Touch Drag | Two-finger scroll / Drag | Left Click Drag / WASD / Arrow Keys | Analog Sticks (Left/Right) |
| **Menu / Pause** (`menu`) | Menu Button / Pause UI | Escape Key | Escape Key | Menu / Pause (Start / Options) |
| **Double Select / Special** (`double_select`) | Double Tap | Double tap | Double Left Click | Double-press B / Circle button |

---

## 2. Evaluation Findings & Design Decisions

1. **Device-Agnostic Abstraction Layer**:
   - Rather than creating separate Blockly blocks for each platform (e.g. `when key pressed`, `when screen tapped`, `when gamepad button pressed`), the engine exposes a unified `Action` layer (`select`, `context`, `zoom`, `navigate`, `menu`, `double_select`).
   - Visual scripting code remains identical across desktop, mobile, tablet, and controller environments.

2. **Refining Desktop Mouse & Gesture Expectations**:
   - **Navigate / Swipe**: Desktop navigation relies on mouse left-click dragging, WASD keys, and arrow keys.
   - **Menu / Pause**: Mapped consistently to the `Escape` key on keyboard and `Start / Options` button on gamepads.
   - **Zoom**: Mapped to standard mouse wheel scrolling and pinch gestures on touch displays.

3. **Backward Compatibility**:
   - Existing blocks like `on_button_press` and `event_on_swipe` are retrofitted to delegate to the new unified `InputManager` / `ActionManager`, ensuring existing projects continue to function seamlessly.

---

## 3. Architecture & Implementation

- **Gesture Detection**: Native `PointerEvent` and `TouchEvent` listeners on `#gameCanvas` detect single tap, double tap, long press, pinch zoom, and drags/swipes.
- **Gamepad API Polling**: A continuous loop polls standard HTML5 Gamepad API instances on every frame for button presses and analog stick movements.
- **Unified Action Dispatcher**: Actions fire standard `onAction(actionName, callback)` handlers registered in `BabylonSceneManager`.
- **Blockly Integration**: The `event_on_action` block (`when action [ACTION] is triggered do [CODE]`) and `is_action_active` block provide accessible block-based scripting.
