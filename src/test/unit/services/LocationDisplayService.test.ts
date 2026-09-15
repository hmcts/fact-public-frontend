import { LocationDisplayService } from '../../../main/services/LocationDisplayService';

describe('LocationDisplayService', () => {
  test('returns an empty string when timestamp is invalid', () => {
    const service = new LocationDisplayService();

    expect(service.formatLastUpdateDate('not-a-date', 'en')).toBe('');
  });

  test('returns an empty string when timestamp is blank', () => {
    const service = new LocationDisplayService();

    expect(service.formatLastUpdateDate('   ', 'en')).toBe('');
  });

  test('formats a valid timestamp using the requested language', () => {
    const service = new LocationDisplayService();

    expect(service.formatLastUpdateDate('2024-01-15T10:00:00.000Z', 'en')).toBe('15 January 2024');
  });
});
