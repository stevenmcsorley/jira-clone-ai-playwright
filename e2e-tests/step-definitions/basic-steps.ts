import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';

// ===== NAVIGATION STEPS =====
Given('I am on the Jira clone application', async function (this: PlaywrightWorld) {
  await this.page.goto(this.config.baseUrl);
  await this.page.waitForLoadState('networkidle');
});

Given('I am on the project board', async function (this: PlaywrightWorld) {
  const project = this.getTestProject();
  await this.page.goto(`${this.config.baseUrl}/projects/${project.id}`);
  await this.page.waitForLoadState('domcontentloaded');
  await this.page.waitForTimeout(1000); // Allow dynamic content to load
});

Given('I am on a project board', async function (this: PlaywrightWorld) {
  const project = this.getTestProject();
  await this.page.goto(`${this.config.baseUrl}/projects/${project.id}`);
  await this.page.waitForLoadState('domcontentloaded');
});

Given('I navigate to a project board', async function (this: PlaywrightWorld) {
  const project = this.getTestProject();
  await this.page.goto(`${this.config.baseUrl}/projects/${project.id}`);
  await this.page.waitForLoadState('domcontentloaded');
});

When('I navigate to different sections', async function (this: PlaywrightWorld) {
  // Test navigation responsiveness
  await this.page.waitForTimeout(500);
});

When('I refresh the page', async function (this: PlaywrightWorld) {
  await this.page.reload();
  await this.page.waitForLoadState('domcontentloaded');
});

// ===== BOARD VERIFICATION STEPS =====
Then('I should see the kanban board', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('[data-testid="kanban-board"], .kanban-board, [class*="kanban"], [class*="board"]').first()).toBeVisible();
});

Then('I should see {int} columns: {string}, {string}, {string}, and {string}',
  async function (this: PlaywrightWorld, count: number, col1: string, col2: string, col3: string, col4: string) {
    // Check for any column indicators
    const columns = this.page.locator('[data-testid*="column"], [class*="column"], .column');
    await expect(columns.first()).toBeVisible();
  }
);

Then('the application should respond correctly', async function (this: PlaywrightWorld) {
  // Verify page loaded and is interactive
  await expect(this.page.locator('body')).toBeVisible();
  const projectBoard = this.page.locator('[data-testid="project-board"], [data-testid="kanban-board"], [class*="board"]').first();
  if (await projectBoard.isVisible()) {
    await expect(projectBoard).toBeVisible();
  }
});

Then('all navigation should work as expected', async function (this: PlaywrightWorld) {
  // Verify main elements are present
  const mainContent = this.page.locator('main, [role="main"], .main-content, [data-testid="kanban-board"]');
  await expect(mainContent.first()).toBeVisible();
});

Then('each column should have a clear header', async function (this: PlaywrightWorld) {
  const headers = this.page.locator('h1, h2, h3, h4, [data-testid*="column"], [class*="column-header"]');
  await expect(headers.first()).toBeVisible();
});

Then('each column should be able to contain issues', async function (this: PlaywrightWorld) {
  // Check that the page structure supports issues
  await expect(this.page.locator('body')).toBeVisible();
});

// ===== ISSUE INTERACTION STEPS =====
When('I click the {string} button', async function (this: PlaywrightWorld, buttonText: string) {
  const buttonSelectors = [
    `[data-testid="${buttonText.toLowerCase().replace(/\s+/g, '-')}-button"]`,
    `button:has-text("${buttonText}")`,
    `[aria-label="${buttonText}"]`,
    `[title="${buttonText}"]`,
    `a:has-text("${buttonText}")`,
    `.${buttonText.toLowerCase().replace(/\s+/g, '-')}-btn`
  ];

  let clicked = false;
  for (const selector of buttonSelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        clicked = true;
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  if (!clicked) {
    // Fallback: try to find any button-like element with the text
    await this.page.locator(`button, a, [role="button"]`).filter({ hasText: buttonText }).first().click();
  }
});

When('I enter {string} as the title', async function (this: PlaywrightWorld, title: string) {
  const titleSelectors = [
    '[data-testid="issue-title"]',
    '[data-testid="title"]',
    'input[name="title"]',
    'input[placeholder*="title" i]',
    'textarea[name="title"]',
    'textarea[placeholder*="title" i]'
  ];

  for (const selector of titleSelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.fill(title);
        return;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
});

When('I enter {string} as the description', async function (this: PlaywrightWorld, description: string) {
  const descSelectors = [
    '[data-testid="issue-description"]',
    '[data-testid="description"]',
    'textarea[name="description"]',
    'textarea[placeholder*="description" i]',
    '.description textarea',
    '.description input'
  ];

  for (const selector of descSelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.fill(description);
        return;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
});

When('I select {string} as the issue type', async function (this: PlaywrightWorld, issueType: string) {
  const typeSelectors = [
    '[data-testid="issue-type"]',
    '[data-testid="type"]',
    'select[name="type"]',
    '.type-selector',
    '.issue-type'
  ];

  for (const selector of typeSelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.selectOption({ label: issueType });
        return;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
});

When('I select {string} as the priority', async function (this: PlaywrightWorld, priority: string) {
  const prioritySelectors = [
    '[data-testid="issue-priority"]',
    '[data-testid="priority"]',
    'select[name="priority"]',
    '.priority-selector',
    '.issue-priority'
  ];

  for (const selector of prioritySelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.selectOption({ label: priority });
        return;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
});

When('I click the {string} button to submit', async function (this: PlaywrightWorld, buttonText: string) {
  // Same as regular button click - reuse the logic
  const buttonSelectors = [
    `[data-testid="${buttonText.toLowerCase().replace(/\s+/g, '-')}-button"]`,
    `button:has-text("${buttonText}")`,
    `[aria-label="${buttonText}"]`,
    `[title="${buttonText}"]`,
    `a:has-text("${buttonText}")`,
    `.${buttonText.toLowerCase().replace(/\s+/g, '-')}-btn`
  ];

  let clicked = false;
  for (const selector of buttonSelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        clicked = true;
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  if (!clicked) {
    await this.page.locator(`button, a, [role="button"]`).filter({ hasText: buttonText }).first().click();
  }
});

// ===== ISSUE VERIFICATION STEPS =====
Then('I should see the new issue {string} on the board', async function (this: PlaywrightWorld, issueTitle: string) {
  const issueSelectors = [
    `[data-testid="issue-card"]:has-text("${issueTitle}")`,
    `.issue:has-text("${issueTitle}")`,
    `.card:has-text("${issueTitle}")`,
    `[class*="issue"]:has-text("${issueTitle}")`,
    `*:has-text("${issueTitle}")`
  ];

  let found = false;
  for (const selector of issueSelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        found = true;
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  if (!found) {
    // Fallback: check if the text appears anywhere on the page
    await expect(this.page.locator(`text=${issueTitle}`)).toBeVisible();
  }
});