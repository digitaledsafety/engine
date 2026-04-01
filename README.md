# Engine 

[![CI](https://github.com/digitaledsafety/engine.digitaledsafety.github.io/actions/workflows/deploy.yml/badge.svg)]
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Status: Beta](https://img.shields.io/badge/status-beta-orange.svg)

<div align="center">
  <video src="https://github.com/user-attachments/assets/f50a2e82-1dfa-4e60-94aa-717ae026ccdf" controls width="400px">
    Your browser does not support the video tag.
  </video>
</div>

**Engine** is an open-source, block-based 3D coding environment designed to make spatial programming intuitive and accessible. By leveraging a visual interface, it allows users to build and manipulate 3D worlds without needing to master complex syntax first.

---

### Key Features

* **Visual 3D Logic:** Use familiar block-based programming (Blockly) to control objects and logic in a 3D space.
* **Physics Engine:** Integrated physics support for gravity, collisions, forces, and impostors (boxes, spheres, etc.).
* **VRM Avatar Support:** Import and interact with VRM format 3D avatars seamlessly.
* **GUI System:** Build interactive user interfaces, buttons, and dynamic popups directly within your project.
* **Audio Integration:** Add sound effects and play musical notes to enhance the 3D experience.
* **Real-time Rendering:** See your code come to life instantly with high-performance 3D rendering in the browser.
* **Modular Design:** Built with extensibility in mind, allowing for custom blocks and workspace configurations.
* **Web-Based:** Runs entirely in the browser using JavaScript and Babylon.js, requiring no installation.

---

### Wiki / Documentation

For detailed guides on how to use the tool, create custom workspaces, or contribute to the engine, please visit our **[Wiki](_docs/home.md)**.

### Getting Started

1. **Explore the Editor:** Open `index.md` (or the hosted GitHub Pages site) to launch the environment.
2. **Pick a Workspace:** Choose from pre-configured layouts in the `_workspaces` directory, such as `space-shooter` or `virtual-pet`.
3. **Run Your Code:** Snap blocks together and hit play to see your 3D creation move.

---

### Technical Overview

The engine is built using a combination of Python for logic verification and JavaScript for the frontend experience.

* **3D Engine:** Powered by **Babylon.js** for robust 3D rendering and physics.
* **Visual Programming:** Utilizes **Blockly** for the drag-and-drop logic interface.
* **Validation:** Uses `verify_collision.py` and `verify_popup_variables.py` (Python/Playwright) to ensure workspace integrity.
* **Layouts:** Managed via Jekyll-style `_layouts` and `_config.yml` for easy web deployment.

### Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
