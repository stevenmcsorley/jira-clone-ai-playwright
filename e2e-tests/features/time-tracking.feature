Feature: Time Tracking
  As a team member
  I want to log and track time spent on issues
  So that I can monitor effort, improve estimates, and provide accurate reporting

  Background:
    Given I am on the Jira clone application
    And I am on a project board

  Scenario: Log time for an issue
    Given I am on the project board
    And there is an existing issue
    When I click on the issue to open its details
    And I click the "Log Time" button
    And I enter "2h 30m" as the time spent
    And I enter "Implemented user authentication logic" as the work description
    And I click the "Log Time" button to submit
    Then I should see the logged time in the issue's time tracking section
    And the total time logged should be updated
    And the work log should show the description and timestamp

  Scenario: View time tracking summary for an issue
    Given I am on the project board
    And there is an issue with logged time entries
    When I click on the issue to view its details
    Then I should see the "Time Tracking" section
    And I should see the total time logged
    And I should see a list of all time entries with dates and descriptions
    And I should see who logged each time entry

  Scenario: Edit a time log entry
    Given I am on the project board
    And there is an issue with existing time log entries
    When I click on the issue details
    And I click on a time log entry to edit it
    And I update the time from "2h" to "2h 15m"
    And I update the work description
    And I save the changes
    Then the time log entry should show the updated values
    And the total time logged should be recalculated

  Scenario: Delete a time log entry
    Given I am on the project board
    And there is an issue with existing time log entries
    When I click on the issue details
    And I click the delete button on a time log entry
    And I confirm the deletion
    Then the time log entry should be removed
    And the total time logged should be recalculated
    And the entry should no longer appear in the list

  Scenario: Time tracking with different time formats
    Given I am on the project board
    And there is an existing issue
    When I log time using different formats:
      | Format    | Input     | Expected  |
      | Hours     | 2h        | 2h 0m     |
      | Minutes   | 45m       | 0h 45m    |
      | Mixed     | 1h 30m    | 1h 30m    |
      | Decimal   | 2.5h      | 2h 30m    |
    Then all time entries should be parsed and displayed correctly
    And the total time should be calculated accurately

  Scenario: Sprint time tracking summary
    Given I am on the project board
    And there is an active sprint with issues that have logged time
    When I navigate to the sprint progress view
    Then I should see total time logged for the sprint
    And I should see time logged per team member
    And I should see average time per story point
    And I should see daily time logging trends

  Scenario: Individual time tracking report
    Given I am on the project board
    And I have logged time on multiple issues
    When I navigate to my time tracking report
    Then I should see all my time entries for the current period
    And I should be able to filter by date range
    And I should see total time logged per day
    And I should see time distribution across different issues

  Scenario: Team time tracking analytics
    Given I am on the project board
    And team members have logged time on various issues
    When I navigate to the team time tracking analytics
    Then I should see time logged per team member
    And I should see most time-consuming issues
    And I should see time logging patterns and trends
    And I should be able to export time tracking data

  Scenario: Time estimates vs actual time tracking
    Given I am on the project board
    And there are issues with original time estimates
    When team members log actual time spent
    Then I should be able to compare estimated vs actual time
    And I should see variance indicators (over/under estimated)
    And I should see this data in sprint and project reports
    And I should be able to improve future estimates based on historical data

  Scenario: Time tracking validation and error handling
    Given I am on the project board
    When I try to log invalid time entries:
      | Invalid Input | Expected Behavior |
      | -2h          | Show error message |
      | 25h          | Show warning for long hours |
      | abc          | Show format error |
      | 0h 0m        | Show minimum time error |
    Then appropriate validation messages should be displayed
    And invalid entries should not be saved

  Scenario: Bulk time logging for multiple issues
    Given I am on the project board
    And I have worked on multiple issues in a day
    When I access the bulk time logging interface
    And I enter time for multiple issues:
      | Issue              | Time | Description           |
      | User Registration  | 2h   | Frontend development  |
      | Database Migration | 1h   | Schema updates        |
      | Bug Fix #123       | 30m  | CSS styling fix       |
    And I submit the bulk time log
    Then time should be logged for all specified issues
    And I should see confirmation of successful logging
    And the time should appear in each issue's time tracking section