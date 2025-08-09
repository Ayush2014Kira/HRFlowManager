#!/bin/bash

echo "🧪 Running HRMS Test Suite"
echo "=========================="

echo ""
echo "📊 Running Backend Tests (Mocha + Chai + Supertest)..."
echo "-------------------------------------------------------"
npx mocha --config mocha.config.js --reporter spec

backend_exit_code=$?

echo ""
echo "⚛️  Running Frontend Tests (Jest + React Testing Library)..."
echo "-----------------------------------------------------------"
npx jest --config jest.config.js --passWithNoTests

frontend_exit_code=$?

echo ""
echo "📈 Test Coverage Report..."
echo "-------------------------"
npx jest --config jest.config.js --coverage --passWithNoTests

echo ""
echo "📋 Test Summary"
echo "==============="
if [ $backend_exit_code -eq 0 ]; then
    echo "✅ Backend Tests: PASSED"
else
    echo "❌ Backend Tests: FAILED"
fi

if [ $frontend_exit_code -eq 0 ]; then
    echo "✅ Frontend Tests: PASSED"
else
    echo "❌ Frontend Tests: FAILED"
fi

if [ $backend_exit_code -eq 0 ] && [ $frontend_exit_code -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "💥 Some tests failed!"
    exit 1
fi