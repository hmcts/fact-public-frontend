import { stopTestServer } from './utils/test-server';

async function globalTeardown(): Promise<void> {
  await stopTestServer();
  // eslint-disable-next-line no-console
  console.log('Test server stopped');
}

export default globalTeardown;
