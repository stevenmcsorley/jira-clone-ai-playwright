Feature: Sprint Management
  As a project manager
  I want to manage sprints effectively
  So that I can track team progress and deliver value incrementally

  Background:
    Given I am on the project board for project "4"

  @sprint @smoke
  Scenario: View active sprint with issues
    Given there is an active sprint "Sprint 1: Foundation Features"
    When I navigate to the sprint board
    Then I should see the sprint name "Sprint 1: Foundation Features"
    And I should see the sprint status as "active"
    And I should see sprint dates from "2025-01-24" to "2025-02-07"
    And I should see 5 issues in the sprint

  @sprint
  Scenario: View sprint backlog with all issues
    Given there is an active sprint "Sprint 1: Foundation Features"
    When I navigate to the sprint backlog view
    Then I should see all 5 sprint issues listed
    And I should see issue "User Registration Feature" with priority "high"
    And I should see issue "Fix CSS Layout Bug" with priority "urgent"
    And I should see issue "Dashboard Analytics" with priority "medium"

  @sprint @bug-report
  Scenario: Try to view sprint with wrong ID (should fail and create bug)
    Given there is an active sprint "Sprint 1: Foundation Features"
    When I navigate to the sprint board for sprint "999"
    Then I should see an error message about sprint not found
    And the error should be logged for bug reporting

  @sprint
  Scenario: Move issues within sprint columns
    Given there is an active sprint "Sprint 1: Foundation Features"
    And I am on the sprint board
    When I drag issue "User Registration Feature" from "To Do" to "In Progress"
    Then the issue should appear in the "In Progress" column
    And the issue status should be updated in the system

  @sprint
  Scenario: Complete sprint workflow
    Given there is an active sprint "Sprint 1: Foundation Features"
    And I am on the sprint board
    When I move issue "Fix CSS Layout Bug" to "Done"
    And I move issue "User Registration Feature" to "Code Review"
    Then I should see the sprint progress updated
    And the sprint burndown should reflect completed work

  @sprint
  Scenario: View individual sprint issues
    Given there is an active sprint "Sprint 1: Foundation Features"
    When I navigate to the sprint backlog view
    Then I should see issue "API Documentation" with type "task"
    And I should see issue "Performance Optimization" with type "story"
    And all issues should show their correct priorities and types