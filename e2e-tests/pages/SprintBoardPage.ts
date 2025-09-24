import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SprintBoardPage extends BasePage {
  private selectors = {
    sprintBoard: '[data-testid="sprint-board"]',
    sprintName: '[data-testid="sprint-name"]',
    sprintStatus: '[data-testid="sprint-status"]',
    sprintDates: '[data-testid="sprint-dates"]',
    sprintIssues: '[data-testid="sprint-issue"]',
    sprintBacklog: '[data-testid="sprint-backlog"]',
    backlogIssue: '[data-testid="backlog-issue"]',
    kanbanBoard: '[data-testid="kanban-board"]',
    columns: {
      todo: '[data-testid="column-to-do"], [data-testid="column-todo"]',
      inProgress: '[data-testid="column-in-progress"], [data-testid="column-inprogress"]',
      codeReview: '[data-testid="column-code-review"], [data-testid="column-codereview"]',
      done: '[data-testid="column-done"]'
    },
    issueCard: '[data-testid="issue-card"]',
    issuePriority: '[data-testid="issue-priority"]',
    issueType: '[data-testid="issue-type"]',
    sprintProgress: '[data-testid="sprint-progress"]',
    completedIssues: '[data-testid="completed-issues"]',
    burndownChart: '[data-testid="burndown-chart"]',
    errorMessage: '[data-testid="error-message"]'
  };

  constructor(page: Page) {
    super(page);
  }

  async navigateToSprint(projectId: number, sprintId: number): Promise<void> {
    await this.page.goto(`${this.baseUrl}/project/${projectId}/sprint/${sprintId}`);
  }

  async navigateToSprintBoard(projectId: number): Promise<void> {
    await this.page.goto(`${this.baseUrl}/project/${projectId}/sprint`);
    await this.waitForSprintBoardToLoad();
  }

  async navigateToSprintBacklog(projectId: number): Promise<void> {
    await this.page.goto(`${this.baseUrl}/project/${projectId}/backlog`);
    await this.waitForSprintBacklogToLoad();
  }

  async waitForSprintBoardToLoad(): Promise<void> {
    await this.page.waitForSelector(this.selectors.sprintBoard, { timeout: 10000 });
  }

  async waitForSprintBacklogToLoad(): Promise<void> {
    await this.page.waitForSelector(this.selectors.sprintBacklog, { timeout: 10000 });
  }

  async getSprintName(): Promise<string> {
    return await this.page.locator(this.selectors.sprintName).textContent() || '';
  }

  async getSprintStatus(): Promise<string> {
    return await this.page.locator(this.selectors.sprintStatus).textContent() || '';
  }

  async getSprintIssueCount(): Promise<number> {
    return await this.page.locator(this.selectors.sprintIssues).count();
  }

  async getBacklogIssueCount(): Promise<number> {
    return await this.page.locator(this.selectors.backlogIssue).count();
  }

  async verifySprintName(expectedName: string): Promise<void> {
    await expect(this.page.locator(this.selectors.sprintName)).toContainText(expectedName);
  }

  async verifySprintStatus(expectedStatus: string): Promise<void> {
    await expect(this.page.locator(this.selectors.sprintStatus)).toContainText(expectedStatus);
  }

  async verifySprintDates(startDate: string, endDate: string): Promise<void> {
    const formattedStartDate = new Date(startDate).toLocaleDateString();
    const formattedEndDate = new Date(endDate).toLocaleDateString();

    await expect(this.page.locator(this.selectors.sprintDates)).toContainText(formattedStartDate);
    await expect(this.page.locator(this.selectors.sprintDates)).toContainText(formattedEndDate);
  }

  async verifyIssueCount(expectedCount: number): Promise<void> {
    const actualCount = await this.getSprintIssueCount();
    expect(actualCount).toBe(expectedCount);
  }

  async verifyBacklogIssueCount(expectedCount: number): Promise<void> {
    const actualCount = await this.getBacklogIssueCount();
    expect(actualCount).toBe(expectedCount);
  }

  async verifyIssueWithPriority(issueTitle: string, priority: string): Promise<void> {
    const issueLocator = this.page.locator(`${this.selectors.backlogIssue}:has-text("${issueTitle}")`);
    await expect(issueLocator).toBeVisible();
    await expect(issueLocator.locator(this.selectors.issuePriority)).toContainText(priority);
  }

  async verifyIssueWithType(issueTitle: string, type: string): Promise<void> {
    const issueLocator = this.page.locator(`${this.selectors.backlogIssue}:has-text("${issueTitle}")`);
    await expect(issueLocator).toBeVisible();
    await expect(issueLocator.locator(this.selectors.issueType)).toContainText(type);
  }

  async dragIssueToColumn(issueTitle: string, targetColumn: 'todo' | 'inProgress' | 'codeReview' | 'done'): Promise<void> {
    const issueSelector = `${this.selectors.issueCard}:has-text("${issueTitle}")`;
    const targetColumnSelector = this.selectors.columns[targetColumn];

    await this.page.dragAndDrop(issueSelector, targetColumnSelector);
    await this.page.waitForTimeout(1000); // Allow for animation and state update
  }

  async verifyIssueInColumn(issueTitle: string, column: 'todo' | 'inProgress' | 'codeReview' | 'done'): Promise<void> {
    const columnSelector = this.selectors.columns[column];
    const issueInColumn = this.page.locator(`${columnSelector} [data-testid="issue-card"]:has-text("${issueTitle}")`);
    await expect(issueInColumn).toBeVisible();
  }

  async verifySprintProgress(): Promise<void> {
    await expect(this.page.locator(this.selectors.sprintProgress)).toBeVisible();
  }

  async verifyCompletedIssuesCount(expectedCount: number): Promise<void> {
    await expect(this.page.locator(this.selectors.completedIssues)).toContainText(expectedCount.toString());
  }

  async verifyBurndownChart(): Promise<void> {
    await expect(this.page.locator(this.selectors.burndownChart)).toBeVisible();
  }

  async verifyErrorMessage(expectedMessage: string): Promise<void> {
    await expect(this.page.locator(this.selectors.errorMessage)).toContainText(expectedMessage);
  }

  async getErrorMessage(): Promise<string> {
    return await this.page.locator(this.selectors.errorMessage).textContent() || '';
  }

  async verifyAllIssuesHavePriorityAndType(): Promise<void> {
    const issueCount = await this.getBacklogIssueCount();
    expect(issueCount).toBeGreaterThan(0);

    // Verify at least some issues show priority and type
    await expect(this.page.locator(this.selectors.issuePriority).first()).toBeVisible();
    await expect(this.page.locator(this.selectors.issueType).first()).toBeVisible();
  }
}