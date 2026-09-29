import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { DataApiHealthService } from '../../../main/services/DataApiHealthService';

describe('DataApiHealthService', () => {
  let now: number;
  let checkProtectedHealth: jest.MockedFunction<() => Promise<boolean>>;
  let healthCheck: DataApiHealthService;

  beforeEach(() => {
    now = 0;
    checkProtectedHealth = jest.fn();
    healthCheck = new DataApiHealthService(
      { checkProtectedHealth } as unknown as DataApiRequests,
      () => now,
      10_000,
      3
    );
  });

  test('caches a completed result for ten seconds', async () => {
    checkProtectedHealth.mockResolvedValue(true);

    await expect(healthCheck.check()).resolves.toEqual({ healthy: true, consecutiveFailures: 0 });
    now = 9_999;
    await expect(healthCheck.check()).resolves.toEqual({ healthy: true, consecutiveFailures: 0 });
    expect(checkProtectedHealth).toHaveBeenCalledTimes(1);

    now = 10_000;
    await healthCheck.check();
    expect(checkProtectedHealth).toHaveBeenCalledTimes(2);
  });

  test('coalesces concurrent callers onto one in-flight request', async () => {
    let resolveCheck: ((healthy: boolean) => void) | undefined;
    checkProtectedHealth.mockReturnValue(
      new Promise(resolve => {
        resolveCheck = resolve;
      })
    );

    const first = healthCheck.check();
    const second = healthCheck.check();
    expect(checkProtectedHealth).toHaveBeenCalledTimes(1);

    resolveCheck?.(true);
    await expect(Promise.all([first, second])).resolves.toEqual([
      { healthy: true, consecutiveFailures: 0 },
      { healthy: true, consecutiveFailures: 0 },
    ]);
  });

  test('reports DOWN only after three executed failures and recovers immediately', async () => {
    checkProtectedHealth.mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValueOnce(false);

    await expect(healthCheck.check()).resolves.toEqual({ healthy: true, consecutiveFailures: 1 });
    now += 10_000;
    await expect(healthCheck.check()).resolves.toEqual({ healthy: true, consecutiveFailures: 2 });
    now += 10_000;
    await expect(healthCheck.check()).resolves.toEqual({ healthy: false, consecutiveFailures: 3 });

    checkProtectedHealth.mockResolvedValueOnce(true);
    now += 10_000;
    await expect(healthCheck.check()).resolves.toEqual({ healthy: true, consecutiveFailures: 0 });
  });

  test('does not count cached failures more than once', async () => {
    checkProtectedHealth.mockResolvedValue(false);

    await expect(healthCheck.check()).resolves.toEqual({ healthy: true, consecutiveFailures: 1 });
    now = 5_000;
    await expect(healthCheck.check()).resolves.toEqual({ healthy: true, consecutiveFailures: 1 });
    expect(checkProtectedHealth).toHaveBeenCalledTimes(1);
  });
});
