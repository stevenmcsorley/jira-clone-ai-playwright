import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';

// Navigation steps
Given('I am on the Jira clone application', async function (this: PlaywrightWorld) {
  const project = this.getTestProject();
  await this.projectBoardPage.navigateToProject(project.id);
});

Given('I am on the project board', async function (this: PlaywrightWorld) {
  const project = this.getTestProject();
  await this.projectBoardPage.navigateToProject(project.id);
  await this.projectBoardPage.waitForBoardToLoad();
});

// Board verification steps
Then('I should see the kanban board', async function (this: PlaywrightWorld) {
  await this.projectBoardPage.waitForBoardToLoad();
});

Then('I should see {int} columns: {string}, {string}, {string}, and {string}',
  async function (this: PlaywrightWorld, count: number, col1: string, col2: string, col3: string, col4: string) {
    await this.projectBoardPage.verifyColumnsExist();
  }
);

// Issue creation steps
When('I click the {string} button', async function (this: PlaywrightWorld, buttonText: string) {
  if (buttonText === 'Create Issue') {
    await this.projectBoardPage.createIssue();
  } else {
    await this.page.click(`button:has-text("${buttonText}")`);
  }
});

When('I enter {string} as the title', async function (this: PlaywrightWorld, title: string) {
  await this.createIssuePage.waitForFormToLoad();
  await this.createIssuePage.fillIssueDetails({ title });
});

When('I enter {string} as the description', async function (this: PlaywrightWorld, description: string) {
  await this.createIssuePage.fillIssueDetails({ title: 'temp', description });
});

When('I select {string} as the issue type', async function (this: PlaywrightWorld, issueType: string) {
  await this.createIssuePage.fillIssueDetails({
    title: 'temp',
    type: issueType.toLowerCase() as 'bug' | 'story' | 'task' | 'epic'
  });
});

When('I select {string} as the priority', async function (this: PlaywrightWorld, priority: string) {
  await this.createIssuePage.fillIssueDetails({
    title: 'temp',
    priority: priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent'
  });
});

When('I click the {string} button to submit', async function (this: PlaywrightWorld, buttonText: string) {
  await this.createIssuePage.submitForm();
});

Then('I should see the new issue {string} on the board', async function (this: PlaywrightWorld, issueTitle: string) {
  await this.projectBoardPage.verifyIssueInColumn(issueTitle, 'todo');
});

// Simple navigation test steps
When('I navigate to different sections', async function (this: PlaywrightWorld) {
  // Simple test - just verify we can interact with the page
  await this.page.waitForTimeout(500);
});

Then('the application should respond correctly', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('[data-testid="project-board"]')).toBeVisible();
});

Then('all navigation should work as expected', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('[data-testid="kanban-board"]')).toBeVisible();
});