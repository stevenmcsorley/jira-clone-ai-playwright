Feature: Complete Jira Workflow from Project Creation to Sprint Completion
  As a project manager
  I want to create a project and execute a complete agile workflow
  So that I can manage the full development lifecycle including sprints, epics, tasks, time tracking, and reporting

  Background:
    Given I am on the Jira clone application

  @complete-workflow @smoke @bug-report
  Scenario: Complete end-to-end Jira workflow
    # Step 1: Create a new project
    Given I am on the "projects" page
    When I click the "Create Project" button
    And I fill "name" with "Complete Workflow Test"
    And I fill "key" with "CWT"
    And I fill "description" with "End-to-end workflow testing project"
    And I submit the form
    Then I should see "Complete Workflow Test" in the projects list

    # Step 2: Create different types of issues
    Given I have created a project "Complete Workflow Test" with key "CWT"
    And I am on the project board
    When I create the following issue types:
      | Title                    | Type  | Description                           |
      | User Authentication Epic | Epic  | Complete user authentication system  |
      | Login Feature           | Story | User login functionality              |
      | User Registration       | Story | User registration functionality      |
      | Login Bug Fix          | Bug   | Fix login validation error           |
      | Database Setup         | Task  | Setup authentication database        |
    Then I should see 5 issues on the board
    And I should see "User Authentication Epic"
    And I should see "Login Feature"
    And I should see "User Registration"

  @epic-linking @bug-report
  Scenario: Link tasks and stories to epics
    Given I have created a project "Complete Workflow Test" with key "CWT"
    And I have created an issue "User Authentication Epic" of type "Epic"
    And I have created an issue "Login Feature" of type "Story"
    And I have created an issue "Database Setup" of type "Task"
    And I am on the project board
    When I link issue "Login Feature" to epic "User Authentication Epic"
    And I link issue "Database Setup" to epic "User Authentication Epic"
    Then issue "Login Feature" should be linked to epic "User Authentication Epic"
    And issue "Database Setup" should be linked to epic "User Authentication Epic"

  @sprint-management @bug-report
  Scenario: Create sprint and add tasks
    Given I have created a project "Complete Workflow Test" with key "CWT"
    And I have created multiple issues
    When I create a new sprint named "Sprint 1 - Authentication"
    And I add issue "Login Feature" to the sprint
    And I add issue "Database Setup" to the sprint
    And I add issue "Login Bug Fix" to the sprint
    And I start the sprint
    Then the sprint should be active
    And I should see the sprint contains the added issues

  @task-workflow @time-tracking @bug-report
  Scenario: Complete task workflow with time tracking
    Given I have created a project "Complete Workflow Test" with key "CWT"
    And I have created an issue "Login Feature"
    And I have created a sprint and added the issue to it
    And the sprint is active
    And I am on the project board

    # Move task through workflow states
    When I move issue "Login Feature" from "To Do" to "In Progress"
    Then issue "Login Feature" should be in "In Progress" status

    # Log time on the task
    When I log "4" hours to issue "Login Feature"
    Then issue "Login Feature" should show "4" hours logged

    # Move to code review
    When I move issue "Login Feature" from "In Progress" to "Code Review"
    Then issue "Login Feature" should be in "Code Review" status

    # Log additional time
    When I log "2" hours to issue "Login Feature"
    Then issue "Login Feature" should show "6" hours logged

    # Complete the task
    When I move issue "Login Feature" from "Code Review" to "Done"
    Then issue "Login Feature" should be in "Done" status

  @sprint-completion @reporting @bug-report
  Scenario: Complete sprint and verify reports
    Given I have created a project "Complete Workflow Test" with key "CWT"
    And I have created multiple issues in a sprint
    And I have moved issues through the workflow
    And I have logged time on multiple tasks
    When I complete the sprint
    Then the sprint should be marked as completed

    # Verify sprint appears in reports
    When I navigate to the "reports" page
    Then I should see the completed sprint in reports
    And the reports should show sprint completion data
    And the reports should show total hours logged
    And the reports should show velocity metrics

  @comprehensive-workflow @bug-report
  Scenario: Full workflow validation
    Given I am on the "projects" page

    # Create project
    When I click the "Create Project" button
    And I fill "name" with "Full Workflow Project"
    And I fill "key" with "FWP"
    And I fill "description" with "Complete workflow validation project"
    And I submit the form
    Then I should see "Full Workflow Project" in the projects list

    # Create Epic
    Given I have created a project "Full Workflow Project" with key "FWP"
    And I am on the project board
    When I create a "Epic" issue titled "E-commerce Platform"
    Then I should see "E-commerce Platform" on the board

    # Create Stories linked to Epic
    When I create a "Story" issue titled "Product Catalog"
    And I create a "Story" issue titled "Shopping Cart"
    And I create a "Story" issue titled "User Checkout"
    Then I should see 4 issues on the board

    # Create Tasks
    When I create a "Task" issue titled "Setup Database"
    And I create a "Task" issue titled "Configure API"
    And I create a "Bug" issue titled "Fix Cart Bug"
    Then I should see 7 issues on the board

    # Link issues to Epic
    When I link issue "Product Catalog" to epic "E-commerce Platform"
    And I link issue "Shopping Cart" to epic "E-commerce Platform"
    And I link issue "User Checkout" to epic "E-commerce Platform"
    Then issue "Product Catalog" should be linked to epic "E-commerce Platform"

    # Create and start sprint
    When I create a new sprint named "Sprint 1 - Foundation"
    And I add issue "Setup Database" to the sprint
    And I add issue "Product Catalog" to the sprint
    And I add issue "Configure API" to the sprint
    And I start the sprint
    Then the sprint should be active

    # Work on tasks
    When I move issue "Setup Database" from "To Do" to "In Progress"
    And I log "8" hours to issue "Setup Database"
    And I move issue "Setup Database" from "In Progress" to "Done"
    Then issue "Setup Database" should be in "Done" status
    And issue "Setup Database" should show "8" hours logged

    When I move issue "Product Catalog" from "To Do" to "In Progress"
    And I log "12" hours to issue "Product Catalog"
    And I move issue "Product Catalog" from "In Progress" to "Code Review"
    And I log "4" hours to issue "Product Catalog"
    And I move issue "Product Catalog" from "Code Review" to "Done"
    Then issue "Product Catalog" should be in "Done" status
    And issue "Product Catalog" should show "16" hours logged

    # Complete sprint
    When I complete the sprint
    Then the sprint should be marked as completed

    # Verify reports
    When I navigate to the "reports" page
    Then I should see the completed sprint in reports
    And the reports should show sprint completion data
    And the reports should show total hours logged
    And the reports should show that 2 issues were completed
    And the reports should show velocity metrics

    # Verify project state
    Then the project should have:
      | Component     | Count |
      | Total Issues  | 7     |
      | Completed     | 2+    |
      | Epics         | 1     |
      | Stories       | 3     |
      | Tasks         | 2     |
      | Bugs          | 1     |
      | Sprints       | 1     |