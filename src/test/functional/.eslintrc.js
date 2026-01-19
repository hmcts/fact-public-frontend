/**
 * ESLint configuration for Playwright functional tests
 * Extends the root ESLint config with Playwright-specific rules
 */
module.exports = {
  extends: ['../../../.eslintrc.js'],
  env: {
    node: true,
    es2022: true,
  },
  plugins: ['playwright'],
  rules: {
    // Playwright-specific rules
    'playwright/no-restricted-matchers': 'off',
    'playwright/no-skipped-test': 'warn',
    'playwright/no-focused-test': 'error',
    'playwright/valid-expect': 'error',
    'playwright/prefer-web-first-assertions': 'warn',
    'playwright/no-useless-await': 'warn',
    'playwright/no-wait-for-timeout': 'warn',
    'playwright/no-element-handle': 'warn',
    'playwright/no-eval': 'warn',
    'playwright/no-page-pause': 'error',

    // TypeScript overrides for test files
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'off', // Allow console in tests for debugging
  },
  overrides: [
    {
      files: ['*.spec.ts', '*.test.ts'],
      rules: {
        'playwright/expect-expect': 'warn',
      },
    },
  ],
};
