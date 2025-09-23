#!/bin/bash

# Jira Clone E2E Test Setup Script

set -e

echo "🚀 Setting up Jira Clone E2E Tests..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️ Creating environment configuration..."
    cp .env.example .env
    echo "✅ Created .env file. Please review and update if needed."
else
    echo "✅ Environment file already exists"
fi

# Check if the main application is running
echo "🔍 Checking if Jira Clone application is running..."
if curl -s http://localhost:5173 &> /dev/null; then
    echo "✅ Application is running"
else
    echo "⚠️ Application is not running. Please start it first:"
    echo "   cd .. && docker compose up"
fi

echo ""
echo "🎉 Setup complete! You can now run tests:"
echo ""
echo "  # Run all tests"
echo "  npm test"
echo ""
echo "  # Run tests with browser UI"
echo "  npm run test:headed"
echo ""
echo "  # Debug tests"
echo "  npm run test:debug"
echo ""
echo "  # View test report"
echo "  npm run report"
echo ""
echo "📖 See README.md for more information"