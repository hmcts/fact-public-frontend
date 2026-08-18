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

  test('returns scottishChildrenPostcode for Scottish postcode in childcare service area', () => {
    expect(checkPostcode('G2 8GT', 'childcare-arrangements-if-you-separate-from-your-partner')).toBe(
      'scottishChildrenPostcode'
    );
  });

  test('accepts Scottish postcode for allowed service areas', () => {
    expect(checkPostcode('PH2 0RJ', 'benefits')).toBeUndefined();
    expect(isValidPostcode('PH2 0RJ', 'claims-against-employers')).toBe(true);
    expect(isValidPostcode('PH2 0RJ', 'immigration')).toBe(true);
  });

  test('returns scotlandPostcode for Scottish postcode outside allowed service areas', () => {
    expect(checkPostcode('PH2 0RJ', 'tax')).toBe('scotlandPostcode');
  });
});
