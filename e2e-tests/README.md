# Jira Clone BDD E2E Testing Framework

A comprehensive, reusable Behavior-Driven Development (BDD) end-to-end testing framework for Jira clone applications. This framework is designed to work across different projects and environments with minimal configuration changes.

## 🚀 Features

- **Environment Agnostic**: Works with any Jira clone deployment (local, staging, production)
- **Project Flexible**: Can test against existing projects or create test projects dynamically
- **Data Management**: Automatic test data setup, management, and cleanup
- **BDD Approach**: Human-readable test scenarios using Gherkin syntax
- **Page Object Pattern**: Maintainable and reusable page objects
- **API Integration**: Direct API calls for efficient test data setup
- **Comprehensive Reporting**: Detailed test reports with screenshots on failure
- **CI/CD Ready**: Designed for continuous integration environments

## 📋 Prerequisites

- Node.js 18+
- Docker and Docker Compose (for local development)
- Running Jira clone application

## 🛠 Installation

1. **Clone/Copy the e2e-tests directory** to your project
2. **Install dependencies**:
   ```bash
   cd e2e-tests
   npm install
   ```
3. **Install Playwright browsers**:
   ```bash
   npm run install-browsers
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `e2e-tests` directory or set these environment variables:

#### Application URLs
```bash
BASE_URL=http://localhost:5173          # Frontend URL
API_URL=http://localhost:4000/api       # Backend API URL
```

#### Test Project Configuration
```bash
# Use existing project (recommended for stable testing)
USE_EXISTING_PROJECT=true
TEST_PROJECT_ID=1

# Or create new project (for isolated testing)
USE_EXISTING_PROJECT=false
TEST_PROJECT_NAME="E2E Test Project"
TEST_PROJECT_KEY="E2E"
TEST_PROJECT_DESC="Automated testing project"
```

#### Test User Configuration
```bash
TEST_USER_ID=1                         # Use existing user ID
TEST_USER_EMAIL=test@example.com
TEST_USER_NAME="Test User"
```

#### Test Execution Settings
```bash
HEADLESS=true                          # Run headless (false for debugging)
SLOW_MO=50                            # Slow down actions (ms)
TEST_TIMEOUT=30000                    # Test timeout (ms)
TEST_RETRIES=1                        # Number of retries on failure
VIEWPORT_WIDTH=1280                   # Browser viewport width
VIEWPORT_HEIGHT=720                   # Browser viewport height
```

#### Data Management
```bash
CLEANUP_AFTER_TESTS=true             # Clean up test data after tests
PRESERVE_TEST_PROJECT=false          # Keep test project after cleanup
```

## 🏃 Running Tests

### Basic Commands

```bash
# Run all BDD tests
npm run test:bdd

# Run tests with browser visible (debugging)
npm run test:bdd:headed

# Run specific tagged tests
npm run test:bdd -- --tags "@smoke"

# Run tests with additional cucumber options
npm run test:bdd -- --tags "@issue" --fail-fast
```

## 📁 Framework Structure

```
e2e-tests/
├── config/
│   └── test.config.ts              # Central configuration management
├── services/
│   ├── api.service.ts              # API integration service
│   └── test-data.service.ts        # Test data management
├── pages/
│   ├── BasePage.ts                 # Base page object class
│   ├── ProjectBoardPage.ts         # Project board page object
│   └── CreateIssuePage.ts          # Create issue page object
├── features/
│   ├── basic-functionality.feature # Basic smoke tests
│   ├── issue-management.feature    # Issue management scenarios
│   ├── sprint-management.feature   # Sprint management scenarios
│   └── time-tracking.feature       # Time tracking scenarios
├── step-definitions/
│   └── basic-steps.ts              # Step implementations
├── support/
│   └── world.ts                    # Test world setup and hooks
└── reporters/
    └── jira-reporter.ts            # Custom reporter for bug creation
```

## 🧪 Usage Example

To test against your Jira clone project, simply:

1. **Configure your environment**:
   ```bash
   # .env file
   BASE_URL=http://your-jira-clone.com
   API_URL=http://your-jira-clone.com/api
   USE_EXISTING_PROJECT=true
   TEST_PROJECT_ID=42  # Your project ID
   TEST_USER_ID=123    # Your test user ID
   ```

2. **Run the tests**:
   ```bash
   npm run test:bdd -- --tags "@smoke"
   ```

3. **View results**: The framework will automatically manage test data and provide detailed reporting.

## 🔧 Framework Components

- **Configuration Management**: Environment-based configuration
- **API Service**: Complete CRUD operations for all entities
- **Test Data Service**: Smart test data lifecycle management
- **Page Objects**: Clean UI interaction abstractions
- **BDD Features**: Human-readable scenarios covering all functionality

## 🐛 Debugging

```bash
# Run with browser visible for debugging
HEADLESS=false npm run test:bdd

# Run with slow motion
SLOW_MO=1000 npm run test:bdd

# Run specific test
npm run test:bdd -- --name "View the project board"
```

## 🤝 Contributing

This framework is designed to be:
- **Reusable** across different Jira clone projects
- **Maintainable** with clear separation of concerns
- **Extensible** for additional functionality
- **Environment-agnostic** for various deployment scenarios

Follow the existing patterns when adding new tests or functionality.

---

**Ready to test any Jira clone project with comprehensive BDD scenarios!** 🚀