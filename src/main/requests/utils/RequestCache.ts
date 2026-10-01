import { AxiosRequestConfig, AxiosResponse } from 'axios';

type CachePolicy = 'reference' | 'admin';

type CacheEntry = {
  expiresAt: number;
  response: Promise<AxiosResponse<unknown>>;
};

const MAX_CACHE_ENTRIES = 1_000;

class RequestCache {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs: Record<CachePolicy, number> = {
    reference: 0,
    admin: 0,
  };

  setCacheTtl(policy: CachePolicy, ttlMs: number): void {
    this.cacheTtlMs[policy] = ttlMs;
  }

  get<T>(
    url: string,
    config: AxiosRequestConfig = {},
    cachePolicy?: CachePolicy
  ): {
    cached?: Promise<AxiosResponse<T>>;
    isValid: boolean;
  } {
    if (!cachePolicy || this.cacheTtlMs[cachePolicy] <= 0) {
      return { isValid: false };
    }

    const cacheKey = this.createCacheKey(cachePolicy, url, config);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      return { cached: cached.response as Promise<AxiosResponse<T>>, isValid: true };
    }

    if (cached) {
      this.cache.delete(cacheKey);
    }

    return { isValid: false };
  }

  set(
    url: string,
    config: AxiosRequestConfig,
    cachePolicy: CachePolicy,
    response: Promise<AxiosResponse<unknown>>
  ): void {
    if (this.cacheTtlMs[cachePolicy] <= 0) {
      return;
    }

    const cacheKey = this.createCacheKey(cachePolicy, url, config);
    const entry: CacheEntry = {
      expiresAt: Date.now() + this.cacheTtlMs[cachePolicy],
      response,
    };

    this.evictOldestEntryIfFull(cacheKey);
    this.cache.set(cacheKey, entry);
  }

  invalidate(
    url: string,
    config: AxiosRequestConfig,
    cachePolicy: CachePolicy,
    response?: Promise<AxiosResponse<unknown>>
  ): void {
    const cacheKey = this.createCacheKey(cachePolicy, url, config);
    if (response === undefined || this.cache.get(cacheKey)?.response === response) {
      this.cache.delete(cacheKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private createCacheKey(cachePolicy: CachePolicy, url: string, config: AxiosRequestConfig): string {
    const params = config.params as Record<string, unknown> | undefined;
    const sortedParams = params
      ? Object.fromEntries(Object.entries(params).sort(([left], [right]) => left.localeCompare(right)))
      : {};
    return `${cachePolicy}:${url}:${JSON.stringify(sortedParams)}`;
  }

  private evictOldestEntryIfFull(cacheKey: string): void {
    if (this.cache.size < MAX_CACHE_ENTRIES || this.cache.has(cacheKey)) {
      return;
    }

    const oldestKey = this.cache.keys().next().value;
    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
    }
  }
}

// Singleton instance
const requestCache = new RequestCache();

export { requestCache, type CachePolicy };
