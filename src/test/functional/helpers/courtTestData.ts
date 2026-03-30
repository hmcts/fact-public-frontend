import { APIRequestContext, expect } from '@playwright/test';

import { Court } from '../../../main/schemas/courtSchema';

import { generateRandomString } from './courtTestUtils';

type PlaywrightLike = {
  request: {
    newContext: (options: { baseURL: string; extraHTTPHeaders: { Accept: string } }) => Promise<APIRequestContext>;
  };
};

type CourtData = {
  name: string;
  slug: string;
  body: Court;
};

export type CourtTestData = {
  apiContext: APIRequestContext;
  defaultCourt: CourtData;
  warningNoticeCourt: CourtData;
  translationCourt: CourtData;
  noTranslationCourt: CourtData;
  noEnquiriesCourt: CourtData;
  cleanup: () => Promise<void>;
};

async function createCourt(
  apiContext: APIRequestContext,
  params: Record<string, string | boolean>
): Promise<CourtData> {
  const response = await apiContext.get('/testing-support/courts', { params });
  const responseBody = (await response.json()) as Court;

  expect(response.ok(), JSON.stringify(responseBody)).toBeTruthy();
  expect(responseBody.slug).toBeTruthy();

  return {
    name: String(params.courtName),
    slug: responseBody.slug,
    body: responseBody,
  };
}

export async function createCourtTestData(playwright: PlaywrightLike, suiteLabel: string): Promise<CourtTestData> {
  const apiContext = await playwright.request.newContext({
    baseURL: `${process.env.DATA_API_URL ?? 'http://localhost:8989'}`,
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  });

  const uniqueSuffix = `${generateRandomString()} ${generateRandomString()}`;
  const prefixes = {
    defaultCourt: `${suiteLabel} Test Court ${uniqueSuffix}`,
    warningNoticeCourt: `${suiteLabel} Warning Notice Test Court ${uniqueSuffix}`,
    translationCourt: `${suiteLabel} Translation Test Court ${uniqueSuffix}`,
    noTranslationCourt: `${suiteLabel} No Translation Test Court ${uniqueSuffix}`,
    noEnquiriesCourt: `${suiteLabel} No Enquiries Test Court ${uniqueSuffix}`,
  };

  const cleanup = async (): Promise<void> => {
    await apiContext.delete(`/testing-support/courts/name-prefix/${prefixes.defaultCourt}`);
    await apiContext.delete(`/testing-support/courts/name-prefix/${prefixes.warningNoticeCourt}`);
    await apiContext.delete(`/testing-support/courts/name-prefix/${prefixes.translationCourt}`);
    await apiContext.delete(`/testing-support/courts/name-prefix/${prefixes.noTranslationCourt}`);
    await apiContext.delete(`/testing-support/courts/name-prefix/${prefixes.noEnquiriesCourt}`);
  };

  await cleanup();

  const defaultCourt = await createCourt(apiContext, {
    courtName: prefixes.defaultCourt,
    serviceCenter: false,
    open: true,
  });
  const warningNoticeCourt = await createCourt(apiContext, {
    courtName: prefixes.warningNoticeCourt,
    serviceCenter: false,
    open: true,
    addWarningNotice: true,
  });
  const translationCourt = await createCourt(apiContext, {
    courtName: prefixes.translationCourt,
    serviceCenter: false,
    open: true,
    withTranslations: true,
  });
  const noTranslationCourt = await createCourt(apiContext, {
    courtName: prefixes.noTranslationCourt,
    serviceCenter: false,
    open: true,
    withTranslations: false,
  });
  const noEnquiriesCourt = await createCourt(apiContext, {
    courtName: prefixes.noEnquiriesCourt,
    serviceCenter: false,
    open: true,
    withEnquiriesContact: false,
  });

  return {
    apiContext,
    defaultCourt,
    warningNoticeCourt,
    translationCourt,
    noTranslationCourt,
    noEnquiriesCourt,
    cleanup,
  };
}
