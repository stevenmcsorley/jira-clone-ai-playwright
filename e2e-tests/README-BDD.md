# BDD End-to-End Testing with Cucumber and Playwright

This directory now contains **Behavior Driven Development (BDD)** tests using Cucumber syntax with Playwright integration, in addition to the existing traditional Playwright tests.

## What's New: BDD Testing

### 🎯 **Why BDD?**
BDD tests are written in **Gherkin syntax** using Given/When/Then steps, making them:
- **Human-readable**: Non-technical stakeholders can understand test scenarios
- **Collaborative**: Business analysts, developers, and QA can collaborate on requirements
- **Living documentation**: Tests serve as executable specifications

### 📁 **BDD Test Structure**

```
e2e-tests/
├── features/                    # Gherkin feature files
│   ├── issue-management.feature
│   ├── kanban-board.feature
│   └── project-management.feature
├── step-definitions/            # JavaScript/TypeScript step implementations
│   ├── common-steps.ts
│   ├── issue-management-steps.ts
│   ├── kanban-board-steps.ts
│   └── project-management-steps.ts
├── support/                     # Test setup and world configuration
│   └── world.ts
└── cucumber.config.js           # Cucumber configuration
```

## 🚀 **Running BDD Tests**

### Prerequisites
```bash
cd e2e-tests
npm install
npx playwright install
```

### Run BDD Tests
```bash
# Run all BDD scenarios
npm run test:bdd

# Run BDD tests with browser UI visible
npm run test:bdd:headed

# Run specific feature file
npx cucumber-js features/issue-management.feature
```

### Run Traditional Playwright Tests (still available)
```bash
# Run traditional Playwright tests
npm test

# Run with browser UI
npm run test:headed
```

## 📝 **Example BDD Scenario**

```gherkin
Feature: Issue Management
  As a project team member
  I want to create, view, and manage issues
  So that I can track work and collaborate effectively

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
```

## 🔧 **Features Covered by BDD Tests**

### ✅ Issue Management (`issue-management.feature`)
- Creating issues with all fields
- Form validation
- Inline editing
- API failure handling
- Status filtering
- Assignee display

### ✅ Kanban Board (`kanban-board.feature`)
- Board layout and columns
- Drag and drop functionality
- Issue creation from board
- Responsive design
- Real-time updates (when implemented)

### ✅ Project Management (`project-management.feature`)
- Project list viewing
- Project creation and validation
- Project navigation
- Settings and configuration
- Search and filtering
- Permissions

## 🛠 **Technical Implementation**

### World Setup (`support/world.ts`)
- **Playwright integration**: Browser, context, and page management
- **Helper methods**: Column selectors, common actions
- **Test context**: Shared data between steps
- **Lifecycle management**: Setup and cleanup

### Step Definitions
Each feature has corresponding step definitions that:
- Parse Gherkin steps into executable code
- Interact with Playwright page objects
- Use expect assertions for verification
- Handle test data and context

### Configuration (`cucumber.config.js`)
- **Parallel execution**: Run tests concurrently
- **Multiple formats**: HTML, JSON, and console reporting
- **TypeScript support**: Use TypeScript for step definitions
- **Retries**: Automatic retry on failure

## 📊 **Reporting**

BDD tests generate multiple report formats:

```bash
# View HTML report
open test-results/cucumber-report.html

# JSON results for CI/CD
cat test-results/cucumber-results.json
```

## 🔄 **Integration with Existing Tests**

The BDD tests **complement** the existing Playwright tests:

| Test Type | When to Use | Benefits |
|-----------|-------------|----------|
| **BDD Tests** | User story validation, acceptance criteria | Human-readable, collaborative, living docs |
| **Traditional Playwright** | Detailed technical scenarios, edge cases | Fine-grained control, debugging features |

## 🎯 **Best Practices for BDD**

### Writing Good Scenarios
1. **Focus on behavior**: What the user wants to achieve
2. **Use business language**: Avoid technical implementation details
3. **Keep scenarios independent**: Each should run in isolation
4. **Use descriptive names**: Make intent clear

### Good Example:
```gherkin
Scenario: User assigns urgent priority to critical bug
  Given I am creating a new issue
  When I set the priority to "Urgent"
  And I set the type to "Bug"
  Then the issue should be highlighted as urgent priority
```

### Avoid:
```gherkin
Scenario: Click submit button after filling form
  Given I navigate to /create-issue
  When I fill input[name="title"] with "test"
  And I click button[type="submit"]
  Then I should see success message
```

## 🚀 **Future Enhancements**

### Planned BDD Features
- **Data tables**: Parameterized scenarios
- **Scenario outlines**: Test multiple data sets
- **Background steps**: Common setup for all scenarios
- **Hooks**: Before/after scenario execution
- **Tags**: Group and filter scenarios

### Example with Data Tables:
```gherkin
Scenario: Create issues with different priorities
  Given I am on the project board
  When I create issues with the following details:
    | Title           | Type | Priority |
    | Critical Bug    | Bug  | Urgent   |
    | Feature Request | Story| Medium   |
    | Minor Fix       | Task | Low      |
  Then all issues should appear on the board
```

## 🐛 **Debugging BDD Tests**

### Debug Individual Scenarios
```bash
# Run with debug output
npx cucumber-js features/issue-management.feature --format progress

# Run specific scenario by line number
npx cucumber-js features/issue-management.feature:15
```

### Common Issues
1. **Step not found**: Check step definition file imports
2. **Timeout errors**: Increase wait times for slow operations
3. **Element not found**: Verify selectors match current UI

### Debug Tips
- Use `console.log()` in step definitions
- Add `await this.page.pause()` to stop execution
- Check screenshot/video artifacts on failure

## 📚 **Learning Resources**

- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [Gherkin Syntax Reference](https://cucumber.io/docs/gherkin/)
- [Playwright Documentation](https://playwright.dev/)
- [BDD Best Practices](https://cucumber.io/docs/bdd/)

## 🎉 **Summary**

You now have **both** traditional Playwright tests AND BDD tests:

- **Traditional tests**: `npm test` - Technical, detailed scenarios
- **BDD tests**: `npm run test:bdd` - Business-focused, readable scenarios
- **Automatic bug reporting**: Both test types integrate with existing bug reporting system
- **Comprehensive coverage**: All major Jira clone features tested in both formats

The BDD tests serve as **living documentation** that business stakeholders can read and understand, while the traditional Playwright tests provide detailed technical validation.