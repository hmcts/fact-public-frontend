import { stopTestServer } from './utils/test-server';

async function globalTeardown(): Promise<void> {
  await stopTestServer();
}

export default globalTeardown;
