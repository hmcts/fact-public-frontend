import { Page } from '@playwright/test';

import { AccessibilityPage } from './accessibility.po';
import { ChooseActionPage } from './choose-action.po';
import { ChooseServiceAreaPage } from './choose-service-area.po';
import { ChooseServicePage } from './choose-service.po';
import { CourtPage } from './court.po';
import { HomePage } from './home.po';
import { NotFoundPage } from './not-found.po';
import { PostcodeResultsPage } from './postcode-results.po';
import { PostcodeSearchPage } from './postcode-search.po';
import { PrefixSearchPage } from './prefix-search.po';
import { SearchFlowPage } from './search-flow.po';
import { ServiceResultsPage } from './service-results.po';
import { UnknownServicePage } from './unknown-service.po';

export interface PageFixtures {
  accessibilityPage: AccessibilityPage;
  chooseActionPage: ChooseActionPage;
  chooseServiceAreaPage: ChooseServiceAreaPage;
  chooseServicePage: ChooseServicePage;
  courtPage: CourtPage;
  determinePage: Page;
  homePage: HomePage;
  notFoundPage: NotFoundPage;
  postcodeResultsPage: PostcodeResultsPage;
  postcodeSearchPage: PostcodeSearchPage;
  prefixSearchPage: PrefixSearchPage;
  searchFlowPage: SearchFlowPage;
  serviceResultsPage: ServiceResultsPage;
  unknownServicePage: UnknownServicePage;
}

export const pageFixtures = {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  determinePage: async ({ page, lighthousePage }, use, testInfo): Promise<void> => {
    await use(testInfo.tags.includes('@performance') ? lighthousePage : page);
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  accessibilityPage: async ({ determinePage }, use): Promise<void> => {
    await use(new AccessibilityPage(determinePage));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  chooseActionPage: async ({ determinePage }, use): Promise<void> => {
    await use(new ChooseActionPage(determinePage));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  chooseServiceAreaPage: async ({ determinePage }, use): Promise<void> => {
    await use(new ChooseServiceAreaPage(determinePage));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  chooseServicePage: async ({ determinePage }, use): Promise<void> => {
    await use(new ChooseServicePage(determinePage));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  courtPage: async ({ determinePage }, use): Promise<void> => {
    await use(new CourtPage(determinePage));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  homePage: async ({ determinePage }, use): Promise<void> => {
    await use(new HomePage(determinePage));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  notFoundPage: async ({ determinePage }, use): Promise<void> => {
    await use(new NotFoundPage(determinePage));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  postcodeResultsPage: async ({ determinePage }, use): Promise<void> => {
    await use(new PostcodeResultsPage(determinePage));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  postcodeSearchPage: async ({ determinePage }, use): Promise<void> => {
    await use(new PostcodeSearchPage(determinePage));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  prefixSearchPage: async ({ determinePage }, use): Promise<void> => {
    await use(new PrefixSearchPage(determinePage));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  searchFlowPage: async ({ determinePage }, use): Promise<void> => {
    await use(new SearchFlowPage(determinePage));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  serviceResultsPage: async ({ determinePage }, use): Promise<void> => {
    await use(new ServiceResultsPage(determinePage));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  unknownServicePage: async ({ determinePage }, use): Promise<void> => {
    await use(new UnknownServicePage(determinePage));
  },
};
