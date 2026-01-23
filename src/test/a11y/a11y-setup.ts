import { startTestServer } from './utils/test-server';

async function globalSetup(): Promise<void> {
  const baseURL = await startTestServer();
  // eslint-disable-next-line no-console
  console.log(`Test server started at ${baseURL}`);

  process.env.A11Y_TEST_URL = baseURL;
}

export default globalSetup;
