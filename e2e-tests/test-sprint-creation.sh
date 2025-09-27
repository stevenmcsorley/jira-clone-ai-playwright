#!/bin/bash

echo "🚀 Testing Sprint Creation on Existing Project"
echo "=============================================="

# Use existing project to create a sprint
HEADLESS=true ./node_modules/.bin/cucumber-js \
  --require-module ts-node/register \
  --require './step-definitions/basic-steps.ts' \
  --require './step-definitions/project-workflow-steps.ts' \
  --require './support/world.ts' \
  --format progress \
  --dry-run \
  /dev/stdin << 'EOF'
Feature: Sprint Creation Test
  @sprint-test @bug-report
  Scenario: Create sprint on existing project
    Given I am on the Jira clone application
    And I am on the project board
    When I create a new sprint named "Test Sprint"
    And I start the sprint
    Then the sprint should be active
EOF

echo ""
echo "✅ Sprint creation steps are available!"
echo ""
echo "To actually run the test:"
echo "HEADLESS=true ./node_modules/.bin/cucumber-js --require-module ts-node/register --require './step-definitions/**/*.ts' --require './support/world.ts' [feature-file]"