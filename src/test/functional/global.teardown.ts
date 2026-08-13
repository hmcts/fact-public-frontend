import { request } from '@playwright/test';

import { FUNCTIONAL_TEST_RUN_PREFIX } from './helpers/courtTestData';
import { FUNCTIONAL_TEST_SERVICE_CENTRE_PREFIX } from './helpers/serviceCentreTestData';
import {
  createTestingSupportContext,
  deleteCourtsByPrefix,
  deleteServiceCentresByPrefix,
} from './helpers/testingSupportClient';

async function globalTeardown(): Promise<void> {
  const apiContext = await createTestingSupportContext({ request });

  try {
    await deleteCourtsByPrefix(apiContext, FUNCTIONAL_TEST_RUN_PREFIX);
    await deleteServiceCentresByPrefix(apiContext, FUNCTIONAL_TEST_SERVICE_CENTRE_PREFIX);
  } catch {
    // Best-effort cleanup must not hide the original test result.
  } finally {
    await apiContext.dispose();
  }
}

export default globalTeardown;
