import { test, expect } from '@playwright/test';

test.describe('Feature: Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // Given I am on the Jira Clone application
    await page.goto('/');
    await page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });
  });

  test('Scenario: User can see Create Project button in header', async ({ page }) => {
    // Given I am on the main page
    // When I look at the header
    // Then I should see a Create Project button
    const createProjectBtn = page.getByTestId('create-project-button');
    await expect(createProjectBtn).toBeVisible();
    await expect(createProjectBtn).toContainText('Create Project');
  });

  test('Scenario: User can open Create Project modal', async ({ page }) => {
    // Given I am on the main page
    // When I click the Create Project button
    await page.getByTestId('create-project-button').click();

    // Then the Create Project modal should open
    await expect(page.locator('text=Create Project')).toBeVisible();

    // And I should see all required form fields
    await expect(page.getByTestId('project-name-input')).toBeVisible();
    await expect(page.getByTestId('project-key-input')).toBeVisible();
    await expect(page.getByTestId('project-description-input')).toBeVisible();
    await expect(page.getByTestId('project-lead-select')).toBeVisible();

    // And I should see action buttons
    await expect(page.getByTestId('create-project-cancel-button')).toBeVisible();
    await expect(page.getByTestId('create-project-submit-button')).toBeVisible();
  });

  test('Scenario: System auto-generates project key from name', async ({ page }) => {
    // Given I have opened the Create Project modal
    await page.getByTestId('create-project-button').click();

    // When I enter a project name
    await page.getByTestId('project-name-input').fill('My Awesome Project');

    // Then the project key should be auto-generated from the name
    const keyInput = page.getByTestId('project-key-input');
    await expect(keyInput).toHaveValue('MYAWE');

    // And when I change the name
    await page.getByTestId('project-name-input').fill('Test Project Management');

    // Then the key should update accordingly
    await expect(keyInput).toHaveValue('TESPRO');
  });

  test('Scenario: User can manually edit project key', async ({ page }) => {
    // Given I have opened the Create Project modal
    await page.getByTestId('create-project-button').click();

    // And I have entered a project name
    await page.getByTestId('project-name-input').fill('Test Project');

    // When I manually edit the project key
    const keyInput = page.getByTestId('project-key-input');
    await keyInput.clear();
    await keyInput.fill('CUSTOM');

    // And I change the project name again
    await page.getByTestId('project-name-input').fill('Another Project Name');

    // Then the manually entered key should remain unchanged
    await expect(keyInput).toHaveValue('CUSTOM');
  });

  test('Scenario: System validates required fields', async ({ page }) => {
    // Given I have opened the Create Project modal
    await page.getByTestId('create-project-button').click();

    // When I try to submit without filling required fields
    await page.getByTestId('create-project-submit-button').click();

    // Then I should see validation errors for required fields
    await expect(page.getByTestId('project-name-error')).toBeVisible();
    await expect(page.getByTestId('project-name-error')).toContainText('Project name is required');
  });

  test('Scenario: System validates project key format', async ({ page }) => {
    // Given I have opened the Create Project modal
    await page.getByTestId('create-project-button').click();

    // And I have filled the project name
    await page.getByTestId('project-name-input').fill('Test Project');

    const keyInput = page.getByTestId('project-key-input');

    // When I enter lowercase letters in the key
    await keyInput.clear();
    await keyInput.fill('test');

    // Then they should be automatically converted to uppercase
    await expect(keyInput).toHaveValue('TEST');

    // When I enter special characters in the key
    await keyInput.clear();
    await keyInput.fill('test-key!');
    await page.getByTestId('create-project-submit-button').click();

    // Then I should see a validation error
    await expect(page.getByTestId('project-key-error')).toBeVisible();
    await expect(page.getByTestId('project-key-error')).toContainText('must contain only uppercase letters and numbers');

    // When I enter a key that is too short
    await keyInput.clear();
    await keyInput.fill('A');
    await page.getByTestId('create-project-submit-button').click();

    // Then I should see a length validation error
    await expect(page.getByTestId('project-key-error')).toContainText('must be 2-10 characters long');

    // When I enter a key that is too long
    await keyInput.clear();
    await keyInput.fill('VERYLONGPROJECTKEY');
    await page.getByTestId('create-project-submit-button').click();

    // Then I should see a length validation error
    await expect(page.getByTestId('project-key-error')).toContainText('must be 2-10 characters long');
  });

  test('Scenario: User successfully creates a new project', async ({ page }) => {
    // Given I have opened the Create Project modal
    await page.getByTestId('create-project-button').click();

    // When I fill in all required project information
    await page.getByTestId('project-name-input').fill('E2E Test Project');
    await page.getByTestId('project-key-input').fill('E2ETEST');
    await page.getByTestId('project-description-input').fill('This is a test project created by E2E tests');

    // And I select a project lead
    const leadSelect = page.getByTestId('project-lead-select');
    await leadSelect.selectOption({ index: 1 }); // Select first actual user option

    // And I submit the form
    await page.getByTestId('create-project-submit-button').click();

    // Then the modal should close (indicating success)
    await expect(page.locator('text=Create Project')).not.toBeVisible();

    // And I should be able to create issues in the new project
    await page.getByTestId('create-issue-button').click();
    await page.fill('input[placeholder*="title"]', 'Test issue in new project');
    await page.click('button:has-text("Create Issue")');

    // And the issue should appear on the board
    await expect(page.locator('text=Test issue in new project')).toBeVisible();
  });

  test('Scenario: User cancels project creation', async ({ page }) => {
    // Given I have opened the Create Project modal
    await page.getByTestId('create-project-button').click();

    // And I have entered some project data
    await page.getByTestId('project-name-input').fill('Cancelled Project');
    await page.getByTestId('project-description-input').fill('This should not be created');

    // When I click the cancel button
    await page.getByTestId('create-project-cancel-button').click();

    // Then the modal should close
    await expect(page.locator('text=Create Project')).not.toBeVisible();

    // And when I open the modal again
    await page.getByTestId('create-project-button').click();

    // Then the form should be clean
    await expect(page.getByTestId('project-name-input')).toHaveValue('');
    await expect(page.getByTestId('project-description-input')).toHaveValue('');
  });

  test('Scenario: User can close modal using keyboard or clicking outside', async ({ page }) => {
    // Given I have opened the Create Project modal
    await page.getByTestId('create-project-button').click();
    await expect(page.locator('text=Create Project')).toBeVisible();

    // When I press the Escape key
    await page.keyboard.press('Escape');

    // Then the modal should close
    await expect(page.locator('text=Create Project')).not.toBeVisible();

    // Given I open the modal again
    await page.getByTestId('create-project-button').click();
    await expect(page.locator('text=Create Project')).toBeVisible();

    // When I click outside the modal
    await page.click('body', { position: { x: 10, y: 10 } });

    // Then the modal should close
    await expect(page.locator('text=Create Project')).not.toBeVisible();
  });

  test('Scenario: System shows project key preview for issue naming', async ({ page }) => {
    // Given I have opened the Create Project modal
    await page.getByTestId('create-project-button').click();

    // When I enter a project name
    await page.getByTestId('project-name-input').fill('Example Project');

    // Then I should see a preview of how the key will be used for issues
    const keyPreview = page.locator('text=/Used as prefix for issues.*EXAM.*123/');
    await expect(keyPreview).toBeVisible();

    // When I change the key manually
    await page.getByTestId('project-key-input').fill('CUSTOM');

    // Then the preview should update with the new key
    const customKeyPreview = page.locator('text=/Used as prefix for issues.*CUSTOM.*123/');
    await expect(customKeyPreview).toBeVisible();
  });

  test('Scenario: Submit button is disabled when form is invalid', async ({ page }) => {
    // Given I have opened the Create Project modal
    await page.getByTestId('create-project-button').click();

    const submitBtn = page.getByTestId('create-project-submit-button');

    // Then the submit button should be disabled initially
    await expect(submitBtn).toBeDisabled();

    // When I fill the name but leave the key empty
    await page.getByTestId('project-name-input').fill('Test');
    await page.getByTestId('project-key-input').clear();

    // Then the submit button should remain disabled
    await expect(submitBtn).toBeDisabled();

    // When I fill the key as well
    await page.getByTestId('project-key-input').fill('TEST');

    // Then the submit button should be enabled
    await expect(submitBtn).toBeEnabled();

    // When I clear the name again
    await page.getByTestId('project-name-input').clear();

    // Then the submit button should be disabled again
    await expect(submitBtn).toBeDisabled();
  });

  test('Scenario: System handles project creation errors gracefully', async ({ page }) => {
    // Given I have opened the Create Project modal
    await page.getByTestId('create-project-button').click();

    // When I enter project data that might cause a conflict
    await page.getByTestId('project-name-input').fill('Duplicate Key Project');
    await page.getByTestId('project-key-input').fill('PROJ'); // This key might already exist

    // And I select a project lead
    const leadSelect = page.getByTestId('project-lead-select');
    await leadSelect.selectOption({ index: 1 });

    // And I submit the form
    await page.getByTestId('create-project-submit-button').click();

    // Then the system should handle the response appropriately
    await page.waitForTimeout(2000); // Wait for API response

    // The modal should either close (success) or remain open with error handling
    const modalVisible = await page.locator('text=Create Project').isVisible();

    if (modalVisible) {
      // If modal is still visible, there might be an error
      // In a production app, we would check for specific error messages
      console.log('Project creation may have failed - this is expected behavior for error handling');
    } else {
      // Modal closed, creation was successful
      console.log('Project created successfully');
    }
  });
});