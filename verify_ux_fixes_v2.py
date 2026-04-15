
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

            # 2. Open Search and find create_primitive
            page.click("#toggleToolboxButton")
            page.fill("#search-input", "create_primitive")
            time.sleep(1)

            # 3. Verify Full-Screen Flyout is visible
            overlay = page.locator("#flyout-overlay")
            close_btn = page.locator("#flyout-close-button")

            if overlay.is_visible() and close_btn.is_visible():
                print("SUCCESS: Flyout elements are visible.")
            else:
                print(f"FAILURE: Flyout visible: {overlay.is_visible()}, Close btn visible: {close_btn.is_visible()}")
                page.screenshot(path="verification/error_flyout.png")

            # 4. Verify Close Button works
            close_btn.click()
            time.sleep(0.5)
            if not overlay.is_visible():
                print("SUCCESS: Close button hides the flyout.")
            else:
                print("FAILURE: Close button did not hide the flyout.")

            # 5. Verify connectivity (create_primitive is a statement)
            # We can check this by trying to drag it or checking its properties via JS in the page
            is_statement = page.evaluate("""() => {
                const block = workspace.newBlock('create_primitive');
                return block.previousConnection != null && block.nextConnection != null && block.outputConnection == null;
            }""")
            if is_statement:
                print("SUCCESS: create_primitive is a statement block.")
            else:
                print("FAILURE: create_primitive is NOT a statement block.")

            browser.close()
    finally:
        server_process.terminate()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    verify_ux_fixes()
