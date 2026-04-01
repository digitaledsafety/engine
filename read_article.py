import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        page = await context.new_page()
        await page.goto("https://devforum.roblox.com/t/using-robloxs-avatar-3d-api-to-import-users-avatars-into-a-website-or-whatever-youd-like/2432524", wait_until="networkidle")
        # Find some code blocks
        codes = await page.query_selector_all("code")
        for code in codes:
            text = await code.inner_text()
            if "rbxcdn" in text or "XOR" in text or "hash" in text:
                print("--- CODE BLOCK ---")
                print(text)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
