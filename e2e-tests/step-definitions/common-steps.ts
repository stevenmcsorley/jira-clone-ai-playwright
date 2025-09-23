import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';

// Common navigation steps
Given('I am on the Jira clone application', async function (this: PlaywrightWorld) {
  await this.page.goto('/');
});

Given('I am on the homepage', async function (this: PlaywrightWorld) {
  await this.page.goto('/');
});

Given('I am on the projects list page', async function (this: PlaywrightWorld) {
  await this.page.goto('/projects');
});

Given('I am on the project board', async function (this: PlaywrightWorld) {
  await this.page.goto('/');
  await this.page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });
});

Given('I navigate to a project board', async function (this: PlaywrightWorld) {
  await this.page.goto('/');
  await this.page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });
});

Given('the kanban board is loaded', async function (this: PlaywrightWorld) {
  await this.page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });
});

// Waiting steps
When('I wait for {int} seconds', async function (this: PlaywrightWorld, seconds: number) {
  await this.page.waitForTimeout(seconds * 1000);
});

// Page refresh steps
When('I refresh the page', async function (this: PlaywrightWorld) {
  await this.page.reload();
  await this.page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });
  await this.page.waitForTimeout(2000);
});

// Validation steps
Then('I should see the {string} page', async function (this: PlaywrightWorld, pageName: string) {
  switch (pageName.toLowerCase()) {
    case 'projects list':
      await expect(this.page.locator('text=Projects')).toBeVisible();
      break;
    default:
      throw new Error(`Unknown page: ${pageName}`);
  }
});

// Generic button and link steps
When('I click the {string} button', async function (this: PlaywrightWorld, buttonText: string) {
  await this.page.click(`button:has-text("${buttonText}")`);
});

When('I click on {string}', async function (this: PlaywrightWorld, text: string) {
  await this.page.click(`text=${text}`);
});

Then('I should see {string}', async function (this: PlaywrightWorld, text: string) {
  await expect(this.page.locator(`text=${text}`)).toBeVisible();
});

Then('I should not see {string}', async function (this: PlaywrightWorld, text: string) {
  await expect(this.page.locator(`text=${text}`)).not.toBeVisible();
});

// Form steps
When('I enter {string} as the {string}', async function (this: PlaywrightWorld, value: string, fieldName: string) {
  const fieldMapping: Record<string, string> = {
    'title': 'input[placeholder*="title"]',
    'description': 'textarea[placeholder*="description"]',
    'project name': 'input[placeholder*="name"]',
    'project key': 'input[placeholder*="key"]'
  };

  const selector = fieldMapping[fieldName.toLowerCase()];
  if (!selector) {
    throw new Error(`Unknown field: ${fieldName}`);
  }

  await this.page.fill(selector, value);
});

When('I select {string} as the {string}', async function (this: PlaywrightWorld, value: string, fieldName: string) {
  await this.page.selectOption('select', { label: value });
});

When('I try to submit without entering a title', async function (this: PlaywrightWorld) {
  await this.page.click('button:has-text("Create Issue")');
});

When('I try to submit without entering required fields', async function (this: PlaywrightWorld) {
  await this.page.click('button[type="submit"]');
});

// API Mock steps
Given('the issue creation API is failing', async function (this: PlaywrightWorld) {
  await this.page.route('**/api/issues', route => {
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
});

// Device and responsive steps
Given('I am using a mobile device', async function (this: PlaywrightWorld) {
  await this.page.setViewportSize({ width: 375, height: 667 });
});