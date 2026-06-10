import { describe, expect, test } from '@jest/globals';

import { checkPostcode, isValidPostcode } from '../../../main/utils/validationUtils';

describe('validationUtils', () => {
  test('returns missingPostcodeSpace when postcode is valid except for the required space', () => {
    expect(checkPostcode('SW1A1AA')).toBe('missingPostcodeSpace');
    expect(isValidPostcode('SW1A1AA')).toBe(false);
  });

  test('accepts postcode when there is a space between outward and inward codes', () => {
    expect(checkPostcode('SW1A 1AA')).toBeUndefined();
    expect(isValidPostcode('SW1A 1AA')).toBe(true);
  });

  test('returns invalidPostcode when postcode is not structurally valid', () => {
    expect(checkPostcode('not-a-postcode')).toBe('invalidPostcode');
  });
});
