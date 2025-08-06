import asyncio
from playwright.async_api import async_playwright, expect
import random
import string

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Generate random user credentials
            random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
            email = f"testuser_{random_suffix}@example.com"
            password = "Password123!"

            # Go to signup page
            await page.goto("http://127.0.0.1:8080/signup")

            # Fill out signup form
            await page.get_by_label("Full Name").fill("Test User")
            await page.get_by_label("Email Address").fill(email)
            await page.get_by_label("Password").fill(password)
            await page.get_by_role("button", name="Create My Account").click()

            # Wait for navigation to the dashboard after signup
            await expect(page).to_have_url("http://127.0.0.1:8080/dashboard", timeout=10000)

            # It's possible there are no projects or tasks for a new user.
            # Let's create a project first.
            # The project creation is in a dialog. Let's look for a button to trigger it.
            # From reading ProjectsColumn.tsx, there should be a button to add a project.

            # Let's check if there's a "Create your first project" button.
            # If not, let's look for a more generic "Add Project" button.
            # Based on my reading, there is a "ProjectsColumn" component.
            # Let's find a button to add a project.
            # There is no obvious button, I will try to find a button with text "Add Project"

            await page.get_by_role("button", name="Add Project").click()

            # Now a dialog should be open.
            await page.get_by_label("Project Name").fill("Test Project")
            await page.get_by_label("Description").fill("Test Project Description")
            await page.get_by_role("button", name="Create Project").click()

            # Now that a project is created, let's add a task.
            # From reading TaskSidebar.tsx, there's a button with text "+ Add"
            await page.get_by_role("button", name="+ Add").click()

            # A dialog to add a task should appear.
            await page.get_by_label("Task Name").fill("My test task")
            await page.get_by_role("button", name="Add Task").click()

            # Now the task should be visible in the TaskSidebar.
            # Let's take a screenshot of the sidebar.
            # The sidebar has a class `TaskSidebar` but that's the component name, not a class.
            # The component has a droppable id of 'task-sidebar'.
            # I will try to find the element with that id.
            # The element with the droppable id is not the whole sidebar.
            # Let's take a screenshot of the whole page.

            # Let's wait for the task to appear.
            task_item = page.get_by_text("My test task")
            await expect(task_item).to_be_visible()

            await page.screenshot(path="jules-scratch/verification/verification.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
