Feature: Basic Jira Clone Functionality
  As a project team member
  I want to access the basic functionality of the Jira clone
  So that I can manage my work effectively

  Background:
    Given I am on the Jira clone application

  @smoke @bug-report
  Scenario: View the project board
    Given I am on the project board
    Then I should see the kanban board
    And I should see 4 columns: "To Do", "In Progress", "Code Review", and "Done"

  @smoke @bug-report
  Scenario: Create a basic issue
    Given I am on the project board
    When I click the "Create Issue" button
    And I enter "Test Issue from E2E" as the title
    And I enter "This is a test issue created by automated tests" as the description
    And I select "Story" as the issue type
    And I select "Medium" as the priority
    And I click the "Create Issue" button to submit
    Then I should see the new issue "Test Issue from E2E" on the board

  @smoke @bug-report
  Scenario: Navigate between project views
    Given I am on the project board
    When I navigate to different sections
    Then the application should respond correctly
    And all navigation should work as expected