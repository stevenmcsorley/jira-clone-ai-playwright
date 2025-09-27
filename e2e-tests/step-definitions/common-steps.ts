import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';

// ===== GENERIC ELEMENT VERIFICATION STEPS =====
Then('I should see {string}', async function (this: PlaywrightWorld, text: string) {
  await expect(this.page.locator(`text=${text}`)).toBeVisible();
});

Then('I should see {string} in the projects list', async function (this: PlaywrightWorld, projectName: string) {
  const projectSelectors = [
    `[data-testid="project-card"]:has-text("${projectName}")`,
    `.project-card:has-text("${projectName}")`,
    `.project:has-text("${projectName}")`,
    `*:has-text("${projectName}")`
  ];

  let found = false;
  for (const selector of projectSelectors) {
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
    await expect(this.page.locator(`text=${projectName}`).first()).toBeVisible();
  }
});

Then('I should see text containing {string}', async function (this: PlaywrightWorld, text: string) {
  await expect(this.page.locator(`*:has-text("${text}")`)).toBeVisible();
});

Then('I should not see {string}', async function (this: PlaywrightWorld, text: string) {
  await expect(this.page.locator(`text=${text}`)).not.toBeVisible();
});

Then('I should see a {string} element', async function (this: PlaywrightWorld, elementType: string) {
  await expect(this.page.locator(elementType)).toBeVisible();
});

Then('I should see an element with test-id {string}', async function (this: PlaywrightWorld, testId: string) {
  await expect(this.page.locator(`[data-testid="${testId}"]`)).toBeVisible();
});

// ===== GENERIC INTERACTION STEPS =====
When('I click on {string}', async function (this: PlaywrightWorld, text: string) {
  await this.page.locator(`text=${text}`).click();
});

When('I click the element with test-id {string}', async function (this: PlaywrightWorld, testId: string) {
  await this.page.locator(`[data-testid="${testId}"]`).click();
});

When('I fill {string} with {string}', async function (this: PlaywrightWorld, fieldName: string, value: string) {
  const selectors = [
    `[data-testid="${fieldName}"]`,
    `[name="${fieldName}"]`,
    `[placeholder*="${fieldName}" i]`,
    `label:has-text("${fieldName}") + input`,
    `label:has-text("${fieldName}") + textarea`
  ];

  for (const selector of selectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.fill(value);
        return;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
});

When('I select {string} from {string}', async function (this: PlaywrightWorld, value: string, fieldName: string) {
  const selectors = [
    `[data-testid="${fieldName}"]`,
    `[name="${fieldName}"]`,
    `select:near(label:has-text("${fieldName}"))`
  ];

  for (const selector of selectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.selectOption({ label: value });
        return;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
});

// ===== GENERIC NAVIGATION STEPS =====
Given('I am on the {string} page', async function (this: PlaywrightWorld, pageName: string) {
  const project = this.getTestProject();
  let url = this.config.baseUrl;

  switch (pageName.toLowerCase()) {
    case 'project board':
    case 'board':
      url = `${this.config.baseUrl}/projects/${project.id}`;
      break;
    case 'backlog':
      url = `${this.config.baseUrl}/projects/${project.id}/backlog`;
      break;
    case 'issues':
      url = `${this.config.baseUrl}/projects/${project.id}/issues`;
      break;
    case 'reports':
      url = `${this.config.baseUrl}/projects/${project.id}/reports`;
      break;
    case 'settings':
      url = `${this.config.baseUrl}/projects/${project.id}/settings`;
      break;
    case 'projects':
    case 'projects list':
      url = `${this.config.baseUrl}/projects`;
      break;
    default:
      url = `${this.config.baseUrl}/${pageName.toLowerCase().replace(/\s+/g, '-')}`;
  }

  await this.page.goto(url);
  await this.page.waitForLoadState('domcontentloaded');
  await this.page.waitForTimeout(1000);
});

When('I navigate to {string}', async function (this: PlaywrightWorld, destination: string) {
  // Reuse the navigation logic
  const project = this.getTestProject();
  let url = this.config.baseUrl;

  switch (destination.toLowerCase()) {
    case 'project board':
    case 'board':
      url = `${this.config.baseUrl}/projects/${project.id}`;
      break;
    case 'backlog':
      url = `${this.config.baseUrl}/projects/${project.id}/backlog`;
      break;
    case 'issues':
      url = `${this.config.baseUrl}/projects/${project.id}/issues`;
      break;
    case 'reports':
      url = `${this.config.baseUrl}/projects/${project.id}/reports`;
      break;
    case 'settings':
      url = `${this.config.baseUrl}/projects/${project.id}/settings`;
      break;
    case 'projects':
    case 'projects list':
      url = `${this.config.baseUrl}/projects`;
      break;
    default:
      url = `${this.config.baseUrl}/${destination.toLowerCase().replace(/\s+/g, '-')}`;
  }

  await this.page.goto(url);
  await this.page.waitForLoadState('domcontentloaded');
  await this.page.waitForTimeout(1000);
});

// ===== GENERIC WAITING STEPS =====
When('I wait for {int} seconds', async function (this: PlaywrightWorld, seconds: number) {
  await this.page.waitForTimeout(seconds * 1000);
});

When('I wait for the page to load', async function (this: PlaywrightWorld) {
  await this.page.waitForLoadState('networkidle');
});

// ===== GENERIC DATA TABLE STEPS =====
Then('I should see a table with the following data:', async function (this: PlaywrightWorld, dataTable) {
  const rows = dataTable.hashes();
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      await expect(this.page.locator(`text=${value}`)).toBeVisible();
    }
  }
});

