import { fail } from 'assert';

import { describe, test } from '@jest/globals';
import axios, { AxiosResponse } from 'axios';
import { expect } from 'chai';

import home from '../../main/locales/en/home.json';

const testUrl = process.env.TEST_URL || 'https://localhost:3344';

describe('Smoke Test', () => {
  describe('Home page loads', () => {
    test('with correct content', async () => {
      try {
        const response: AxiosResponse = await axios.get(testUrl, {
          headers: {
            'Accept-Encoding': 'gzip',
          },
        });
        expect(response.data).includes('<h1 class="govuk-heading-xl">');
        expect(response.data).includes(home.pageTitle);
      } catch {
        fail('Heading not present and/or correct');
      }
    });
  });
});
