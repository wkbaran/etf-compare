# Automated Testing

This directory contains Playwright tests for regression testing of the ETF Comparison Tool.

## Setup

Navigate to the tests directory and install dependencies:

```bash
cd tests
npm install
npm run install-browsers
```

## Running Tests

From the `tests` directory:

```bash
npm test                # Run all tests
npm run test:headed     # Run with visible browser
npm run test:debug      # Debug mode
npm run test:ui         # Interactive UI
```

## Test Coverage

The test suite covers:
- Application loading and UI elements
- Theme toggle functionality  
- ETF creation and data input
- Column detection and mapping
- Multi-ETF comparison and overlap analysis
- Sorting and financial calculations
- Data persistence and error handling

Tests run on Chrome, Firefox, and Safari with automatic server startup on port 8001.