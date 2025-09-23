Feature: Issue Management
  As a project team member
  I want to create, view, and manage issues
  So that I can track work and collaborate effectively

  Background:
    Given I am on the Jira clone application
    And the kanban board is loaded

  Scenario: Create a new issue with all fields
    Given I am on the project board
    When I click the "Create Issue" button
    And I select "Bug" as the issue type
    And I enter "Critical Bug Report" as the title
    And I enter "This is a critical bug that needs immediate attention" as the description
    And I select "Urgent" as the priority
    And I assign the issue to a user
    And I click the "Create Issue" button to submit
    Then I should see the new issue "Critical Bug Report" on the board
    And the issue should have "Urgent" priority
    And the issue should be assigned to the selected user

  Scenario: Validate required fields when creating an issue
    Given I am on the project board
    When I click the "Create Issue" button
    And I try to submit without entering a title
    Then the form should not submit
    And I should remain on the create issue form
    When I enter "Valid Issue" as the title
    And I click the "Create Issue" button to submit
    Then I should see the new issue "Valid Issue" on the board

  Scenario: Edit issue description inline
    Given I am on the project board
    And there are existing issues on the board
    When I click on the description area of the first issue
    And I enter "Updated description via inline editing" in the edit field
    And I press Enter to save
    Then the issue should display "Updated description via inline editing"

  Scenario: Handle API failures gracefully
    Given the issue creation API is failing
    When I try to create an issue with title "Test Issue That Will Fail"
    Then the issue should not appear on the board
    And I should see an appropriate error message

  Scenario: Filter issues by status
    Given I am on the project board
    And there are issues in different columns
    When I observe the kanban board
    Then I should see issues distributed across "To Do", "In Progress", "Code Review", and "Done" columns
    And the total number of issues should be greater than zero

  Scenario: Maintain issue order after page refresh
    Given I am on the project board
    And I note the title of the first issue
    When I refresh the page
    Then the same issue should still be first
    And the board layout should be preserved

  Scenario: Display assignee information correctly
    Given I am on the project board
    And there are issues with assigned users
    When I look at assigned issues
    Then I should see user avatars
    And I should see user names for assigned issues