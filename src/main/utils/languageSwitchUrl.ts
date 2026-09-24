export type SupportedLanguage = 'en' | 'cy';

const RETAIN_PARAMS = new Set(['search', 'postcode', 'prefix', 'lng']);

// just for defense in depth
const DROP_PARAMS = new Set([
  'token',
  'auth',
  'code',
  'state',
  'session',
  'csrf',
  'returnUrl',
  'redirect',
  '_ga',
  '_gl',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'error',
  'success',
  'flash',
]);

function shouldRetainParam(key: string): boolean {
  if (DROP_PARAMS.has(key)) {
    return false;
  }
  return RETAIN_PARAMS.has(key);
}

export function buildLanguageSwitchUrl(
  currentPath: string,
  query: URLSearchParams,
  targetLanguage: SupportedLanguage
): string {
  const output = new URLSearchParams();

  for (const [key, value] of query.entries()) {
    if (shouldRetainParam(key)) {
      output.append(key, value);
    }
  }

  // Explicitly replace language while preserving approved state params.
  output.set('lng', targetLanguage);

  const qs = output.toString();
  return qs ? `${currentPath}?${qs}` : currentPath;
}
