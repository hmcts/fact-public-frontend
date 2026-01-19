/**
 * Configuration utilities for Playwright tests
 * Manages environment variables and test configuration
 */

export interface Config {
  urls: {
    baseUrl: string;
  };
}

/**
 * Get environment variable with optional fallback
 */
function getEnvVar(name: string, fallback = ''): string {
  return process.env[name] || fallback;
}

/**
 * Get required environment variable (throws if not set)
 */
export function requireEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Application configuration
 * Uses environment variables with sensible defaults
 */
export const config: Config = {
  urls: {
    baseUrl: getEnvVar('TEST_URL', 'http://localhost:3344'),
  },
};
