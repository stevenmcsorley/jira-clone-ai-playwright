Feature: Simple Complete Jira Workflow
  As a user
  I want to test the complete Jira workflow
  So that everything works end-to-end

  @workflow @bug-report
  Scenario: Complete workflow test
    Given I am on the Jira clone application
    When I create a new project called "Test Project"
    And I create an Epic called "User Management"
    And I create a Story called "User Login"
    And I create a Task called "Setup Database"
    And I link the Story to the Epic
    And I create a sprint called "Sprint 1"
    And I add the Story to the sprint
    And I start the sprint
    And I move the Story from "To Do" to "In Progress"
    And I log 4 hours to the Story
    And I move the Story from "In Progress" to "Done"
    And I complete the sprint
    Then I should see the completed sprint in reports