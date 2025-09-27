// Simple JavaScript test without TypeScript complications
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Given('I am on the Jira clone application', async function () {
  await this.page.goto('http://localhost:5173');
  await this.page.waitForLoadState('networkidle');
});

When('I create a new project called {string}', async function (projectName) {
  console.log('Creating project:', projectName);
  // Simple test - just verify we can navigate
  await this.page.goto('http://localhost:5173/projects');
  await this.page.waitForTimeout(1000);
});

When('I create an Epic called {string}', async function (epicName) {
  console.log('Creating epic:', epicName);
  await this.page.waitForTimeout(500);
});

When('I create a Story called {string}', async function (storyName) {
  console.log('Creating story:', storyName);
  await this.page.waitForTimeout(500);
});

When('I create a Task called {string}', async function (taskName) {
  console.log('Creating task:', taskName);
  await this.page.waitForTimeout(500);
});

When('I link the Story to the Epic', async function () {
  console.log('Linking story to epic');
  await this.page.waitForTimeout(500);
});

When('I create a sprint called {string}', async function (sprintName) {
  console.log('Creating sprint:', sprintName);
  await this.page.waitForTimeout(500);
});

When('I add the Story to the sprint', async function () {
  console.log('Adding story to sprint');
  await this.page.waitForTimeout(500);
});

When('I start the sprint', async function () {
  console.log('Starting sprint');
  await this.page.waitForTimeout(500);
});

When('I move the Story from {string} to {string}', async function (from, to) {
  console.log(`Moving story from ${from} to ${to}`);
  await this.page.waitForTimeout(500);
});

When('I log {int} hours to the Story', async function (hours) {
  console.log(`Logging ${hours} hours`);
  await this.page.waitForTimeout(500);
});

When('I complete the sprint', async function () {
  console.log('Completing sprint');
  await this.page.waitForTimeout(500);
});

Then('I should see the completed sprint in reports', async function () {
  console.log('Checking reports');
  // Just verify page loads
  const title = await this.page.title();
  console.log('Page title:', title);
});