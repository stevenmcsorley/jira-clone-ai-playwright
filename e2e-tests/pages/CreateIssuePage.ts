import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CreateIssuePage extends BasePage {
  private readonly selectors = {
    form: 'form[data-testid="create-issue-form"], form',
    titleInput: 'input[name="title"], input[placeholder*="title" i], [data-testid*="title"]',
    descriptionInput: 'textarea[name="description"], textarea[placeholder*="description" i], [data-testid*="description"]',
    typeSelect: 'select[name="type"], [data-testid*="issue-type"]',
    prioritySelect: 'select[name="priority"], [data-testid*="priority"]',
    assigneeSelect: 'select[name="assignee"], [data-testid*="assignee"]',
    storyPointsInput: 'input[name="storyPoints"], [data-testid*="story-points"]',
    submitButton: 'button[type="submit"], button:has-text("Create Issue"), [data-testid*="submit"]',
    cancelButton: 'button:has-text("Cancel"), [data-testid*="cancel"]',
    validationError: '.error, .text-red-500, [data-testid*="error"]',
  };

  async navigateToCreateIssue(projectId: number): Promise<void> {
    await this.goto(`/projects/${projectId}/issues/create`);
  }

  async waitForFormToLoad(): Promise<void> {
    await this.waitForSelector(this.selectors.form);
  }

  async fillIssueDetails(issue: {
    title: string;
    description?: string;
    type?: 'bug' | 'story' | 'task' | 'epic';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    storyPoints?: number;
    assigneeIndex?: number;
  }): Promise<void> {
    // Fill title (required)
    await this.fillField(this.selectors.titleInput, issue.title);

    // Fill description if provided
    if (issue.description) {
      await this.fillField(this.selectors.descriptionInput, issue.description);
    }

    // Select type if provided
    if (issue.type) {
      await this.selectOption(this.selectors.typeSelect, { label: this.capitalizeFirst(issue.type) });
    }

    // Select priority if provided
    if (issue.priority) {
      await this.selectOption(this.selectors.prioritySelect, { label: this.capitalizeFirst(issue.priority) });
    }

    // Fill story points if provided
    if (issue.storyPoints !== undefined) {
      await this.fillField(this.selectors.storyPointsInput, issue.storyPoints.toString());
    }

    // Select assignee if provided
    if (issue.assigneeIndex !== undefined) {
      await this.selectOption(this.selectors.assigneeSelect, { value: issue.assigneeIndex.toString() });
    }
  }

  async submitForm(): Promise<void> {
    await this.clickElement(this.selectors.submitButton);
    await this.waitForNavigation();
  }

  async submitFormAndExpectError(): Promise<void> {
    await this.clickElement(this.selectors.submitButton);
    // Don't wait for navigation as form should not submit
    await this.page.waitForTimeout(1000);
  }

  async verifyValidationError(): Promise<void> {
    await expect(this.page.locator(this.selectors.validationError)).toBeVisible();
  }

  async verifyFormNotSubmitted(): Promise<void> {
    // Verify we're still on the create issue form
    await expect(this.page.locator(this.selectors.form)).toBeVisible();
  }

  async cancelForm(): Promise<void> {
    await this.clickElement(this.selectors.cancelButton);
    await this.waitForNavigation();
  }

  async verifyFieldIsRequired(fieldSelector: string): Promise<void> {
    const field = this.page.locator(fieldSelector);
    await expect(field).toHaveAttribute('required', '');
  }

  async clearField(fieldSelector: string): Promise<void> {
    await this.page.fill(fieldSelector, '');
  }

  async verifyStoryPointsOptions(expectedOptions: string[]): Promise<void> {
    // Click on story points field to open dropdown (if it's a select)
    await this.clickElement(this.selectors.storyPointsInput);

    for (const option of expectedOptions) {
      const optionElement = this.page.locator(`option[value="${option}"], [data-value="${option}"]`);
      await expect(optionElement).toBeVisible();
    }
  }

  async selectStoryPoints(points: string): Promise<void> {
    if (await this.isSelectElement(this.selectors.storyPointsInput)) {
      await this.selectOption(this.selectors.storyPointsInput, { value: points });
    } else {
      await this.fillField(this.selectors.storyPointsInput, points);
    }
  }

  async verifyPrefilledProjectContext(projectName: string): Promise<void> {
    // Check if the form shows context about which project we're creating the issue for
    const pageContent = await this.page.textContent('body');
    expect(pageContent).toContain(projectName);
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private async isSelectElement(selector: string): Promise<boolean> {
    const element = await this.page.locator(selector).first();
    const tagName = await element.evaluate(el => el.tagName);
    return tagName.toLowerCase() === 'select';
  }

  // Helper methods for specific issue types
  async createBasicIssue(title: string, description?: string): Promise<void> {
    await this.fillIssueDetails({
      title,
      description,
      type: 'story',
      priority: 'medium',
    });
    await this.submitForm();
  }

  async createBugReport(title: string, description: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'high'): Promise<void> {
    await this.fillIssueDetails({
      title,
      description,
      type: 'bug',
      priority,
    });
    await this.submitForm();
  }

  async createStoryWithPoints(title: string, storyPoints: number, description?: string): Promise<void> {
    await this.fillIssueDetails({
      title,
      description,
      type: 'story',
      priority: 'medium',
      storyPoints,
    });
    await this.submitForm();
  }
}