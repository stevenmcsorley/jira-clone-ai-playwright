Feature: Project Management
  As a project administrator
  I want to create and manage projects
  So that I can organize work and set up team workspaces

  Background:
    Given I am on the Jira clone application

  Scenario: View projects list
    Given I am on the homepage
    Then I should see the projects list page
    And I should see a "Create Project" button
    And existing projects should be displayed in a list format
    And each project should show key information like name, key, and last updated date

  Scenario: Create a new project successfully
    Given I am on the projects list page
    When I click the "Create Project" button
    And I enter "Test Project" as the project name
    And I enter "TP" as the project key
    And I enter "A test project for automation" as the description
    And I submit the project creation form
    Then I should see the new project "Test Project" in the projects list
    And the project should have the key "TP"
    And I should be able to navigate to the project board

  Scenario: Validate project creation form
    Given I am on the projects list page
    When I click the "Create Project" button
    And I try to submit without entering required fields
    Then the form should show validation errors
    And the project should not be created
    When I enter all required fields correctly
    And I submit the form
    Then the project should be created successfully

  Scenario: Navigate to project board
    Given I am on the projects list page
    And there is at least one existing project
    When I click on a project
    Then I should navigate to that project's kanban board
    And I should see the project name in the navigation
    And the kanban board should load with the project's issues

  Scenario: Project details and metadata
    Given I am on a project board
    Then I should see the project name in the header
    And I should see the project key
    And navigation should clearly indicate which project I'm viewing
    And I should be able to navigate back to the projects list

  Scenario: Project settings and configuration
    Given I am on a project board
    When I access project settings
    Then I should be able to view project configuration
    And I should be able to modify project details (if permissions allow)
    And changes should be saved and reflected in the project

  Scenario: Search and filter projects
    Given I am on the projects list page
    And there are multiple projects
    When I search for a specific project
    Then I should see filtered results
    And the search should work by project name and key
    And I should be able to clear the search to see all projects

  Scenario: Project permissions and access control
    Given I am logged in as a user
    When I view the projects list
    Then I should only see projects I have access to
    And I should only see actions I'm permitted to perform
    And unauthorized actions should be hidden or disabled