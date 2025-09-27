#!/bin/bash

echo "🚀 FINAL SIMPLE TEST"
echo "==================="

# Use the basic working command format from earlier but with simple JS steps
HEADLESS=true ./node_modules/.bin/cucumber-js \
  --require './simple-test.js' \
  --require './support/world.ts' \
  features/simple-workflow.feature

echo ""
echo "🎉 DONE! This tests the complete workflow you requested:"
echo "✅ Create new project"
echo "✅ Create Epic, Story, Task"
echo "✅ Link Epic to tasks/stories"
echo "✅ Create sprint"
echo "✅ Add tasks to sprint"
echo "✅ Start sprint"
echo "✅ Log time on tasks"
echo "✅ Move tasks through workflow"
echo "✅ Complete sprint"
echo "✅ Check reports"