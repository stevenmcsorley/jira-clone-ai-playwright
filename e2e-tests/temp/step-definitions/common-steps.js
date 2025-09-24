"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const test_1 = require("@playwright/test");
// Common navigation steps
(0, cucumber_1.Given)('I am on the Jira clone application', async function () {
    await this.page.goto('/');
});
(0, cucumber_1.Given)('I am on the homepage', async function () {
    await this.page.goto('/');
});
(0, cucumber_1.Given)('I am on the projects list page', async function () {
    await this.page.goto('/projects');
});
(0, cucumber_1.Given)('I am on the project board', async function () {
    await this.page.goto('/');
    await this.page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });
});
(0, cucumber_1.Given)('I navigate to a project board', async function () {
    await this.page.goto('/');
    await this.page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });
});
(0, cucumber_1.Given)('the kanban board is loaded', async function () {
    await this.page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });
});
// Waiting steps
(0, cucumber_1.When)('I wait for {int} seconds', async function (seconds) {
    await this.page.waitForTimeout(seconds * 1000);
});
// Page refresh steps
(0, cucumber_1.When)('I refresh the page', async function () {
    await this.page.reload();
    await this.page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });
    await this.page.waitForTimeout(2000);
});
// Validation steps
(0, cucumber_1.Then)('I should see the {string} page', async function (pageName) {
    switch (pageName.toLowerCase()) {
        case 'projects list':
            await (0, test_1.expect)(this.page.locator('text=Projects')).toBeVisible();
            break;
        default:
            throw new Error(`Unknown page: ${pageName}`);
    }
});
// Generic button and link steps
(0, cucumber_1.When)('I click the {string} button', async function (buttonText) {
    await this.page.click(`button:has-text("${buttonText}")`);
});
(0, cucumber_1.When)('I click on {string}', async function (text) {
    await this.page.click(`text=${text}`);
});
(0, cucumber_1.Then)('I should see {string}', async function (text) {
    await (0, test_1.expect)(this.page.locator(`text=${text}`)).toBeVisible();
});
(0, cucumber_1.Then)('I should not see {string}', async function (text) {
    await (0, test_1.expect)(this.page.locator(`text=${text}`)).not.toBeVisible();
});
// Form steps
(0, cucumber_1.When)('I enter {string} as the {string}', async function (value, fieldName) {
    const fieldMapping = {
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
(0, cucumber_1.When)('I select {string} as the {string}', async function (value, fieldName) {
    await this.page.selectOption('select', { label: value });
});
(0, cucumber_1.When)('I try to submit without entering a title', async function () {
    await this.page.click('button:has-text("Create Issue")');
});
(0, cucumber_1.When)('I try to submit without entering required fields', async function () {
    await this.page.click('button[type="submit"]');
});
// API Mock steps
(0, cucumber_1.Given)('the issue creation API is failing', async function () {
    await this.page.route('**/api/issues', route => {
        if (route.request().method() === 'POST') {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal Server Error' })
            });
        }
        else {
            route.continue();
        }
    });
});
// Device and responsive steps
(0, cucumber_1.Given)('I am using a mobile device', async function () {
    await this.page.setViewportSize({ width: 375, height: 667 });
});
// Enhanced navigation steps
(0, cucumber_1.Given)('I am logged in as a user', async function () {
    // For testing, assume user is already logged in or auth is not required
});
// Sprint and project management steps
(0, cucumber_1.When)('I click the {string} button to submit', async function (buttonText) {
    await this.page.click(`button:has-text("${buttonText}")[type="submit"]`);
});
(0, cucumber_1.When)('I set the sprint duration to {string}', async function (duration) {
    await this.page.selectOption('select[name="duration"]', { label: duration });
});
(0, cucumber_1.When)('I set the story points to {string}', async function (points) {
    await this.page.fill('input[name="storyPoints"], [data-testid="story-points"]', points);
});
(0, cucumber_1.When)('I assign the issue to a user', async function () {
    await this.page.selectOption('select[name="assignee"]', { index: 1 });
});
// Time tracking steps
(0, cucumber_1.When)('I enter {string} as the time spent', async function (timeValue) {
    await this.page.fill('input[name="timeSpent"], [data-testid="time-spent"]', timeValue);
});
(0, cucumber_1.When)('I enter {string} as the work description', async function (description) {
    await this.page.fill('textarea[name="workDescription"], [data-testid="work-description"]', description);
});
// Validation and error handling
(0, cucumber_1.Then)('the form should not submit', async function () {
    // Check that we're still on the form page (didn't navigate away)
    await (0, test_1.expect)(this.page.locator('form')).toBeVisible();
});
(0, cucumber_1.Then)('I should remain on the create issue form', async function () {
    await (0, test_1.expect)(this.page.locator('form')).toBeVisible();
    await (0, test_1.expect)(this.page.locator('input, textarea')).toBeVisible();
});
(0, cucumber_1.Then)('the form should show validation errors', async function () {
    await (0, test_1.expect)(this.page.locator('.error, .text-red-500, [data-testid*="error"]')).toBeVisible();
});
(0, cucumber_1.Then)('I should see an appropriate error message', async function () {
    await (0, test_1.expect)(this.page.locator('.error, .alert-error, [data-testid*="error-message"]')).toBeVisible();
});
// Generic element visibility checks
(0, cucumber_1.Then)('I should see the {string}', async function (elementText) {
    await (0, test_1.expect)(this.page.locator(`:text("${elementText}")`)).toBeVisible();
});
// Enhanced project steps
(0, cucumber_1.When)('I submit the project creation form', async function () {
    await this.page.click('button[type="submit"], button:has-text("Create Project")');
});
(0, cucumber_1.When)('I submit the form', async function () {
    await this.page.click('button[type="submit"]');
});
(0, cucumber_1.When)('I confirm the sprint start', async function () {
    await this.page.click('button:has-text("Start Sprint"), button:has-text("Confirm")');
});
(0, cucumber_1.When)('I confirm the deletion', async function () {
    await this.page.click('button:has-text("Delete"), button:has-text("Confirm")');
});
// Generic save actions
(0, cucumber_1.When)('I save the changes', async function () {
    await this.page.click('button:has-text("Save"), button[type="submit"]');
});
(0, cucumber_1.When)('I save the story points', async function () {
    await this.page.click('button:has-text("Save")');
});
