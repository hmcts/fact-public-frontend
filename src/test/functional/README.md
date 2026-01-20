# Functional Testing Guide - FACT Public Frontend

Complete guide to running Playwright functional tests for the FACT Public Frontend application.

**For writing tests, see the [Code Writing Instructions](../../AGENTS.md#code-writing-instructions) section in AGENTS.md**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Running The Application](#running-the-application)
5. [Running Tests - All The Ways](#running-tests---all-the-ways)
6. [Viewing Test Reports](#viewing-test-reports)
7. [Debugging Failed Tests](#debugging-failed-tests)
8. [Troubleshooting](#troubleshooting)
9. [Useful Resources](#useful-resources)
10. [Quick Reference Card](#quick-reference-card)

---

## Quick Start

**Get up and running in 2 minutes:**

```bash
# 1. Install dependencies
yarn install

# 2. Install Playwright browsers
yarn playwright:install

# 3. Start the application (Terminal 1)
yarn start:dev

# 4. Run tests in another terminal (Terminal 2)
yarn test:functional
```

That's it! Your tests are now running.

---

## Prerequisites

Before you start, make sure you have:

- **Node.js**: v22.21.1 or later
- **Yarn**: v4.12.0 (Berry)
- **Git**: For cloning the repository
- **Terminal/Command Line**: Access to run commands

**Operating Systems:**

- macOS
- Linux
- Windows (with WSL recommended)

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fact-public-frontend
```

### 2. Install Dependencies

```bash
yarn install
```

This installs:

- Application dependencies
- Playwright testing framework
- All required packages

### 3. Install Playwright Browsers

```bash
yarn playwright:install
```

This downloads:

- Chrome/Chromium
- Firefox
- WebKit (Safari)
- Required system dependencies

**Note:** This is a one-time setup. Browsers are stored separately from your personal browsers.

---

## Running The Application

The tests need the application running to test against. You have three options:

### Option 1: Development Mode (Recommended for Testing)

**Terminal 1:**

```bash
yarn start:dev
```

- Application runs at: http://localhost:3344
- Auto-reloads on code changes
- Best for active development

### Option 2: Production Mode

**Terminal 1:**

```bash
yarn build
yarn start
```

- Optimized production build
- No auto-reload
- Tests production-like environment

### Option 3: Docker

```bash
docker-compose up
```

- Runs in container
- Tests containerized environment
- Application at: https://localhost:3344

**Keep the application running** while you run tests in another terminal.

---

## Running Tests - All The Ways

### Basic Commands

#### Run All Tests (Headless - No Browser Visible)

```bash
yarn test:functional
```

**What happens:**

- Runs in Chrome, Firefox, and WebKit
- No browser window (runs in background)
- Fastest way to run tests
- Same as CI/CD runs

---

### Browser-Specific Tests

#### Chrome Only

```bash
yarn test:functional:chrome
```

#### Firefox Only

```bash
yarn test:functional:firefox
```

#### WebKit (Safari) Only

```bash
yarn test:functional:webkit
```

**When to use:**

- Testing browser-specific behavior
- Debugging issues in one browser
- Faster than running all browsers

---

### Interactive Testing Modes

#### UI Mode (Interactive Test Runner) - BEST FOR DEVELOPMENT

```bash
yarn test:functional:ui
```

**Features:**

- Click to run individual tests
- Visual test picker
- Watch mode (auto-reruns on file changes)
- Step through test execution
- See browser and code side-by-side
- Time travel through test steps

**Why use this:**
This is the BEST way to develop and debug tests. Better than IDE run buttons!

#### Headed Mode (See The Browser)

```bash
yarn test:functional:headed
```

**What you see:**

- Browser window opens
- Watch tests execute live
- See exactly what's happening
- Slower than headless

**When to use:**

- Debugging visual issues
- Understanding test flow
- Showing tests to others

#### Debug Mode (Step Through Tests)

```bash
yarn test:functional:debug
```

**What happens:**

- Playwright Inspector opens
- Pause/resume execution
- Step through each action
- Inspect page state
- View console logs

**When to use:**

- Test is failing mysteriously
- Need to inspect element locators
- Understanding complex interactions

---

### Test Type Selectors

#### Smoke Tests Only

```bash
yarn test:functional:smoke
```

**Runs:** Tests tagged with `@smoke`
**Use case:** Quick health check before deployment

#### Accessibility Tests Only

```bash
yarn test:functional:a11y
```

**Runs:** Tests tagged with `@a11y`
**Use case:** WCAG compliance checking

---

### Running Specific Tests

#### Single Test File

```bash
yarn test:functional tests/home.spec.ts
```

#### Single Test By Name

```bash
yarn test:functional -g "should display the home page"
```

**Examples:**

```bash
# Run all home page tests
yarn test:functional tests/home.spec.ts

# Run only the heading test
yarn test:functional -g "should have correct heading text"

# Run all tests containing "login"
yarn test:functional -g "login"
```

---

### CI/CD Commands

#### Full CI Check

```bash
yarn cichecks
```

**Runs everything:**

1. Install dependencies
2. Build application
3. Lint code
4. Unit tests
5. Route tests
6. Accessibility tests
7. **Functional tests** ← Your tests here

**When to use:**

- Before pushing to git
- Verify everything works
- Same as pipeline runs

---

## Viewing Test Reports

After tests run, you get multiple report types:

### 1. Console Output (Immediate)

**See in terminal:**

- Pass/fail status
- Test duration
- Error messages

### 2. HTML Report (Detailed)

```bash
yarn playwright:report
```

**Opens:** `playwright-report/index.html` in browser

**Contains:**

- Test results per browser
- Screenshots on failure
- Test duration
- Error stack traces

### 3. Odhin Report (Rich Visualizations)

**Location:** `playwright-odhin/index.html`

**Open manually:**

```bash
open playwright-odhin/index.html          # macOS
xdg-open playwright-odhin/index.html      # Linux
start playwright-odhin/index.html         # Windows
```

**Features:**

- Pie charts (pass/fail rates)
- Bar graphs (test duration)
- Filter by browser, status, tag
- Screenshots and videos
- Detailed logs

### 4. JUnit XML (For CI)

**Location:** `test-results/junit.xml`

**Used by:**

- Jenkins
- Azure DevOps
- GitHub Actions
- CI/CD pipelines

---

## Debugging Failed Tests

### Where To Find Debug Information

#### 1. Screenshots (On Failure)

**Location:** `test-results/`

**Contains:**

- Screenshot at moment of failure
- Shows what the page looked like
- Helps identify visual issues

#### 2. Videos (On Failure)

**Location:** `test-results/`

**Contains:**

- Video recording of test execution
- Shows full test flow leading to failure
- Helps understand sequence of events

#### 3. Traces (On Failure)

**Location:** `test-results/`

**Open with:**

```bash
npx playwright show-trace test-results/trace.zip
```

**Features:**

- Step-by-step execution
- DOM snapshots at each step
- Network requests
- Console logs
- Timeline view

---

### Debugging Techniques

#### Strategy 1: Use UI Mode (Easiest)

```bash
yarn test:functional:ui
```

1. Select failing test
2. Click "Show Browser"
3. Watch test execute
4. See exactly where it fails

#### Strategy 2: Add Breakpoints

```typescript
test('my test', async ({ page }) => {
  await page.goto('/');

  await page.pause(); // ← Adds breakpoint

  await page.click('button');
});
```

Run with:

```bash
yarn test:functional:debug
```

#### Strategy 3: Add Console Logs

```typescript
test('my test', async ({ page, homePage }) => {
  console.log('Starting test...');

  const text = await homePage.getHeadingText();
  console.log('Heading text:', text);

  await expect(homePage.heading).toBeVisible();
  console.log('Heading is visible!');
});
```

#### Strategy 4: Check Screenshots

```bash
# After test fails, check test-results/ folder
ls test-results/
```

Look for:

- `screenshot-on-failure.png`
- `video.webm`
- `trace.zip`

---

### Common Failure Scenarios

#### Test Timeout

**Error:** "Test timeout of 180000ms exceeded"

**Causes:**

- Application not running
- Element never appears
- Network too slow

**Solutions:**

1. Check app is running at http://localhost:3344
2. Increase timeout in playwright.config.ts
3. Check element selector is correct

#### Element Not Found

**Error:** "Locator('h1').toBeVisible: Target closed"

**Causes:**

- Wrong selector
- Element doesn't exist
- Page didn't load

**Solutions:**

1. Inspect page with UI mode
2. Verify selector in browser DevTools
3. Add wait: `await page.waitForLoadState('networkidle')`

#### Connection Refused

**Error:** "net::ERR_CONNECTION_REFUSED at http://localhost:3344"

**Cause:**

- Application not running

**Solution:**

```bash
# Start the app first!
yarn start:dev
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Error: browserType.launch: Executable doesn't exist"

**Cause:** Playwright browsers not installed

**Solution:**

```bash
yarn playwright:install
```

---

#### Issue: "Error: Requiring @playwright/test second time"

**Cause:** Duplicate Playwright installations

**Solution:** The cleanup script should handle this, but if it persists:

```bash
# Remove node_modules and reinstall
rm -rf node_modules
yarn install
```

---

#### Issue: "Error: net::ERR_CONNECTION_REFUSED at http://localhost:3344"

**Cause:** Application not running

**Solution:**

```bash
# Terminal 1: Start the app
yarn start:dev

# Terminal 2: Run tests
yarn test:functional
```

---

#### Issue: Tests pass locally but fail in CI

**Causes:**

- Timing issues (CI is slower)
- Browser versions differ
- Screen resolution differences

**Solutions:**

1. Increase timeouts
2. Add explicit waits: `await page.waitForSelector('h1')`
3. Use `waitForLoadState('networkidle')`
4. Check CI logs and screenshots

---

#### Issue: "Cannot find module '../fixtures'"

**Cause:** Wrong import path

**Solution:**
Check your test file imports from the correct location:

```typescript
// If test is in tests/
import { test, expect } from '../fixtures'; // Correct

// If test is in tests/subfolder/
import { test, expect } from '../../fixtures'; // Correct
```

---

#### Issue: ESLint errors in tests

**Cause:** Test-specific rules not applied

**Solution:**
ESLint config already exists at `src/test/functional/.eslintrc.js`

If you see errors:

```bash
yarn lint:fix
```

---

### Getting Help

1. **Check this README** - Most answers are here
2. **Check AGENTS.md** - Detailed setup documentation
3. **Playwright Docs** - https://playwright.dev
4. **Ask the team** - Someone has probably seen this before
5. **Check test output** - Error messages are usually helpful

---

## Useful Resources

### Documentation

- **Playwright Official Docs:** https://playwright.dev
- **Best Practices:** https://playwright.dev/docs/best-practices
- **API Reference:** https://playwright.dev/docs/api/class-playwright
- **HMCTS Playwright Common:** Check `node_modules/@hmcts/playwright-common`

### Tools

- **Playwright Inspector:** Built-in debugger (`yarn test:functional:debug`)
- **Playwright UI Mode:** Interactive test runner (`yarn test:functional:ui`)
- **Trace Viewer:** Timeline view of test execution

### Templates

- **HMCTS Template:** `/Users/dan-marius.bradea/Projects/tcoe-playwright-example`
- **This Project:** Examples in `tests/home.spec.ts`

### Reporting

- **Odhin Reporter:** Rich HTML reports with charts
- **HTML Reporter:** Standard Playwright HTML output
- **JUnit:** XML format for CI/CD

---

## Quick Reference Card

### Most Common Commands

```bash
# Start app
yarn start:dev

# Run all tests (headless)
yarn test:functional

# Development mode (UI)
yarn test:functional:ui

# Debug mode
yarn test:functional:debug

# View reports
yarn playwright:report

# Full CI check
yarn cichecks

# Specific test
yarn test:functional tests/home.spec.ts

# Specific browser
yarn test:functional:chrome
```

### File Locations

```
Tests:                  src/test/functional/tests/
Page Objects:           src/test/functional/page-objects/pages/
Reports (HTML):         playwright-report/index.html
Reports (Odhin):        playwright-odhin/index.html
Reports (JUnit):        test-results/junit.xml
Screenshots/Videos:     test-results/
Config:                 playwright.config.ts
Fixtures:               src/test/functional/fixtures.ts
```

---
