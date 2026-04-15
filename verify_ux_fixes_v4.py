
import sys
import os
import time
import subprocess
from playwright.sync_api import sync_playwright

def verify_ux_fixes():
    # Build the site
    print("Building site with Jekyll...")
    subprocess.run(["bundle", "exec", "jekyll", "build"], check=True)

    # Start a simple web server
    print("Starting static server...")
    server_process = subprocess.Popen(["python3", "-m", "http.server", "8000", "--directory", "_site"])
    time.sleep(3) # Wait for server to start

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto("http://localhost:8000")

            # 1. Start Coding
            page.click("#start-button")
            time.sleep(1)

            # 2. Verify connectivity (create_primitive is a statement)
            print("Checking block connectivity...")
            is_statement = page.evaluate("""() => {
                const block = workspace.newBlock('create_primitive');
                const result = block.previousConnection != null && block.nextConnection != null && block.outputConnection == null;
                block.dispose();
                return result;
            }""")
            if is_statement:
                print("SUCCESS: create_primitive is a statement block.")
            else:
                print("FAILURE: create_primitive is NOT a statement block.")

            # 3. Trigger flyout via Blockly API
            print("Triggering flyout via Blockly API...")
            page.evaluate("""() => {
                const toolbox = workspace.getToolbox();
                toolbox.selectItemByPosition(0); // Select Logic
            }""")
            time.sleep(1)

            # 4. Verify Full-Screen Flyout is visible
            overlay = page.locator("#flyout-overlay")
            close_btn = page.locator("#flyout-close-button")

            if overlay.is_visible() and close_btn.is_visible():
                print("SUCCESS: Flyout elements are visible.")
            else:
                print(f"FAILURE: Flyout visible: {overlay.is_visible()}, Close btn visible: {close_btn.is_visible()}")
                page.screenshot(path="verification/flyout_not_visible.png")

            # 5. Verify Close Button works
            if close_btn.is_visible():
                print("Clicking close button...")
                close_btn.click()
                time.sleep(1)
                if not overlay.is_visible():
                    print("SUCCESS: Close button hides the flyout.")
                else:
                    print("FAILURE: Close button did not hide the flyout.")
                    page.screenshot(path="verification/flyout_still_visible.png")

            # 6. Verify Overlay Click works
            print("Triggering flyout again...")
            page.evaluate("""() => {
                const toolbox = workspace.getToolbox();
                toolbox.selectItemByPosition(0);
            }""")
            time.sleep(1)
            if overlay.is_visible():
                print("Clicking overlay...")
                # The overlay is #flyout-overlay
                overlay.click()
                time.sleep(1)
                if not overlay.is_visible():
                    print("SUCCESS: Overlay click hides the flyout.")
                else:
                    print("FAILURE: Overlay click did not hide the flyout.")
                    page.screenshot(path="verification/overlay_click_failed.png")

            browser.close()
    finally:
        server_process.terminate()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    verify_ux_fixes()
