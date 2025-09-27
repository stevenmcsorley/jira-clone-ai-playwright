Feature: Simple Sprint Creation Test
  As a project manager
  I want to create a sprint on the existing project
  So that I can organize work into iterations

  @sprint-test @bug-report
  Scenario: Create a sprint on existing project
    Given I am on the Jira clone application
    And I am on the project board
    When I create a new sprint named "My Test Sprint"
    Then the sprint should be created successfully

  @sprint-test @bug-report
  Scenario: Create and start a sprint
    Given I am on the Jira clone application
    And I am on the project board
    When I create a new sprint named "Active Sprint Test"
    And I start the sprint
    Then the sprint should be active