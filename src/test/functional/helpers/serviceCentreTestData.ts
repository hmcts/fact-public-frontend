import { APIRequestContext } from '@playwright/test';

import { generateRandomString, generateUppercaseRandomString } from './courtTestUtils';
import {
  PlaywrightLike,
  ServiceCentreCreateParams,
  ServiceCentreDetails,
  createServiceCentre,
  createTestingSupportContext,
  deleteServiceCentresByPrefix,
} from './testingSupportClient';

type ServiceCentreData = {
  name: string;
  slug: string;
  body: ServiceCentreDetails;
};

export const FUNCTIONAL_TEST_SERVICE_CENTRE_PREFIX = `FaCTPublicServiceCentreTest${
  process.env.PLAYWRIGHT_TEST_RUN_SUFFIX?.toUpperCase() ?? generateUppercaseRandomString(4)
}`;

export type ServiceCentreTestData = {
  apiContext: APIRequestContext;
  defaultServiceCentre: ServiceCentreData;
  warningNoticeServiceCentre: ServiceCentreData;
  noContactServiceCentre: ServiceCentreData;
  closedServiceCentre: ServiceCentreData;
  cleanup: () => Promise<void>;
};

async function createServiceCentreData(
  apiContext: APIRequestContext,
  params: ServiceCentreCreateParams
): Promise<ServiceCentreData> {
  const responseBody = await createServiceCentre(apiContext, params);

  return {
    name: String(params.serviceCentreName),
    slug: responseBody.slug,
    body: responseBody,
  };
}

export async function createServiceCentreTestData(
  playwright: PlaywrightLike,
  suiteLabel: string
): Promise<ServiceCentreTestData> {
  const apiContext = await createTestingSupportContext(playwright);

  const uniqueSuffix = `${generateRandomString()} ${generateRandomString()}`;
  const prefixes = {
    defaultServiceCentre: `${FUNCTIONAL_TEST_SERVICE_CENTRE_PREFIX} ${suiteLabel} Test Service Centre ${uniqueSuffix}`,
    warningNoticeServiceCentre: `${FUNCTIONAL_TEST_SERVICE_CENTRE_PREFIX} ${suiteLabel} Warning Notice Service Centre ${uniqueSuffix}`,
    noContactServiceCentre: `${FUNCTIONAL_TEST_SERVICE_CENTRE_PREFIX} ${suiteLabel} No Contact Service Centre ${uniqueSuffix}`,
    closedServiceCentre: `${FUNCTIONAL_TEST_SERVICE_CENTRE_PREFIX} ${suiteLabel} Closed Service Centre ${uniqueSuffix}`,
  };

  const cleanup = async (): Promise<void> => {
    await deleteServiceCentresByPrefix(apiContext, prefixes.defaultServiceCentre);
    await deleteServiceCentresByPrefix(apiContext, prefixes.warningNoticeServiceCentre);
    await deleteServiceCentresByPrefix(apiContext, prefixes.noContactServiceCentre);
    await deleteServiceCentresByPrefix(apiContext, prefixes.closedServiceCentre);
  };

  await cleanup();
  try {
    const defaultServiceCentre = await createServiceCentreData(apiContext, {
      serviceCentreName: prefixes.defaultServiceCentre,
      open: true,
    });
    const warningNoticeServiceCentre = await createServiceCentreData(apiContext, {
      serviceCentreName: prefixes.warningNoticeServiceCentre,
      open: true,
      addWarningNotice: true,
    });
    const noContactServiceCentre = await createServiceCentreData(apiContext, {
      serviceCentreName: prefixes.noContactServiceCentre,
      open: true,
      withContactDetails: false,
    });
    const closedServiceCentre = await createServiceCentreData(apiContext, {
      serviceCentreName: prefixes.closedServiceCentre,
      open: false,
    });

    return {
      apiContext,
      defaultServiceCentre,
      warningNoticeServiceCentre,
      noContactServiceCentre,
      closedServiceCentre,
      cleanup,
    };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
