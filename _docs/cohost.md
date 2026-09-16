---
layout: "docs"
title: "Digital Co-Host Avatar guide & examples"
---

# Digital Co-Host Livestreamer Avatar ("Word") Guide

This guide provides examples and explanations for building real-time digital co-host livestreamer avatars using visual Blockly blocks and JavaScript APIs.

---

## 1. Autonomous Flight Physics & Dynamic Screen Anchors

Word uses Lissajous curves and Perlin/sine floating algorithms to maintain an organic, hovering idle motion in 3D space across a full screen $1920 \times 1080$ transparent canvas.

### Visual Blockly Example:
* `enable procedural flight physics for avatar [avatar] anchor [shoulder]`
* `set flight anchor to [Anchor.Center]`

### JavaScript Code Example:
```javascript
// Create avatar mesh
const avatar = sceneManager.createSphere('avatar', 3, 1.5, 0);

// Enable procedural flight hovering motion anchored near streamer's shoulder
sceneManager.enableProceduralFlight(avatar, 'shoulder');

// Shift flight position dynamically during conversation flow
sceneManager.setFlightAnchor('center');    // Swoop into focal view
sceneManager.setFlightAnchor('workspace'); // Fly over code editor
sceneManager.setFlightAnchor('shoulder');  // Return to shoulder rest position
```

---

## 2. Voice Speech-to-Text Perception (STT)

The PWA captures microphone audio via the browser's Web Audio API and transcribes voice input in real time.

### Visual Blockly Example:
* `start voice perception (STT)`
* `speech transcript text`

### JavaScript Code Example:
```javascript
// Start continuous real-time voice speech-to-text
sceneManager.startSpeechRecognition((transcript) => {
    console.log("Streamer said:", transcript);
});

// Retrieve latest transcribed text
const currentText = sceneManager.getSpeechTranscript();
```

---

## 3. Visual & Spatial Awareness (Webcam Tracking)

Word tracks physical head position and movement on camera, allowing the avatar to react spatially.

### Visual Blockly Example:
* `start webcam visual & spatial tracking`
* `webcam tracker position [X]`

### JavaScript Code Example:
```javascript
// Start webcam tracking
sceneManager.startWebcamTracking((trackingData) => {
    // trackingData contains { x, y, z, gesture }
    console.log("Tracked position:", trackingData.x, trackingData.y);
});

// Get current X or Y spatial position
const posX = sceneManager.getWebcamTrackerPos('x');
```

---

## 4. AI LLM Brain Reasoning & Structured Action Tags

When responding, the LLM outputs spoken text alongside structured action tags (e.g. `[FLY_SHOULDER]`, `[EMOTE_THINKING]`, `[GLOW_ON]`, `[EQUIP_JETPACK]`) which automatically trigger character behaviors.

### Visual Blockly Example:
* `query co-host LLM prompt ["What is this code doing?"] context ["Code editor window active"]`
* `trigger action tag ["[EQUIP_JETPACK]"] on avatar [avatar]`

### JavaScript Code Example:
```javascript
// Query LLM brain with user prompt & stream context
const response = await sceneManager.queryCohostLLM("Explain the current function", "Active window: VS Code");

console.log("Spoken Response:", response.text);
console.log("Parsed Action Tags:", response.actionTags);

// Action tags are auto-triggered, or can be triggered manually:
sceneManager.triggerActionTag('avatar', 'FLY_WORKSPACE');
sceneManager.triggerActionTag('avatar', 'EMOTE_THINKING');
sceneManager.triggerActionTag('avatar', 'GLOW_ON');
sceneManager.triggerActionTag('avatar', 'EQUIP_JETPACK');
```

---

## 5. Retro Character Audio Synthesis

Vocal output is synthesized through Web Speech API speech synthesis filtered through vintage dial-up modem frequencies, bandpass biquad filters, and chiptune sound effect triggers.

### Visual Blockly Example:
* `speak retro character voice ["Word reporting live!"] pitch [1.2]`

### JavaScript Code Example:
```javascript
// Synthesize retro vocal speech with chiptune modem bleeps
sceneManager.speakRetroVoice("Word reporting live on stream!", 1.2, 1.0);
```

---

## 6. OBS Studio Browser Source & Alpha Transparency

To embed the avatar into OBS Studio with full screen transparency:

1. In OBS Studio, add a new **Browser Source**.
2. Set the URL to your project workspace with the transparent query parameter:
   `https://your-domain.com/workspaces/digital-cohost/?obs=1`
3. Set width to `1920` and height to `1080`.
4. Enable **Shutdown source when not visible** if desired.
5. The avatar will hover on top of your stream layout with complete alpha transparency (`scene.clearColor = Color4(0,0,0,0)`).
