import { APIRequestContext, expect } from '@playwright/test';

import { Court } from '../../../main/schemas/courtSchema';
import { config } from '../utils';

export type PlaywrightLike = {
  request: {
    newContext: (options: { baseURL: string; extraHTTPHeaders: { Accept: string } }) => Promise<APIRequestContext>;
  };
};

export type CourtCreateParams = {
  courtName: string;
  regionId?: string;
  seed?: number;
  open?: boolean;
  addWarningNotice?: boolean;
  addWarningNoticeCy?: boolean;
  withTranslations?: boolean;
  withEnquiriesContact?: boolean;
  forceFamilyCourt?: boolean;
};

export type ServiceCentreCreateParams = {
  serviceCentreName: string;
  seed?: number;
  open?: boolean;
  addWarningNotice?: boolean;
  withContactDetails?: boolean;
};

export type ServiceCentreDetails = {
  id: string;
  name: string;
  slug: string;
  open?: boolean;
  warningNotice?: string | null;
  warningNoticeCy?: string | null;
  lastUpdatedAt?: string | null;
  [key: string]: unknown;
};

export type Region = {
  id: string;
  name: string;
  [key: string]: unknown;
};

export async function createTestingSupportContext(playwright: PlaywrightLike): Promise<APIRequestContext> {
  return playwright.request.newContext({
    baseURL: config.urls.dataApiUrl,
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  });
}

export async function getRegions(apiContext: APIRequestContext): Promise<Region[]> {
  const response = await apiContext.get('/testing-support/regions');
  const responseBody = (await response.json()) as unknown;

  expect(response.ok(), JSON.stringify(responseBody)).toBeTruthy();
  expect(Array.isArray(responseBody)).toBeTruthy();

  return responseBody as Region[];
}

export async function createCourt(apiContext: APIRequestContext, params: CourtCreateParams): Promise<Court> {
  const response = await apiContext.get('/testing-support/courts', { params });
  const responseBody = (await response.json()) as Court;

  expect(response.ok(), JSON.stringify(responseBody)).toBeTruthy();
  expect(responseBody.slug).toBeTruthy();

  return responseBody;
}

export async function createServiceCentre(
  apiContext: APIRequestContext,
  params: ServiceCentreCreateParams
): Promise<ServiceCentreDetails> {
  const response = await apiContext.get('/testing-support/service-centres', { params });
  const responseBody = (await response.json()) as ServiceCentreDetails;

  expect(response.ok(), JSON.stringify(responseBody)).toBeTruthy();
  expect(responseBody.slug).toBeTruthy();

  return responseBody;
}

export async function deleteCourtsByPrefix(apiContext: APIRequestContext, courtNamePrefix: string): Promise<void> {
  await apiContext.delete(`/testing-support/courts/name-prefix/${courtNamePrefix}`);
}

export async function deleteServiceCentresByPrefix(
  apiContext: APIRequestContext,
  serviceCentreNamePrefix: string
): Promise<void> {
  await apiContext.delete(`/testing-support/service-centres/name-prefix/${serviceCentreNamePrefix}`);
}
