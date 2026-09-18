---
layout: "docs"
title: "Installation"
---

# Installation & Local Setup

To run and test **Engine** locally, you only need a modern web browser and a static web server (or Jekyll for local site serving).

## Quick Start (Static Web Server)

1. **Clone or Navigate to the Repository:**
   ```bash
   git clone https://github.com/digitaledsafety/engine.digitaledsafety.github.io.git
   cd engine.digitaledsafety.github.io
   ```

2. **Start a Local Web Server:**
   Using Python 3 built-in HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
   Or using Node.js `npx http-server`:
   ```bash
   npx http-server -p 8000
   ```

3. **Launch in Browser:**
   Open `http://localhost:8000` in your web browser.

---

## Development & Automated Testing

To run the project's Playwright integration test suite:

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Run Playwright Tests:**
   ```bash
   npx playwright test
   ```
