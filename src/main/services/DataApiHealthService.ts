import { DataApiRequests } from '../requests/DataApiRequests';

const CACHE_TTL_MS = 10_000;
const FAILURE_THRESHOLD = 3;

export type DataApiHealthResult = {
  healthy: boolean;
  consecutiveFailures: number;
};

export class DataApiHealthService {
  private cachedResult: DataApiHealthResult | undefined;
  private cacheExpiresAt = 0;
  private consecutiveFailures = 0;
  private inFlightCheck: Promise<DataApiHealthResult> | undefined;

  public constructor(
    private readonly dataApiRequests: DataApiRequests = new DataApiRequests(),
    private readonly now: () => number = Date.now,
    private readonly cacheTtlMs: number = CACHE_TTL_MS,
    private readonly failureThreshold: number = FAILURE_THRESHOLD
  ) {}

  public check(): Promise<DataApiHealthResult> {
    if (this.cachedResult && this.now() < this.cacheExpiresAt) {
      return Promise.resolve(this.cachedResult);
    }

    if (this.inFlightCheck !== undefined) {
      return this.inFlightCheck;
    }

    const check = this.executeCheck().finally(() => {
      if (this.inFlightCheck === check) {
        this.inFlightCheck = undefined;
      }
    });
    this.inFlightCheck = check;
    return check;
  }

  private async executeCheck(): Promise<DataApiHealthResult> {
    const dataApiHealthy = await this.dataApiRequests.checkProtectedHealth();

    if (dataApiHealthy) {
      this.consecutiveFailures = 0;
    } else {
      this.consecutiveFailures += 1;
    }

    this.cachedResult = {
      healthy: dataApiHealthy || this.consecutiveFailures < this.failureThreshold,
      consecutiveFailures: this.consecutiveFailures,
    };
    this.cacheExpiresAt = this.now() + this.cacheTtlMs;
    return this.cachedResult;
  }
}

export const dataApiHealthCheck = new DataApiHealthService();
