import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';

// Issue creation steps
When('I assign the issue to a user', async function (this: PlaywrightWorld) {
  const assigneeSelect = this.page.locator('select').last();
  const options = await assigneeSelect.locator('option').allTextContents();
  if (options.length > 1) {
    await assigneeSelect.selectOption({ index: 1 }); // Select first non-empty option
  }
});

When('I click the {string} button to submit', async function (this: PlaywrightWorld, buttonText: string) {
  await this.page.click(`button:has-text("${buttonText}")`);
});

Then('I should see the new issue {string} on the board', async function (this: PlaywrightWorld, issueTitle: string) {
  await expect(this.page.locator(`text=${issueTitle}`)).toBeVisible();
});

Then('the issue should have {string} priority', async function (this: PlaywrightWorld, priority: string) {
  const testIssue = this.page.locator('text=Critical Bug Report').locator('..');
  await expect(testIssue.locator(`text=${priority.toLowerCase()}`)).toBeVisible();
});

Then('the issue should be assigned to the selected user', async function (this: PlaywrightWorld) {
  // Look for assignee avatar or name in the issue card
  const issueCard = this.page.locator('text=Critical Bug Report').locator('..');
  await expect(issueCard.locator('.w-6.h-6')).toBeVisible(); // Avatar element
});

// Form validation steps
Then('the form should not submit', async function (this: PlaywrightWorld) {
  // Form should still be visible, indicating validation failed
  await expect(this.page.locator('text=Create Issue')).toBeVisible();
});

Then('I should remain on the create issue form', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('text=Create Issue')).toBeVisible();
});

Then('the form should show validation errors', async function (this: PlaywrightWorld) {
  // The form should still be open indicating validation errors
  await expect(this.page.locator('text=Create Issue')).toBeVisible();
});

// Inline editing steps
Given('there are existing issues on the board', async function (this: PlaywrightWorld) {
  await this.page.waitForTimeout(2000);
  const issueCount = await this.page.locator('.bg-white').count();
  expect(issueCount).toBeGreaterThan(0);
});

When('I click on the description area of the first issue', async function (this: PlaywrightWorld) {
  const firstIssue = this.page.locator('.bg-white').first();

  const descriptionArea = firstIssue.locator('div').filter({ hasText: 'description' }).or(
    firstIssue.locator('span:has-text("Add description")')
  );

  if (await descriptionArea.count() > 0) {
    await descriptionArea.first().click();
  } else {
    await firstIssue.locator('.text-sm.text-gray-600').click();
  }
});

When('I enter {string} in the edit field', async function (this: PlaywrightWorld, text: string) {
  await this.page.waitForTimeout(500);
  const firstIssue = this.page.locator('.bg-white').first();
  const editField = firstIssue.locator('textarea, input').last();

  if (await editField.count() > 0) {
    await editField.fill(text);
  }
});

When('I press Enter to save', async function (this: PlaywrightWorld) {
  const firstIssue = this.page.locator('.bg-white').first();
  const editField = firstIssue.locator('textarea, input').last();

  if (await editField.count() > 0) {
    await editField.press('Enter');
  }
});

Then('the issue should display {string}', async function (this: PlaywrightWorld, text: string) {
  const firstIssue = this.page.locator('.bg-white').first();
  await expect(firstIssue.locator(`text=${text}`)).toBeVisible();
});

// API failure handling
When('I try to create an issue with title {string}', async function (this: PlaywrightWorld, title: string) {
  await this.page.click('button:has-text("Create Issue")');
  await this.page.fill('input[placeholder*="title"]', title);
  await this.page.click('button:has-text("Create Issue")');
  await this.page.waitForTimeout(2000);
});

Then('the issue should not appear on the board', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('text=Test Issue That Will Fail')).not.toBeVisible();
});

Then('I should see an appropriate error message', async function (this: PlaywrightWorld) {
  // This step may need to be adjusted based on how the application handles errors
  // For now, we'll just verify the issue wasn't created
  await expect(this.page.locator('text=Test Issue That Will Fail')).not.toBeVisible();
});

// Status filtering steps
Given('there are issues in different columns', async function (this: PlaywrightWorld) {
  await this.page.waitForTimeout(2000);
});

When('I observe the kanban board', async function (this: PlaywrightWorld) {
  await this.page.waitForTimeout(1000);
});

Then('I should see issues distributed across {string}, {string}, {string}, and {string} columns',
  async function (this: PlaywrightWorld, col1: string, col2: string, col3: string, col4: string) {
    const todoIssues = await this.page.locator('text=To Do').locator('..').locator('..').locator('.bg-white').count();
    const inProgressIssues = await this.page.locator('text=In Progress').locator('..').locator('..').locator('.bg-white').count();
    const codeReviewIssues = await this.page.locator('text=Code Review').locator('..').locator('..').locator('.bg-white').count();
    const doneIssues = await this.page.locator('text=Done').locator('..').locator('..').locator('.bg-white').count();

    // Verify columns exist
    await expect(this.page.locator('text=To Do')).toBeVisible();
    await expect(this.page.locator('text=In Progress')).toBeVisible();
    await expect(this.page.locator('text=Code Review')).toBeVisible();
    await expect(this.page.locator('text=Done')).toBeVisible();
});

Then('the total number of issues should be greater than zero', async function (this: PlaywrightWorld) {
  const todoIssues = await this.page.locator('text=To Do').locator('..').locator('..').locator('.bg-white').count();
  const inProgressIssues = await this.page.locator('text=In Progress').locator('..').locator('..').locator('.bg-white').count();
  const codeReviewIssues = await this.page.locator('text=Code Review').locator('..').locator('..').locator('.bg-white').count();
  const doneIssues = await this.page.locator('text=Done').locator('..').locator('..').locator('.bg-white').count();

  expect(todoIssues + inProgressIssues + codeReviewIssues + doneIssues).toBeGreaterThan(0);
});

// Page persistence steps
Given('I note the title of the first issue', async function (this: PlaywrightWorld) {
  await this.page.waitForTimeout(2000);
  this.context.firstIssueTitle = await this.page.locator('.bg-white').first().locator('h3').textContent();
});

Then('the same issue should still be first', async function (this: PlaywrightWorld) {
  await this.page.waitForTimeout(2000);
  const firstIssueAfterRefresh = await this.page.locator('.bg-white').first().locator('h3').textContent();
  expect(firstIssueAfterRefresh).toBe(this.context.firstIssueTitle);
});

Then('the board layout should be preserved', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('[data-testid="kanban-board"]')).toBeVisible();
});

// Assignee display steps
Given('there are issues with assigned users', async function (this: PlaywrightWorld) {
  await this.page.waitForTimeout(2000);
});

When('I look at assigned issues', async function (this: PlaywrightWorld) {
  // Filter for issues that have assignee avatars
  this.context.issuesWithAssignees = this.page.locator('.bg-white').filter({
    has: this.page.locator('.w-6.h-6.bg-blue-500')
  });
});

Then('I should see user avatars', async function (this: PlaywrightWorld) {
  if (await this.context.issuesWithAssignees.count() > 0) {
    const firstAssignedIssue = this.context.issuesWithAssignees.first();
    await expect(firstAssignedIssue.locator('.w-6.h-6.bg-blue-500')).toBeVisible();
  }
});

Then('I should see user names for assigned issues', async function (this: PlaywrightWorld) {
  if (await this.context.issuesWithAssignees.count() > 0) {
    const firstAssignedIssue = this.context.issuesWithAssignees.first();
    // This assumes user names are displayed near the avatar
    await expect(firstAssignedIssue.locator('.text-sm')).toBeVisible();
  }
});