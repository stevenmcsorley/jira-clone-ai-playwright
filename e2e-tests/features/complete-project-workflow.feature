Feature: Complete Project Workflow
  As a project manager
  I want to create a new project and use all Jira functionality
  So that I can manage my team's work effectively from start to finish

  Background:
    Given I am on the Jira clone application

  @smoke @project-creation @bug-report
  Scenario: Create a new project and verify setup
    Given I am on the "projects" page
    When I click the "Create Project" button
    And I fill "name" with "BDD Test Project"
    And I fill "key" with "BTP"
    And I fill "description" with "A project created by BDD tests to verify all functionality"
    And I submit the form
    Then I should see a success message
    And I should see "BDD Test Project" in the projects list
    And the url should contain "projects"

  @issue-management @bug-report
  Scenario: Create and manage issues in the new project
    Given I have created a project "BDD Test Project" with key "BTP"
    And I am on the project board
    When I click the "Create Issue" button
    And I enter "First BDD Issue" as the title
    And I enter "This is our first issue created via BDD tests" as the description
    And I select "Story" as the issue type
    And I select "High" as the priority
    And I click the "Create" button to submit
    Then I should see the new issue "First BDD Issue" on the board
    And the issue should have "High" priority
    And the issue should be of type "Story"

  @issue-management @bug-report
  Scenario: Create multiple issues with different types and priorities
    Given I have created a project "BDD Test Project" with key "BTP"
    And I am on the project board
    When I create the following issues:
      | Title                    | Type | Priority | Description                           |
      | User Login Bug          | Bug  | Urgent   | Users cannot login to the system     |
      | Dashboard Feature       | Story| Medium   | Create a new dashboard for analytics  |
      | Database Cleanup        | Task | Low      | Clean up old database records        |
      | Performance Epic        | Epic | High     | Improve overall system performance   |
    Then I should see 4 issues on the board
    And I should see issue "User Login Bug" with type "Bug" and priority "Urgent"
    And I should see issue "Dashboard Feature" with type "Story" and priority "Medium"

  @kanban-board @bug-report
  Scenario: Move issues through kanban workflow
    Given I have created a project "BDD Test Project" with key "BTP"
    And I have created an issue "Test Issue for Workflow"
    And I am on the project board
    When I drag issue "Test Issue for Workflow" from "To Do" to "In Progress"
    Then the issue should appear in the "In Progress" column
    And the issue should no longer be in the "To Do" column
    When I drag issue "Test Issue for Workflow" from "In Progress" to "Code Review"
    Then the issue should appear in the "Code Review" column
    When I drag issue "Test Issue for Workflow" from "Code Review" to "Done"
    Then the issue should appear in the "Done" column
    And the issue status should be "Done"

  @issue-editing @bug-report
  Scenario: Edit issue details
    Given I have created a project "BDD Test Project" with key "BTP"
    And I have created an issue "Issue to Edit"
    And I am on the project board
    When I click on issue "Issue to Edit"
    And I click the "Edit" button
    And I change the title to "Updated Issue Title"
    And I change the description to "Updated description via BDD test"
    And I change the priority to "Urgent"
    And I save the changes
    Then I should see "Updated Issue Title" on the board
    And the issue should have "Urgent" priority

  @issue-assignment @bug-report
  Scenario: Assign issues to users
    Given I have created a project "BDD Test Project" with key "BTP"
    And I have created an issue "Issue to Assign"
    And I am on the project board
    When I click on issue "Issue to Assign"
    And I click the "Assign" button
    And I select a user from the assignee dropdown
    And I save the assignment
    Then the issue should show an assigned user
    And I should see the user's avatar on the issue card

  @backlog-management @bug-report
  Scenario: Manage project backlog
    Given I have created a project "BDD Test Project" with key "BTP"
    And I have created multiple issues
    When I navigate to the "backlog" page
    Then I should see all issues in the backlog
    When I reorder issues by dragging "Issue 1" above "Issue 2"
    Then "Issue 1" should appear before "Issue 2" in the backlog
    When I bulk select multiple issues
    And I set their priority to "High"
    Then all selected issues should have "High" priority

  @sprint-management @bug-report
  Scenario: Create and manage sprints
    Given I have created a project "BDD Test Project" with key "BTP"
    And I have created multiple issues in the backlog
    When I navigate to the "backlog" page
    And I click the "Create Sprint" button
    And I enter "Sprint 1 - BDD Test" as the sprint name
    And I set the sprint duration to "2 weeks"
    And I add issues to the sprint by dragging them
    And I click "Start Sprint"
    Then the sprint should be active
    And I should see the sprint board with selected issues
    And the sprint should show correct dates and duration

  @search-functionality @bug-report
  Scenario: Search and filter issues
    Given I have created a project "BDD Test Project" with key "BTP"
    And I have created issues with different priorities and types
    When I use the search box to search for "Bug"
    Then I should see only issues containing "Bug" in title or description
    When I filter by issue type "Story"
    Then I should see only Story type issues
    When I filter by priority "High"
    Then I should see only High priority issues
    When I clear all filters
    Then I should see all issues again

  @project-settings @bug-report
  Scenario: Configure project settings
    Given I have created a project "BDD Test Project" with key "BTP"
    When I navigate to project settings
    Then I should see project configuration options
    When I update the project description
    And I save the settings
    Then the updated description should be saved
    And I should see a confirmation message

  @reporting @bug-report
  Scenario: View project reports and analytics
    Given I have created a project "BDD Test Project" with key "BTP"
    And I have issues in different states
    When I navigate to the "reports" page
    Then I should see project statistics
    And I should see issue distribution charts
    And I should see progress metrics
    And I should see burn-down charts if sprints exist

  @project-cleanup @bug-report
  Scenario: Complete project workflow verification
    Given I have created a project "BDD Test Project" with key "BTP"
    And I have completed all project activities
    Then the project should have:
      | Component    | Count |
      | Issues       | 8+    |
      | Sprints      | 1+    |
      | Users        | 1+    |
    And all issues should be properly categorized
    And the project should be fully functional
    And all features should be working as expected