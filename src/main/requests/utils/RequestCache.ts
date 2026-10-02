import { AxiosRequestConfig } from 'axios';

type CachePolicy = 'reference' | 'admin';

type CacheEntry = {
  expiresAt: number;
  // Store the promise so concurrent callers can share an in-flight request.
  response: Promise<unknown>;
};

const MAX_CACHE_ENTRIES = 1_000;

class RequestCache {
  private readonly cache = new Map<string, CacheEntry>();
  // Caching is opt-in: each policy remains disabled until assigned a positive TTL.
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
    cached?: Promise<T>;
    isValid: boolean;
  } {
    // Requests without an enabled policy always bypass the cache.
    if (!cachePolicy || this.cacheTtlMs[cachePolicy] <= 0) {
      return { isValid: false };
    }

    const cacheKey = this.createCacheKey(cachePolicy, url, config);
    const cached = this.cache.get(cacheKey);

    // A valid hit returns the shared response promise, including any request still in flight.
    if (cached && Date.now() < cached.expiresAt) {
      return { cached: cached.response as Promise<T>, isValid: true };
    }

    // Remove an expired entry when it is encountered during lookup.
    if (cached) {
      this.cache.delete(cacheKey);
    }

    // A miss or expired entry returns no cached value.
    return { isValid: false };
  }

  set(url: string, config: AxiosRequestConfig, cachePolicy: CachePolicy, response: Promise<unknown>): void {
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

  invalidate(url: string, config: AxiosRequestConfig, cachePolicy: CachePolicy, response?: Promise<unknown>): void {
    const cacheKey = this.createCacheKey(cachePolicy, url, config);
    // Promise identity prevents an older request from removing a newer entry for the same key.
    if (response === undefined || this.cache.get(cacheKey)?.response === response) {
      this.cache.delete(cacheKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private createCacheKey(cachePolicy: CachePolicy, url: string, config: AxiosRequestConfig): string {
    const params = config.params as Record<string, unknown> | undefined;
    // Canonicalise parameter order so equivalent query objects produce the same key.
    const sortedParams = params
      ? Object.fromEntries(Object.entries(params).sort(([left], [right]) => left.localeCompare(right)))
      : {};
    return `${cachePolicy}:${url}:${JSON.stringify(sortedParams)}`;
  }

  private evictOldestEntryIfFull(cacheKey: string): void {
    if (this.cache.size < MAX_CACHE_ENTRIES || this.cache.has(cacheKey)) {
      return;
    }

    // Map iteration order is insertion order, giving a simple FIFO size bound.
    const oldestKey = this.cache.keys().next().value;
    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
    }
  }
}

// Singleton instance
const requestCache = new RequestCache();

export { requestCache, type CachePolicy };
