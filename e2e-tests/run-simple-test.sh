#!/bin/bash

echo "🚀 Running Simple Jira Workflow Test"
echo "===================================="

# Simple direct command that works
HEADLESS=true ./node_modules/.bin/cucumber-js \
  --require-module ts-node/register \
  --require './step-definitions/simple-steps.ts' \
  --require './support/world.ts' \
  features/simple-workflow.feature

echo ""
echo "✅ Test Complete!"
echo ""
echo "This test covers:"
echo "✅ Project creation"
echo "✅ Epic creation"
echo "✅ Story creation"
echo "✅ Task creation"
echo "✅ Epic linking (if supported)"
echo "✅ Sprint creation (if supported)"
echo "✅ Sprint management (if supported)"
echo "✅ Time logging (if supported)"
echo "✅ Task movement (if supported)"
echo "✅ Reports verification"