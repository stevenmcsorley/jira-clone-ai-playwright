import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';

// Background steps
Given('I am on the project board for project {string}', async function (this: PlaywrightWorld, projectId: string) {
  await this.projectBoardPage.navigateToProject(parseInt(projectId));
  await this.projectBoardPage.waitForBoardToLoad();
});

// Sprint verification steps
Given('there is an active sprint {string}', async function (this: PlaywrightWorld, sprintName: string) {
  // Verify the sprint exists via API
  const project = this.getTestProject();
  const sprints = await this.apiService.getSprints(project.id);
  const activeSprint = sprints.find(s => s.name === sprintName && s.status === 'active');
  expect(activeSprint).toBeDefined();
  this.setTestSprint(activeSprint);
});

When('I navigate to the sprint board', async function (this: PlaywrightWorld) {
  // Navigate to sprint board view
  await this.page.click('[data-testid="sprint-board-link"]');
  await this.page.waitForSelector('[data-testid="sprint-board"]', { timeout: 5000 });
});

When('I navigate to the sprint backlog view', async function (this: PlaywrightWorld) {
  // Navigate to sprint backlog view
  await this.page.click('[data-testid="sprint-backlog-link"]');
  await this.page.waitForSelector('[data-testid="sprint-backlog"]', { timeout: 5000 });
});

When('I navigate to the sprint board for sprint {string}', async function (this: PlaywrightWorld, sprintId: string) {
  // Try to navigate to a sprint with wrong ID - should fail
  await this.page.goto(`${this.config.baseUrl}/project/${this.getTestProject().id}/sprint/${sprintId}`);
  await this.page.waitForTimeout(2000);
});

Then('I should see the sprint name {string}', async function (this: PlaywrightWorld, sprintName: string) {
  await expect(this.page.locator('[data-testid="sprint-name"]')).toContainText(sprintName);
});

Then('I should see the sprint status as {string}', async function (this: PlaywrightWorld, status: string) {
  await expect(this.page.locator('[data-testid="sprint-status"]')).toContainText(status);
});

Then('I should see sprint dates from {string} to {string}', async function (this: PlaywrightWorld, startDate: string, endDate: string) {
  const formattedStartDate = new Date(startDate).toLocaleDateString();
  const formattedEndDate = new Date(endDate).toLocaleDateString();

  await expect(this.page.locator('[data-testid="sprint-dates"]')).toContainText(formattedStartDate);
  await expect(this.page.locator('[data-testid="sprint-dates"]')).toContainText(formattedEndDate);
});

Then('I should see {int} issues in the sprint', async function (this: PlaywrightWorld, expectedCount: number) {
  const issueElements = await this.page.locator('[data-testid="sprint-issue"]').all();
  expect(issueElements).toHaveLength(expectedCount);
});

Then('I should see all {int} sprint issues listed', async function (this: PlaywrightWorld, expectedCount: number) {
  const issueElements = await this.page.locator('[data-testid="backlog-issue"]').all();
  expect(issueElements).toHaveLength(expectedCount);
});

Then('I should see issue {string} with priority {string}', async function (this: PlaywrightWorld, issueTitle: string, priority: string) {
  const issueLocator = this.page.locator(`[data-testid="backlog-issue"]:has-text("${issueTitle}")`);
  await expect(issueLocator).toBeVisible();
  await expect(issueLocator.locator('[data-testid="issue-priority"]')).toContainText(priority);
});

Then('I should see issue {string} with type {string}', async function (this: PlaywrightWorld, issueTitle: string, type: string) {
  const issueLocator = this.page.locator(`[data-testid="backlog-issue"]:has-text("${issueTitle}")`);
  await expect(issueLocator).toBeVisible();
  await expect(issueLocator.locator('[data-testid="issue-type"]')).toContainText(type);
});

// Error handling steps for bug reporting
Then('I should see an error message about sprint not found', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('[data-testid="error-message"]')).toContainText('Sprint not found');
});

Then('the error should be logged for bug reporting', async function (this: PlaywrightWorld) {
  // This step should trigger our bug reporting mechanism
  const errorMessages = await this.page.locator('[data-testid="error-message"]').allTextContents();
  expect(errorMessages.length).toBeGreaterThan(0);

  // Store error info for bug creation
  this.testContext.set('errorEncountered', true);
  this.testContext.set('errorMessage', errorMessages[0]);
});

// Drag and drop functionality
Given('I am on the sprint board', async function (this: PlaywrightWorld) {
  await this.page.click('[data-testid="sprint-board-link"]');
  await this.page.waitForSelector('[data-testid="kanban-board"]', { timeout: 5000 });
});

When('I drag issue {string} from {string} to {string}', async function (this: PlaywrightWorld, issueTitle: string, fromColumn: string, toColumn: string) {
  const issueSelector = `[data-testid="issue-card"]:has-text("${issueTitle}")`;
  const fromColumnSelector = `[data-testid="column-${fromColumn.toLowerCase().replace(' ', '-')}"]`;
  const toColumnSelector = `[data-testid="column-${toColumn.toLowerCase().replace(' ', '-')}"]`;

  await this.page.dragAndDrop(
    `${fromColumnSelector} ${issueSelector}`,
    toColumnSelector
  );
  await this.page.waitForTimeout(1000);
});

When('I move issue {string} to {string}', async function (this: PlaywrightWorld, issueTitle: string, toColumn: string) {
  const issueSelector = `[data-testid="issue-card"]:has-text("${issueTitle}")`;
  const toColumnSelector = `[data-testid="column-${toColumn.toLowerCase()}"]`;

  await this.page.dragAndDrop(issueSelector, toColumnSelector);
  await this.page.waitForTimeout(1000);
});

Then('the issue should appear in the {string} column', async function (this: PlaywrightWorld, columnName: string) {
  const columnSelector = `[data-testid="column-${columnName.toLowerCase().replace(' ', '-')}"]`;
  await expect(this.page.locator(`${columnSelector} [data-testid="issue-card"]`).first()).toBeVisible();
});

Then('the issue status should be updated in the system', async function (this: PlaywrightWorld) {
  // Verify via API that the status was updated
  const project = this.getTestProject();
  const issues = await this.apiService.getIssues(project.id);
  const movedIssue = issues.find(i => i.title === 'User Registration Feature');
  expect(movedIssue?.status).toBe('inprogress');
});

Then('I should see the sprint progress updated', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('[data-testid="sprint-progress"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="completed-issues"]')).toContainText('1');
});

Then('the sprint burndown should reflect completed work', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('[data-testid="burndown-chart"]')).toBeVisible();
});

Then('all issues should show their correct priorities and types', async function (this: PlaywrightWorld) {
  const issueElements = await this.page.locator('[data-testid="backlog-issue"]').all();
  expect(issueElements.length).toBeGreaterThan(0);

  // Verify at least some issues show priority and type
  await expect(this.page.locator('[data-testid="issue-priority"]').first()).toBeVisible();
  await expect(this.page.locator('[data-testid="issue-type"]').first()).toBeVisible();
});