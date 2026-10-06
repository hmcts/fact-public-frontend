import { AxiosResponse } from 'axios';

import { requestCache } from '../../../../main/requests/utils/RequestCache';

describe('RequestCache', () => {
  const mockResponse: AxiosResponse<unknown> = {
    data: { test: 'data' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as AxiosResponse['config'],
  };

  afterEach(() => {
    jest.useRealTimers();
    requestCache.clear();
    requestCache.setCacheTtl('admin', 0);
    requestCache.setCacheTtl('reference', 0);
  });

  describe('setCacheTtl', () => {
    it('sets TTL for admin cache policy', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      requestCache.set('/test', {}, 'admin', Promise.resolve(mockResponse));

      jest.advanceTimersByTime(4999);
      expect(requestCache.get('/test', {}, 'admin').isValid).toBe(true);

      jest.advanceTimersByTime(1);
      expect(requestCache.get('/test', {}, 'admin').isValid).toBe(false);
    });

    it('sets TTL for reference cache policy', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('reference', 10000);
      requestCache.set('/test', {}, 'reference', Promise.resolve(mockResponse));

      jest.advanceTimersByTime(9999);
      expect(requestCache.get('/test', {}, 'reference').isValid).toBe(true);

      jest.advanceTimersByTime(1);
      expect(requestCache.get('/test', {}, 'reference').isValid).toBe(false);
    });
  });

  describe('get', () => {
    it('returns isValid: false when no cache policy is provided', () => {
      const result = requestCache.get('/test', {}, undefined);
      expect(result.isValid).toBe(false);
      expect(result.cached).toBeUndefined();
    });

    it('returns isValid: false when cache TTL is 0 or negative', () => {
      requestCache.setCacheTtl('admin', 0);
      const result = requestCache.get('/test', {}, 'admin');
      expect(result.isValid).toBe(false);
    });

    it('returns isValid: false when entry does not exist', () => {
      requestCache.setCacheTtl('admin', 5000);
      const result = requestCache.get('/test', {}, 'admin');
      expect(result.isValid).toBe(false);
      expect(result.cached).toBeUndefined();
    });

    it('returns cached entry when it exists and is not expired', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      const responsePromise = Promise.resolve(mockResponse);
      requestCache.set('/test', {}, 'admin', responsePromise);

      const result = requestCache.get('/test', {}, 'admin');
      expect(result.isValid).toBe(true);
      expect(result.cached).toBe(responsePromise);

      jest.useRealTimers();
    });

    it('returns isValid: false and deletes entry when it has expired', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      const responsePromise = Promise.resolve(mockResponse);
      requestCache.set('/test', {}, 'admin', responsePromise);

      // Entries expire at the exact TTL boundary.
      jest.advanceTimersByTime(5000);

      const result = requestCache.get('/test', {}, 'admin');
      expect(result.isValid).toBe(false);
      expect(result.cached).toBeUndefined();

      jest.useRealTimers();
    });

    it('differentiates cache entries by URL', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      const response1 = Promise.resolve({ ...mockResponse, data: { test: 'data1' } });
      const response2 = Promise.resolve({ ...mockResponse, data: { test: 'data2' } });

      requestCache.set('/url1', {}, 'admin', response1);
      requestCache.set('/url2', {}, 'admin', response2);

      const result1 = requestCache.get('/url1', {}, 'admin');
      const result2 = requestCache.get('/url2', {}, 'admin');

      expect(result1.isValid).toBe(true);
      expect(result1.cached).toBe(response1);
      expect(result2.isValid).toBe(true);
      expect(result2.cached).toBe(response2);

      jest.useRealTimers();
    });

    it('differentiates cache entries by cache policy', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      requestCache.setCacheTtl('reference', 10000);
      const adminResponse = Promise.resolve({ ...mockResponse, data: { test: 'admin' } });
      const refResponse = Promise.resolve({ ...mockResponse, data: { test: 'reference' } });

      requestCache.set('/test', {}, 'admin', adminResponse);
      requestCache.set('/test', {}, 'reference', refResponse);

      const adminResult = requestCache.get('/test', {}, 'admin');
      const refResult = requestCache.get('/test', {}, 'reference');

      expect(adminResult.isValid).toBe(true);
      expect(adminResult.cached).toBe(adminResponse);
      expect(refResult.isValid).toBe(true);
      expect(refResult.cached).toBe(refResponse);

      jest.useRealTimers();
    });

    it('creates distinct cache keys for different query parameters', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      const response1 = Promise.resolve({ ...mockResponse, data: { test: 'params1' } });
      const response2 = Promise.resolve({ ...mockResponse, data: { test: 'params2' } });

      requestCache.set('/search', { params: { q: 'apple' } }, 'admin', response1);
      requestCache.set('/search', { params: { q: 'banana' } }, 'admin', response2);

      const result1 = requestCache.get('/search', { params: { q: 'apple' } }, 'admin');
      const result2 = requestCache.get('/search', { params: { q: 'banana' } }, 'admin');

      expect(result1.isValid).toBe(true);
      expect(result1.cached).toBe(response1);
      expect(result2.isValid).toBe(true);
      expect(result2.cached).toBe(response2);

      jest.useRealTimers();
    });

    it('sorts query parameters to ensure consistent cache keys', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      const response = Promise.resolve(mockResponse);

      // Set with params in one order
      requestCache.set('/search', { params: { a: '1', b: '2', c: '3' } }, 'admin', response);

      // Get with params in different order
      const result = requestCache.get('/search', { params: { c: '3', a: '1', b: '2' } }, 'admin');

      expect(result.isValid).toBe(true);
      expect(result.cached).toBe(response);

      jest.useRealTimers();
    });
  });

  describe('set', () => {
    it('stores a cache entry with correct expiration', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      const responsePromise = Promise.resolve(mockResponse);

      requestCache.set('/test', {}, 'admin', responsePromise);

      const result = requestCache.get('/test', {}, 'admin');
      expect(result.isValid).toBe(true);
      expect(result.cached).toBe(responsePromise);

      jest.useRealTimers();
    });

    it('does not cache when TTL is not set (0)', () => {
      requestCache.setCacheTtl('admin', 0);
      const responsePromise = Promise.resolve(mockResponse);

      requestCache.set('/test', {}, 'admin', responsePromise);

      const result = requestCache.get('/test', {}, 'admin');
      expect(result.isValid).toBe(false);
    });

    it('does not cache when TTL is negative', () => {
      requestCache.setCacheTtl('admin', -1000);
      const responsePromise = Promise.resolve(mockResponse);

      requestCache.set('/test', {}, 'admin', responsePromise);

      const result = requestCache.get('/test', {}, 'admin');
      expect(result.isValid).toBe(false);
    });

    it('overwrites existing entries with the same cache key', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      const oldResponse = Promise.resolve({ ...mockResponse, data: { test: 'old' } });
      const newResponse = Promise.resolve({ ...mockResponse, data: { test: 'new' } });

      requestCache.set('/test', {}, 'admin', oldResponse);
      let result = requestCache.get('/test', {}, 'admin');
      expect(result.cached).toBe(oldResponse);

      requestCache.set('/test', {}, 'admin', newResponse);
      result = requestCache.get('/test', {}, 'admin');
      expect(result.cached).toBe(newResponse);

      jest.useRealTimers();
    });

    it('evicts the oldest entry when cache exceeds max size', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 10000);

      // Set 1001 entries (MAX_CACHE_ENTRIES is 1000)
      for (let i = 0; i < 1001; i++) {
        const response = Promise.resolve({ ...mockResponse, data: { index: i } });
        requestCache.set(`/url${i}`, {}, 'admin', response);
      }

      // The first entry (url0) should have been evicted
      const result0 = requestCache.get('/url0', {}, 'admin');
      expect(result0.isValid).toBe(false);

      // The last entry (url1000) should still be there
      const result1000 = requestCache.get('/url1000', {}, 'admin');
      expect(result1000.isValid).toBe(true);

      jest.useRealTimers();
    });

    it('does not evict another entry when overwriting at max size', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 10000);

      for (let i = 0; i < 1000; i++) {
        requestCache.set(`/url${i}`, {}, 'admin', Promise.resolve({ ...mockResponse, data: { index: i } }));
      }

      const replacement = Promise.resolve({ ...mockResponse, data: { index: 'replacement' } });
      requestCache.set('/url999', {}, 'admin', replacement);

      expect(requestCache.get('/url0', {}, 'admin').isValid).toBe(true);
      expect(requestCache.get('/url999', {}, 'admin').cached).toBe(replacement);
    });
  });

  describe('invalidate', () => {
    it('removes a cached entry', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      const responsePromise = Promise.resolve(mockResponse);

      requestCache.set('/test', {}, 'admin', responsePromise);
      let result = requestCache.get('/test', {}, 'admin');
      expect(result.isValid).toBe(true);

      requestCache.invalidate('/test', {}, 'admin');
      result = requestCache.get('/test', {}, 'admin');
      expect(result.isValid).toBe(false);

      jest.useRealTimers();
    });

    it('only invalidates the specific cache entry', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      const response1 = Promise.resolve({ ...mockResponse, data: { test: 'data1' } });
      const response2 = Promise.resolve({ ...mockResponse, data: { test: 'data2' } });

      requestCache.set('/url1', {}, 'admin', response1);
      requestCache.set('/url2', {}, 'admin', response2);

      requestCache.invalidate('/url1', {}, 'admin');

      const result1 = requestCache.get('/url1', {}, 'admin');
      const result2 = requestCache.get('/url2', {}, 'admin');

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(true);

      jest.useRealTimers();
    });

    it('does not affect entries with different cache policies', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      requestCache.setCacheTtl('reference', 10000);
      const adminResponse = Promise.resolve({ ...mockResponse, data: { test: 'admin' } });
      const refResponse = Promise.resolve({ ...mockResponse, data: { test: 'reference' } });

      requestCache.set('/test', {}, 'admin', adminResponse);
      requestCache.set('/test', {}, 'reference', refResponse);

      requestCache.invalidate('/test', {}, 'admin');

      const adminResult = requestCache.get('/test', {}, 'admin');
      const refResult = requestCache.get('/test', {}, 'reference');

      expect(adminResult.isValid).toBe(false);
      expect(refResult.isValid).toBe(true);

      jest.useRealTimers();
    });

    it('invalidates entries with query parameters using sorted keys', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      const response = Promise.resolve(mockResponse);

      // Set with params in one order
      requestCache.set('/search', { params: { a: '1', b: '2' } }, 'admin', response);

      // Invalidate with params in different order
      requestCache.invalidate('/search', { params: { b: '2', a: '1' } }, 'admin');

      // Entry should be invalidated
      const result = requestCache.get('/search', { params: { a: '1', b: '2' } }, 'admin');
      expect(result.isValid).toBe(false);

      jest.useRealTimers();
    });

    it('does not invalidate a replacement response when an older request fails', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      const oldResponse = Promise.resolve({ ...mockResponse, data: { test: 'old' } });
      const replacementResponse = Promise.resolve({ ...mockResponse, data: { test: 'replacement' } });

      requestCache.set('/test', {}, 'admin', oldResponse);
      requestCache.set('/test', {}, 'admin', replacementResponse);
      requestCache.invalidate('/test', {}, 'admin', oldResponse);

      const result = requestCache.get('/test', {}, 'admin');
      expect(result.isValid).toBe(true);
      expect(result.cached).toBe(replacementResponse);
    });
  });

  describe('clear', () => {
    it('removes all cache entries', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);
      requestCache.setCacheTtl('reference', 10000);

      const response1 = Promise.resolve({ ...mockResponse, data: { test: 'data1' } });
      const response2 = Promise.resolve({ ...mockResponse, data: { test: 'data2' } });
      const response3 = Promise.resolve({ ...mockResponse, data: { test: 'data3' } });

      requestCache.set('/url1', {}, 'admin', response1);
      requestCache.set('/url2', {}, 'admin', response2);
      requestCache.set('/url3', {}, 'reference', response3);

      // Verify entries exist
      expect(requestCache.get('/url1', {}, 'admin').isValid).toBe(true);
      expect(requestCache.get('/url2', {}, 'admin').isValid).toBe(true);
      expect(requestCache.get('/url3', {}, 'reference').isValid).toBe(true);

      requestCache.clear();

      // All entries should be cleared
      expect(requestCache.get('/url1', {}, 'admin').isValid).toBe(false);
      expect(requestCache.get('/url2', {}, 'admin').isValid).toBe(false);
      expect(requestCache.get('/url3', {}, 'reference').isValid).toBe(false);

      jest.useRealTimers();
    });

    it('can re-populate cache after being cleared', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);

      const response1 = Promise.resolve({ ...mockResponse, data: { test: 'data1' } });
      requestCache.set('/test', {}, 'admin', response1);
      expect(requestCache.get('/test', {}, 'admin').isValid).toBe(true);

      requestCache.clear();
      expect(requestCache.get('/test', {}, 'admin').isValid).toBe(false);

      const response2 = Promise.resolve({ ...mockResponse, data: { test: 'data2' } });
      requestCache.set('/test', {}, 'admin', response2);
      expect(requestCache.get('/test', {}, 'admin').isValid).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('singleton behavior', () => {
    it('exports the same defined cache instance from repeated imports', async () => {
      const firstModule = await import('../../../../main/requests/utils/RequestCache');
      const secondModule = await import('../../../../main/requests/utils/RequestCache');

      expect(firstModule.requestCache).toBeDefined();
      expect(firstModule.requestCache).toBe(requestCache);
      expect(secondModule.requestCache).toBe(requestCache);
    });
  });

  describe('integration scenarios', () => {
    it('maintains separate TTLs for admin and reference policies', () => {
      jest.useFakeTimers();
      const adminTtl = 5000;
      const referenceTtl = 10000;

      requestCache.setCacheTtl('admin', adminTtl);
      requestCache.setCacheTtl('reference', referenceTtl);

      const adminResponse = Promise.resolve({ ...mockResponse, data: { test: 'admin' } });
      const refResponse = Promise.resolve({ ...mockResponse, data: { test: 'reference' } });

      requestCache.set('/test', {}, 'admin', adminResponse);
      requestCache.set('/test', {}, 'reference', refResponse);

      // At 4999ms, both should be valid
      jest.advanceTimersByTime(4999);
      expect(requestCache.get('/test', {}, 'admin').isValid).toBe(true);
      expect(requestCache.get('/test', {}, 'reference').isValid).toBe(true);

      // At 5001ms, admin should expire but reference should still be valid
      jest.advanceTimersByTime(2);
      expect(requestCache.get('/test', {}, 'admin').isValid).toBe(false);
      expect(requestCache.get('/test', {}, 'reference').isValid).toBe(true);

      // At 10001ms, both should be expired
      jest.advanceTimersByTime(5000);
      expect(requestCache.get('/test', {}, 'admin').isValid).toBe(false);
      expect(requestCache.get('/test', {}, 'reference').isValid).toBe(false);

      jest.useRealTimers();
    });

    it('returns the shared response promise to concurrent consumers', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);

      const responsePromise = new Promise<AxiosResponse<unknown>>(() => undefined);

      requestCache.set('/test', {}, 'admin', responsePromise);

      const cachedResult1 = requestCache.get('/test', {}, 'admin');
      const cachedResult2 = requestCache.get('/test', {}, 'admin');

      // Both should reference the same promise
      expect(cachedResult1.isValid).toBe(true);
      expect(cachedResult2.isValid).toBe(true);
      expect(cachedResult1.cached).toBe(responsePromise);
      expect(cachedResult1.cached).toBe(cachedResult2.cached);
    });

    it('handles empty config params correctly', () => {
      jest.useFakeTimers();
      requestCache.setCacheTtl('admin', 5000);

      const response1 = Promise.resolve(mockResponse);
      const response2 = Promise.resolve(mockResponse);

      requestCache.set('/test', {}, 'admin', response1);
      requestCache.set('/test', { params: {} }, 'admin', response2);

      // Both empty config and empty params should result in same cache key
      const result1 = requestCache.get('/test', {}, 'admin');
      expect(result1.isValid).toBe(true);
      expect(result1.cached).toBe(response2); // Should get the second one set

      jest.useRealTimers();
    });
  });
});
