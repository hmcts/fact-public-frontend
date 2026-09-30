import { describe, expect, test } from '@jest/globals';

import { checkPostcode } from '../../../main/utils/validationUtils';

describe('validationUtils', () => {
  test('returns blankPostcode when postcode is missing or whitespace only', () => {
    expect(checkPostcode('')).toBe('blankPostcode');
    expect(checkPostcode('   ')).toBe('blankPostcode');
  });

  test('returns blankPostcode for non-string boundary input', () => {
    expect(checkPostcode(undefined)).toBe('blankPostcode');
    expect(checkPostcode(null)).toBe('blankPostcode');
    expect(checkPostcode(['SW1A 1AA'])).toBe('blankPostcode');
    expect(checkPostcode({ postcode: 'SW1A 1AA' })).toBe('blankPostcode');
  });

  test('returns missingPostcodeSpace when postcode is valid except for the required space', () => {
    expect(checkPostcode('SW1A1AA')).toBe('missingPostcodeSpace');
  });

  test('accepts postcode when there is a space between outward and inward codes', () => {
    expect(checkPostcode('SW1A 1AA')).toBeUndefined();
  });

  test('accepts postcode with surrounding whitespace and mixed case (normalization)', () => {
    expect(checkPostcode(' sw1a 1aa ')).toBeUndefined();
  });

  test('returns invalidPostcode when postcode is not structurally valid', () => {
    expect(checkPostcode('not-a-postcode')).toBe('invalidPostcode');
  });

  test('returns invalidPostcode for bounded-length failures', () => {
    expect(checkPostcode('A1 1')).toBe('invalidPostcode'); // too short
    expect(checkPostcode('SW1A 1AA XX')).toBe('invalidPostcode'); // too long
  });

  test('returns scottishChildrenPostcode for Scottish postcode in childcare service area', () => {
    expect(checkPostcode('G2 8GT', 'childcare-arrangements-if-you-separate-from-your-partner')).toBe(
      'scottishChildrenPostcode'
    );
  });

  test('accepts Scottish postcode for allowed service areas', () => {
    expect(checkPostcode('PH2 0RJ', 'benefits')).toBeUndefined();
  });

  test('returns scotlandPostcode for Scottish postcode outside allowed service areas', () => {
    expect(checkPostcode('PH2 0RJ', 'tax')).toBe('scotlandPostcode');
  });

  test('returns jurisdiction-specific errors for unsupported regions', () => {
    expect(checkPostcode('BT1 1AA')).toBe('northernIrelandPostcode');
    expect(checkPostcode('GY1 1AA')).toBe('guernseyPostcode');
    expect(checkPostcode('JE1 1AA')).toBe('jerseyPostcode');
    expect(checkPostcode('IM1 1AA')).toBe('isleOfManPostcode');
  });
});