// ===== GENERIC FORM STEPS =====
When('I submit the form', async function (this: PlaywrightWorld) {
  const submitSelectors = [
    '[type="submit"]',
    'button:has-text("Submit")',
    'button:has-text("Save")',
    'button:has-text("Create")',
    'button:has-text("Update")',
    '[data-testid="submit-button"]',
    '[data-testid="save-button"]'
  ];

  for (const selector of submitSelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        return;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
});

// ===== GENERIC CONTENT VERIFICATION =====
Then('the page should contain {string}', async function (this: PlaywrightWorld, content: string) {
  await expect(this.page.locator('body')).toContainText(content);
});

Then('the page title should be {string}', async function (this: PlaywrightWorld, title: string) {
  await expect(this.page).toHaveTitle(title);
});

Then('the url should contain {string}', async function (this: PlaywrightWorld, urlPart: string) {
  expect(this.page.url()).toContain(urlPart);
});

// ===== GENERIC ERROR HANDLING =====
Then('I should see an error message', async function (this: PlaywrightWorld) {
  const errorSelectors = [
    '[data-testid="error-message"]',
    '.error-message',
    '[class*="error"]',
    '.alert-danger',
    '[role="alert"]',
    '.error'
  ];

  let errorVisible = false;
  for (const selector of errorSelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        errorVisible = true;
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  if (!errorVisible) {
    throw new Error('No error message found on page');
  }
});

Then('I should see a success message', async function (this: PlaywrightWorld) {
  const successSelectors = [
    '[data-testid="success-message"]',
    '.success-message',
    '[class*="success"]',
    '.alert-success',
    '.notification-success',
    '.success'
  ];

  let successVisible = false;
  for (const selector of successSelectors) {
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        successVisible = true;
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  if (!successVisible) {
    throw new Error('No success message found on page');
  }
});

// ===== LIST/COLLECTION VERIFICATION =====
Then('I should see at least {int} items', async function (this: PlaywrightWorld, count: number) {
  const itemSelectors = [
    '[data-testid*="item"]',
    '[class*="item"]',
    'li',
    '.card',
    '[data-testid*="card"]',
    '[class*="list-item"]'
  ];

  let itemsFound = false;
  for (const selector of itemSelectors) {
    try {
      const elements = this.page.locator(selector);
      const actualCount = await elements.count();
      if (actualCount >= count) {
        expect(actualCount).toBeGreaterThanOrEqual(count);
        itemsFound = true;
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  if (!itemsFound) {
    throw new Error(`Could not find at least ${count} items on page`);
  }
});