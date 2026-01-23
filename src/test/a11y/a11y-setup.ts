import { startTestServer } from './utils/test-server';

async function globalSetup(): Promise<void> {
  process.env.A11Y_TEST_URL = await startTestServer();
}

export default globalSetup;
