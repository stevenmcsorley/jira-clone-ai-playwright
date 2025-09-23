Feature: Kanban Board Management
  As a project team member
  I want to use a kanban board to visualize and manage work
  So that I can track progress and move issues through workflow states

  Background:
    Given I am on the Jira clone application
    And I navigate to a project board

  Scenario: Display kanban board with proper columns
    Given I am on the project board
    Then I should see the kanban board
    And I should see 4 columns: "To Do", "In Progress", "Code Review", and "Done"
    And each column should have a clear header
    And each column should be able to contain issues

  Scenario: Drag and drop issue between columns
    Given I am on the project board
    And there is at least one issue in the "To Do" column
    When I drag an issue from "To Do" to "In Progress"
    Then the issue should appear in the "In Progress" column
    And the issue should no longer be in the "To Do" column
    And the issue status should be updated to "in_progress"

  Scenario: Create issue directly from kanban board
    Given I am on the project board
    When I click the "Create Issue" button
    And I fill in the issue details
    And I submit the form
    Then the new issue should appear in the "To Do" column
    And it should be visible on the kanban board

  Scenario: Responsive design on mobile devices
    Given I am on the project board
    And I am using a mobile device
    Then the kanban board should be responsive
    And columns should be scrollable horizontally
    And issues should remain readable and interactive

  Scenario: Load issues from API correctly
    Given I am on the project board
    When the page loads
    Then issues should be fetched from the API
    And issues should be displayed in their correct columns based on status
    And loading states should be handled gracefully

  Scenario: Handle empty columns gracefully
    Given I am on the project board
    And some columns may be empty
    Then empty columns should still be visible
    And empty columns should show placeholder text or be ready to accept dropped issues
    And the board layout should remain intact

  Scenario: Filter and search functionality
    Given I am on the project board
    And there are multiple issues on the board
    When I use the search functionality
    Then I should be able to find issues by title
    And the search should work across all columns
    And filtered results should be highlighted

  Scenario: Real-time updates (if implemented)
    Given I am on the project board
    And another user makes changes to an issue
    When the changes are made
    Then I should see the updates reflected on my board
    And the issue should move to the correct column if status changed