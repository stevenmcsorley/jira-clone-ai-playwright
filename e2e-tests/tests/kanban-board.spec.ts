import { test, expect } from '@playwright/test';

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the application to load
    await page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });
  });

  test('should display the kanban board with columns', async ({ page }) => {
    // Check that all three columns are visible
    await expect(page.locator('text=To Do')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=Done')).toBeVisible();
  });

  test('should display existing issues in correct columns', async ({ page }) => {
    // Wait for issues to load
    await page.waitForTimeout(2000);

    // Check for sample issues (these should exist from seed data)
    await expect(page.locator('text=Set up project structure')).toBeVisible();
    await expect(page.locator('text=Design authentication system')).toBeVisible();
  });

  test('should allow creating new issues', async ({ page }) => {
    // Click the Create Issue button
    await page.click('button:has-text("Create Issue")');

    // Wait for modal to appear
    await expect(page.locator('text=Create Issue')).toBeVisible();

    // Fill out the form
    await page.fill('input[placeholder*="title"]', 'Test Issue from Playwright');
    await page.fill('textarea[placeholder*="description"]', 'This is a test issue created by automated tests');

    // Select priority
    await page.selectOption('select', { label: 'High' });

    // Submit the form
    await page.click('button:has-text("Create Issue")');

    // Wait for modal to close and issue to appear
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Test Issue from Playwright')).toBeVisible();
  });

  test('should allow drag and drop between columns', async ({ page }) => {
    // Wait for issues to load
    await page.waitForTimeout(2000);

    // Find an issue in the todo column
    const todoColumn = page.locator('text=To Do').locator('..').locator('..');
    const firstIssue = todoColumn.locator('.bg-white').first();

    // Ensure the issue exists
    await expect(firstIssue).toBeVisible();

    // Get the issue text for verification
    const issueText = await firstIssue.locator('h3').textContent();

    // Find the in progress column drop zone
    const inProgressColumn = page.locator('text=In Progress').locator('..').locator('..');

    // Perform drag and drop
    await firstIssue.dragTo(inProgressColumn);

    // Wait for the update to complete
    await page.waitForTimeout(1000);

    // Verify the issue moved to in progress column
    const inProgressIssues = inProgressColumn.locator('.bg-white');
    await expect(inProgressIssues.locator(`text=${issueText}`)).toBeVisible();
  });

  test('should allow inline editing of issue titles', async ({ page }) => {
    // Wait for issues to load
    await page.waitForTimeout(2000);

    // Find the first issue
    const firstIssue = page.locator('.bg-white').first();
    const titleElement = firstIssue.locator('h3');

    // Click on the title to edit
    await titleElement.click();

    // Wait for edit mode
    await expect(firstIssue.locator('input[type="text"]')).toBeVisible();

    // Edit the title
    const newTitle = 'Edited Issue Title';
    await firstIssue.locator('input[type="text"]').fill(newTitle);

    // Press Enter to save
    await firstIssue.locator('input[type="text"]').press('Enter');

    // Verify the title was updated
    await expect(firstIssue.locator(`text=${newTitle}`)).toBeVisible();
  });

  test('should show project information', async ({ page }) => {
    // Check that project name is displayed
    await expect(page.locator('text=Jira Clone')).toBeVisible();

    // Check that project description is visible
    await expect(page.locator('text=A modern project management tool')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/issues**', route => {
      route.abort('failed');
    });

    // Reload the page
    await page.reload();

    // The application should handle the error gracefully
    // (This test might fail initially, demonstrating the bug reporting system)
    await expect(page.locator('text=Error loading')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display kanban board on mobile', async ({ page }) => {
    await page.goto('/');

    // Wait for the board to load
    await page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });

    // Check that columns are still visible on mobile
    await expect(page.locator('text=To Do')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=Done')).toBeVisible();
  });
});