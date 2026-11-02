import asyncio
from playwright.async_api import async_playwright
import os

async def capture_dashboards():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        
        # Helper function to login and snapshot
        async def snap(role, name, path):
            print(f"Snapping {role} {path}")
            await page.goto("http://localhost:4173/login")
            await page.fill('input[placeholder="Enter your ID"]', role)
            await page.fill('input[placeholder="Enter your password"]', "123")
            await page.click('button:has-text("Sign In")')
            await page.wait_for_timeout(2000) # wait for load
            
            await page.goto(f"http://localhost:4173{path}")
            await page.wait_for_timeout(1000)
            await page.screenshot(path=f"/Users/arnab/.gemini/antigravity-ide/brain/119b2fb9-62db-4b17-b8e9-192a7bdfb75b/scratch/{name}.png")
            
            # Logout
            await page.click('div:has-text("Logout")')
            await page.wait_for_timeout(500)

        await snap("A001", "admin_dashboard", "/admin/dashboard")
        await snap("A001", "admin_students", "/admin/students")
        await snap("A001", "admin_timetable", "/admin/timetable")
        await snap("A001", "admin_violations", "/admin/violations")
        
        await snap("T101", "teacher_dashboard", "/teacher/dashboard")
        await snap("T101", "teacher_violations", "/teacher/violations")
        
        await snap("CS2025001", "student_dashboard", "/student/dashboard")
        await snap("CS2025001", "student_violations", "/student/violations")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_dashboards())
