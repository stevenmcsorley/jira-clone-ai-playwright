Feature: Story Points Management
  As a development team member
  I want to estimate and manage story points for issues
  So that I can plan sprints effectively and track velocity

  Background:
    Given I am on the Jira clone application
    And I am on a project board

  Scenario: Add story points to an issue during creation
    Given I am on the project board
    When I click the "Create Issue" button
    And I enter "User Registration Feature" as the title
    And I enter "Implement user registration with email validation" as the description
    And I select "Story" as the issue type
    And I set the story points to "8"
    And I click the "Create Issue" button to submit
    Then I should see the new issue on the board
    And the issue should display "8" story points
    And the story points should be saved correctly

  Scenario: Edit story points for an existing issue
    Given I am on the project board
    And there is an existing issue without story points
    When I click on the issue to open its details
    And I click on the story points field
    And I enter "5" as the story points value
    And I save the story points
    Then the issue should display "5" story points
    And the story points should be persisted in the database

  Scenario: Use Fibonacci sequence for story points estimation
    Given I am on the project board
    When I click on an issue to add story points
    And I click on the story points dropdown
    Then I should see Fibonacci values: 1, 2, 3, 5, 8, 13, 21
    And I should be able to select any of these values
    And I should see an option for "?" for unknown complexity

  Scenario: Sprint capacity planning with story points
    Given I am on the project board
    And there is a sprint in planning phase
    When I add issues with story points to the sprint
    And the total story points reach "40"
    Then I should see the sprint capacity indicator
    And I should get a warning if I exceed the team's average velocity
    And I should see the total story points for the sprint

  Scenario: Story points in sprint burndown chart
    Given I am on the project board
    And there is an active sprint with issues that have story points
    When I navigate to the sprint burndown chart
    Then the vertical axis should show story points remaining
    And the horizontal axis should show days in the sprint
    And I should see the ideal burndown line
    And I should see the actual burndown based on completed story points

  Scenario: Velocity tracking with story points
    Given I am on the project board
    And there are completed sprints with story points data
    When I view the velocity report
    Then I should see story points completed per sprint
    And I should see the average velocity over the last 3 sprints
    And I should see velocity trends (increasing/decreasing/stable)
    And I should be able to use this data for future sprint planning

  Scenario: Story points filtering and sorting
    Given I am on the project board
    And there are multiple issues with different story point values
    When I use the issue filter options
    Then I should be able to filter issues by story points range
    And I should be able to sort issues by story points (ascending/descending)
    And I should see the total story points for filtered results

  Scenario: Bulk edit story points
    Given I am on the project board
    And there are multiple issues without story points
    When I select multiple issues
    And I choose "Bulk Edit" from the actions menu
    And I set story points to "3" for all selected issues
    And I confirm the bulk update
    Then all selected issues should display "3" story points
    And the changes should be saved for all issues

  Scenario: Story points validation and constraints
    Given I am on the project board
    When I try to enter invalid story points (negative numbers, decimals, or very large numbers)
    Then I should see validation errors
    And the invalid values should not be saved
    When I enter valid Fibonacci values
    Then the story points should be saved successfully

  Scenario: Story points impact on issue prioritization
    Given I am on the project board
    And there are issues with different story points and priorities
    When I view the backlog prioritization
    Then I should be able to see both priority and story points
    And I should be able to balance high-priority low-effort vs low-priority high-effort items
    And the story points should help in making informed prioritization decisions