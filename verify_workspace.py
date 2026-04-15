import asyncio
import base64
import json
import os
import re
from playwright.async_api import async_playwright

async def verify_workspace(filename):
    print(f"Verifying {filename}...")
    path = os.path.join('_workspaces', filename)
    with open(path, 'r') as f:
        content = f.read()

    match = re.search(r'workspace_data: "(.*)"', content)
    if not match:
        print(f"No workspace data in {filename}")
        return

    data_b64 = match.group(1)
    if data_b64 == "PLACEHOLDER":
        print(f"Workspace {filename} is PLACEHOLDER")
        return

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Start Jekyll server in background if not already running
        # For now, I'll assume I'm running this against a local server or I can inject the data.
        # Actually, I'll just load index.md (which is the main editor) and inject the data.

        await page.goto("http://localhost:4000/")

        # Wait for Blockly to be ready
        await page.wait_for_selector("#blocklyDiv")

        # Try to load the data
        try:
            success = await page.evaluate(f"""
                (async () => {{
                    try {{
                        const dataB64 = "{data_b64}";
                        const decoded = atob(dataB64);
                        const projectData = JSON.parse(decoded);
                        await window.sceneManager.uiManager.scene.onReadyObservable.addOnce(() => {{}}); // just to be sure
                        await window.projectManager.loadProjectData(projectData);
                        return true;
                    }} catch (e) {{
                        console.error(e);
                        return false;
                    }}
                }})()
            """)
            if success:
                print(f"Successfully loaded {filename}")
                # Check for errors in console
                # (You might want to listen to console events)
            else:
                print(f"Failed to load {filename}")
        except Exception as e:
            print(f"Error evaluating script for {filename}: {e}")

        await browser.close()

if __name__ == "__main__":
    # Note: This requires the Jekyll server to be running.
    # I will start it in the background in the next step if I decide to use this approach.
    pass
