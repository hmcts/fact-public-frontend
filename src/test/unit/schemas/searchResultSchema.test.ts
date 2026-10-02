import { describe, expect, it } from '@jest/globals';

import { searchResultSchema } from '../../../main/schemas/searchResult';

describe('searchResultSchema', () => {
  const validResult = {
    id: 'acde070d-8c4c-4f0d-9d8a-162843c10333',
    name: 'A Court',
    slug: 'a-court',
    distance: 1.5,
    type: 'COURT',
  };

  it('accepts valid search result', () => {
    expect(searchResultSchema.safeParse(validResult).success).toBe(true);
  });

  it('accepts a distance of 0', () => {
    expect(searchResultSchema.safeParse({ ...validResult, distance: 0 }).success).toBe(true);
  });

  it('rejects negative distance', () => {
    expect(searchResultSchema.safeParse({ ...validResult, distance: -1 }).success).toBe(false);
  });

  it('rejects a non-UUID id', () => {
    expect(searchResultSchema.safeParse({ ...validResult, id: 'not-a-uuid' }).success).toBe(false);
  });

  it('rejects an invalid type', () => {
    expect(searchResultSchema.safeParse({ ...validResult, type: 'INVALID_TYPE' }).success).toBe(false);
  });
});
