import type { AxeUtils, WaitUtils } from '@hmcts/playwright-common';
import { test as baseTest } from '@playwright/test';

import { PageFixtures, pageFixtures } from './page-objects/pages';
import { Config, config } from './utils';

/**
 * Utility Fixtures
 * Provides utility classes and configuration to tests
 */
export interface UtilsFixtures {
  config: Config;
  axeUtils: AxeUtils;
  waitUtils: WaitUtils;
}

/**
 * Utility fixtures implementation
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const utilsFixtures: Record<keyof UtilsFixtures, any> = {
  // Configuration fixture
  // eslint-disable-next-line no-empty-pattern
  config: async ({}, use) => {
    await use(config);
  },

  // Accessibility testing utility
  axeUtils: async ({ page }, use, testInfo) => {
    const { AxeUtils } = await import('@hmcts/playwright-common');
    const axeUtils = new AxeUtils(page);
    await use(axeUtils);
    // Generate accessibility report after test
    await axeUtils.generateReport(testInfo);
  },

  // Wait utility
  // eslint-disable-next-line no-empty-pattern
  waitUtils: async ({}, use) => {
    const { WaitUtils } = await import('@hmcts/playwright-common');
    await use(new WaitUtils());
  },
};

/**
 * Combined fixtures type
 * Merge all fixture interfaces
 */
export type CustomFixtures = PageFixtures & UtilsFixtures;

/**
 * Extended test object with custom fixtures
 * Import this instead of @playwright/test in your tests
 */
export const test = baseTest.extend<CustomFixtures>({
  ...pageFixtures,
  ...utilsFixtures,
});

/**
 * Export expects from Playwright
 */
export const expect = test.expect;
