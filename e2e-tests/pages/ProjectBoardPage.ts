import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { testConfig } from '../config/test.config';

export class ProjectBoardPage extends BasePage {
  // Selectors
  private readonly selectors = {
    projectBoard: '[data-testid="project-board"]',
    boardHeader: '[data-testid="board-header"]',
    projectTitle: '[data-testid="project-title"]',
    createIssueButton: '[data-testid="create-issue-button"]',
    kanbanBoard: '[data-testid="kanban-board"]',
    columns: {
      todo: '[data-testid="column-todo"]',
      inProgress: '[data-testid="column-in-progress"]',
      codeReview: '[data-testid="column-code-review"]',
      done: '[data-testid="column-done"]',
    },
    sprintInfo: '[data-testid="active-sprint-info"]',
    sprintDetails: '[data-testid="sprint-details"]',
    startSprintButton: '[data-testid="start-sprint-button"]',
    completeSprintButton: '[data-testid="complete-sprint-button"]',
    searchInput: '[data-testid="search-input"]',
    searchButton: '[data-testid="search-button"]',
    issueCard: (issueId: number) => `[data-testid="issue-card-${issueId}"]`,
    issueTitle: (issueId: number) => `[data-testid="issue-title-${issueId}"]`,
  };

  async navigateToProject(projectId: number): Promise<void> {
    await this.goto(`/projects/${projectId}`);
  }

  async waitForBoardToLoad(): Promise<void> {
    await this.waitForSelector(this.selectors.projectBoard);
    await this.waitForSelector(this.selectors.kanbanBoard);
  }

  async verifyProjectTitle(expectedTitle: string): Promise<void> {
    const actualTitle = await this.getText(this.selectors.projectTitle);
    expect(actualTitle).toContain(expectedTitle);
  }

  async createIssue(): Promise<void> {
    await this.clickElement(this.selectors.createIssueButton);
  }

  async verifyColumnsExist(): Promise<void> {
    await expect(this.page.locator(this.selectors.columns.todo)).toBeVisible();
    await expect(this.page.locator(this.selectors.columns.inProgress)).toBeVisible();
    await expect(this.page.locator(this.selectors.columns.codeReview)).toBeVisible();
    await expect(this.page.locator(this.selectors.columns.done)).toBeVisible();
  }

  async getColumnIssueCount(column: 'todo' | 'inProgress' | 'codeReview' | 'done'): Promise<number> {
    const columnSelector = this.selectors.columns[column];
    const issueCards = await this.page.locator(`${columnSelector} [data-testid*="issue-card-"]`);
    return await issueCards.count();
  }

  async verifyIssueInColumn(
    issueTitle: string,
    column: 'todo' | 'inProgress' | 'codeReview' | 'done'
  ): Promise<void> {
    const columnSelector = this.selectors.columns[column];
    const issueInColumn = this.page.locator(`${columnSelector} :text("${issueTitle}")`);
    await expect(issueInColumn).toBeVisible();
  }

  async dragIssueToColumn(
    issueTitle: string,
    targetColumn: 'todo' | 'inProgress' | 'codeReview' | 'done'
  ): Promise<void> {
    const issueSelector = `:text("${issueTitle}")`;
    const targetColumnSelector = this.selectors.columns[targetColumn];

    await this.dragAndDrop(issueSelector, targetColumnSelector);

    // Wait for the drag and drop to complete
    await this.page.waitForTimeout(1000);
  }

  async searchForIssue(searchTerm: string): Promise<void> {
    await this.fillField(this.selectors.searchInput, searchTerm);
    await this.clickElement(this.selectors.searchButton);
    await this.waitForNavigation();
  }

  async verifySearchResults(expectedResults: string[]): Promise<void> {
    for (const result of expectedResults) {
      await expect(this.page.locator(`:text("${result}")`)).toBeVisible();
    }
  }

  async clickIssue(issueTitle: string): Promise<void> {
    await this.clickElement(`:text("${issueTitle}")`);
  }

  async verifyActiveSprint(sprintName: string): Promise<void> {
    await expect(this.page.locator(this.selectors.sprintInfo)).toBeVisible();
    const sprintDetails = await this.getText(this.selectors.sprintDetails);
    expect(sprintDetails).toContain(sprintName);
  }

  async startSprint(): Promise<void> {
    await this.clickElement(this.selectors.startSprintButton);
  }

  async completeSprint(): Promise<void> {
    await this.clickElement(this.selectors.completeSprintButton);
  }

  async verifyNoActiveSprint(): Promise<void> {
    const sprintInfoVisible = await this.isVisible(this.selectors.sprintInfo);
    expect(sprintInfoVisible).toBe(false);
  }

  async verifyIssueCount(expectedCount: number): Promise<void> {
    const allIssues = await this.page.locator('[data-testid*="issue-card-"]');
    const actualCount = await allIssues.count();
    expect(actualCount).toBe(expectedCount);
  }

  async getIssuesByStatus(): Promise<{
    todo: number;
    inProgress: number;
    codeReview: number;
    done: number;
  }> {
    return {
      todo: await this.getColumnIssueCount('todo'),
      inProgress: await this.getColumnIssueCount('inProgress'),
      codeReview: await this.getColumnIssueCount('codeReview'),
      done: await this.getColumnIssueCount('done'),
    };
  }

  async verifyResponsiveDesign(): Promise<void> {
    // Set mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });

    // Verify board is still visible and functional
    await expect(this.page.locator(this.selectors.kanbanBoard)).toBeVisible();

    // Reset to desktop viewport
    await this.page.setViewportSize({
      width: testConfig.execution.viewport.width,
      height: testConfig.execution.viewport.height,
    });
  }
}