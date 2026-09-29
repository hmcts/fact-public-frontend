import { buildLanguageSwitchUrl } from '../../../main/utils/languageSwitchUrl';

describe('buildLanguageSwitchUrl', () => {
  test('preserves search and replaces lng', () => {
    const query = new URLSearchParams('search=cardiff&lng=en');
    const result = buildLanguageSwitchUrl('/search-by-location', query, 'cy');

    expect(result).toBe('/search-by-location?search=cardiff&lng=cy');
  });

  test('preserves postcode and replaces lng', () => {
    const query = new URLSearchParams('postcode=SW1A1AA&lng=cy');
    const result = buildLanguageSwitchUrl('/courts', query, 'en');

    expect(result).toBe('/courts?postcode=SW1A1AA&lng=en');
  });

  test('preserves prefix and replaces lng', () => {
    const query = new URLSearchParams('prefix=A&lng=en');
    const result = buildLanguageSwitchUrl('/courts/a-z', query, 'cy');

    expect(result).toBe('/courts/a-z?prefix=A&lng=cy');
  });

  test('drops transient params used for page state', () => {
    const query = new URLSearchParams('postcode=SW1A1AA&error=invalid&noResults=true&lng=en');
    const result = buildLanguageSwitchUrl('/postcode-search', query, 'cy');

    expect(result).toBe('/postcode-search?postcode=SW1A1AA&lng=cy');
  });

  test('drops sensitive/transient params (defense in depth)', () => {
    const query = new URLSearchParams('search=cardiff&token=secret&csrf=1&lng=en');
    const result = buildLanguageSwitchUrl('/search-by-location', query, 'cy');

    expect(result).toBe('/search-by-location?search=cardiff&lng=cy');
  });

  test('adds lng when query is empty', () => {
    const query = new URLSearchParams();
    const result = buildLanguageSwitchUrl('/search-by-location', query, 'cy');

    expect(result).toBe('/search-by-location?lng=cy');
  });

  test('retains repeated allowed params', () => {
    const query = new URLSearchParams('prefix=A&prefix=B&lng=en');
    const result = buildLanguageSwitchUrl('/courts/a-z', query, 'cy');

    expect(result).toBe('/courts/a-z?prefix=A&prefix=B&lng=cy');
  });
});
