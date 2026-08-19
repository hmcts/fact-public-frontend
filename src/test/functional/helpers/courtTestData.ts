import { APIRequestContext } from '@playwright/test';

import { Court } from '../../../main/schemas/courtSchema';

import { generateRandomString, generateUppercaseRandomString } from './courtTestUtils';
import {
  CourtCreateParams,
  PlaywrightLike,
  createCourt,
  createTestingSupportContext,
  deleteCourtsByPrefix,
} from './testingSupportClient';

type CourtData = {
  name: string;
  slug: string;
  body: Court;
};

export const FUNCTIONAL_TEST_RUN_PREFIX = `FaCTPublicTest${
  process.env.PLAYWRIGHT_TEST_RUN_SUFFIX?.toUpperCase() ?? generateUppercaseRandomString(4)
}`;

export type CourtTestData = {
  apiContext: APIRequestContext;
  defaultCourt: CourtData;
  warningNoticeCourt: CourtData;
  warningNoticeCyCourt: CourtData;
  translationCourt: CourtData;
  noTranslationCourt: CourtData;
  noEnquiriesCourt: CourtData;
  cleanup: () => Promise<void>;
};

async function createCourtData(apiContext: APIRequestContext, params: CourtCreateParams): Promise<CourtData> {
  const responseBody = await createCourt(apiContext, params);

  return {
    name: String(params.courtName),
    slug: responseBody.slug,
    body: responseBody,
  };
}

export async function createCourtTestData(playwright: PlaywrightLike, suiteLabel: string): Promise<CourtTestData> {
  const apiContext = await createTestingSupportContext(playwright);

  const uniqueSuffix = `${generateRandomString()} ${generateRandomString()}`;
  const prefixes = {
    defaultCourt: `${FUNCTIONAL_TEST_RUN_PREFIX} ${suiteLabel} Test Court ${uniqueSuffix}`,
    warningNoticeCourt: `${FUNCTIONAL_TEST_RUN_PREFIX} ${suiteLabel} Warning Notice Test Court ${uniqueSuffix}`,
    warningNoticeCyCourt: `${FUNCTIONAL_TEST_RUN_PREFIX} ${suiteLabel} Welsh Warning Notice Test Court ${uniqueSuffix}`,
    translationCourt: `${FUNCTIONAL_TEST_RUN_PREFIX} ${suiteLabel} Translation Test Court ${uniqueSuffix}`,
    noTranslationCourt: `${FUNCTIONAL_TEST_RUN_PREFIX} ${suiteLabel} No Translation Test Court ${uniqueSuffix}`,
    noEnquiriesCourt: `${FUNCTIONAL_TEST_RUN_PREFIX} ${suiteLabel} No Enquiries Test Court ${uniqueSuffix}`,
  };

  const cleanup = async (): Promise<void> => {
    await deleteCourtsByPrefix(apiContext, prefixes.defaultCourt);
    await deleteCourtsByPrefix(apiContext, prefixes.warningNoticeCourt);
    await deleteCourtsByPrefix(apiContext, prefixes.warningNoticeCyCourt);
    await deleteCourtsByPrefix(apiContext, prefixes.translationCourt);
    await deleteCourtsByPrefix(apiContext, prefixes.noTranslationCourt);
    await deleteCourtsByPrefix(apiContext, prefixes.noEnquiriesCourt);
  };

  await cleanup();
  try {
    const defaultCourt = await createCourtData(apiContext, {
      courtName: prefixes.defaultCourt,
      open: true,
    });
    const warningNoticeCourt = await createCourtData(apiContext, {
      courtName: prefixes.warningNoticeCourt,
      open: true,
      addWarningNotice: true,
    });
    const warningNoticeCyCourt = await createCourtData(apiContext, {
      courtName: prefixes.warningNoticeCyCourt,
      open: true,
      addWarningNoticeCy: true,
    });
    const translationCourt = await createCourtData(apiContext, {
      courtName: prefixes.translationCourt,
      open: true,
      withTranslations: true,
    });
    const noTranslationCourt = await createCourtData(apiContext, {
      courtName: prefixes.noTranslationCourt,
      open: true,
      withTranslations: false,
    });
    const noEnquiriesCourt = await createCourtData(apiContext, {
      courtName: prefixes.noEnquiriesCourt,
      open: true,
      withEnquiriesContact: false,
    });

    return {
      apiContext,
      defaultCourt,
      warningNoticeCourt,
      warningNoticeCyCourt,
      translationCourt,
      noTranslationCourt,
      noEnquiriesCourt,
      cleanup,
    };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
