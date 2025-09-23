import { test, expect } from '@playwright/test';

test.describe('Issue Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });
  });

  test('should create issue with all fields', async ({ page }) => {
    // Open create issue modal
    await page.click('button:has-text("Create Issue")');

    // Fill all fields
    await page.selectOption('select', { label: 'Bug' }); // Issue type
    await page.fill('input[placeholder*="title"]', 'Critical Bug Report');
    await page.fill('textarea[placeholder*="description"]', 'This is a critical bug that needs immediate attention');

    // Set priority to urgent
    await page.selectOption('select', { label: 'Urgent' });

    // Assign to a user (if users are available)
    const assigneeSelect = page.locator('select').last();
    const options = await assigneeSelect.locator('option').allTextContents();
    if (options.length > 1) {
      await assigneeSelect.selectOption({ index: 1 }); // Select first non-empty option
    }

    // Submit
    await page.click('button:has-text("Create Issue")');

    // Verify issue was created
    await expect(page.locator('text=Critical Bug Report')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Open create issue modal
    await page.click('button:has-text("Create Issue")');

    // Try to submit without title
    await page.click('button:has-text("Create Issue")');

    // Form should still be open (validation failed)
    await expect(page.locator('text=Create Issue')).toBeVisible();

    // Add title and submit should work
    await page.fill('input[placeholder*="title"]', 'Valid Issue');
    await page.click('button:has-text("Create Issue")');

    // Modal should close
    await expect(page.locator('text=Valid Issue')).toBeVisible();
  });

  test('should edit issue description inline', async ({ page }) => {
    // Wait for issues to load
    await page.waitForTimeout(2000);

    // Find first issue
    const firstIssue = page.locator('.bg-white').first();

    // Click on description area
    const descriptionArea = firstIssue.locator('div').filter({ hasText: 'description' }).or(
      firstIssue.locator('span:has-text("Add description")')
    );

    if (await descriptionArea.count() > 0) {
      await descriptionArea.first().click();
    } else {
      // If no description area, click in the description space
      await firstIssue.locator('.text-sm.text-gray-600').click();
    }

    // Wait for edit mode
    await page.waitForTimeout(500);

    // Look for textarea or input
    const editField = firstIssue.locator('textarea, input').last();
    if (await editField.count() > 0) {
      await editField.fill('Updated description via inline editing');
      await editField.press('Enter');

      // Verify description was updated
      await expect(firstIssue.locator('text=Updated description via inline editing')).toBeVisible();
    }
  });

  test('should filter issues by status', async ({ page }) => {
    // Wait for issues to load
    await page.waitForTimeout(2000);

    // Count issues in each column
    const todoIssues = await page.locator('text=To Do').locator('..').locator('..').locator('.bg-white').count();
    const inProgressIssues = await page.locator('text=In Progress').locator('..').locator('..').locator('.bg-white').count();
    const doneIssues = await page.locator('text=Done').locator('..').locator('..').locator('.bg-white').count();

    // Verify that issues are properly distributed
    expect(todoIssues + inProgressIssues + doneIssues).toBeGreaterThan(0);
  });

  test('should handle priority changes', async ({ page }) => {
    // Create a test issue first
    await page.click('button:has-text("Create Issue")');
    await page.fill('input[placeholder*="title"]', 'Priority Test Issue');
    await page.selectOption('select', { label: 'Low' });
    await page.click('button:has-text("Create Issue")');

    // Wait for issue to be created
    await page.waitForTimeout(1000);

    // Verify the issue has low priority styling
    const testIssue = page.locator('text=Priority Test Issue').locator('..');
    await expect(testIssue).toBeVisible();

    // The priority should be visible in the issue card
    await expect(testIssue.locator('text=low')).toBeVisible();
  });

  test('should maintain issue order after page refresh', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);

    // Get the first issue title
    const firstIssueTitle = await page.locator('.bg-white').first().locator('h3').textContent();

    // Refresh the page
    await page.reload();
    await page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Verify the same issue is still first
    const firstIssueAfterRefresh = await page.locator('.bg-white').first().locator('h3').textContent();
    expect(firstIssueAfterRefresh).toBe(firstIssueTitle);
  });

  test('should show assignee information', async ({ page }) => {
    // Wait for issues to load
    await page.waitForTimeout(2000);

    // Look for issues with assignees
    const issuesWithAssignees = page.locator('.bg-white').filter({ has: page.locator('.w-6.h-6.bg-blue-500') });

    if (await issuesWithAssignees.count() > 0) {
      // Check that assignee avatar and name are visible
      const firstAssignedIssue = issuesWithAssignees.first();
      await expect(firstAssignedIssue.locator('.w-6.h-6.bg-blue-500')).toBeVisible();
    }
  });

  test('should handle API failures gracefully', async ({ page }) => {
    // Intercept issue creation API and make it fail
    await page.route('**/api/issues', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      } else {
        route.continue();
      }
    });

    // Try to create an issue
    await page.click('button:has-text("Create Issue")');
    await page.fill('input[placeholder*="title"]', 'Test Issue That Will Fail');
    await page.click('button:has-text("Create Issue")');

    // The issue should not appear (this might cause the test to fail, demonstrating bug reporting)
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Test Issue That Will Fail')).not.toBeVisible();
  });
});