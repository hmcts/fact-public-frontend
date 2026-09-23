import * as path from 'node:path';

import * as nunjucks from 'nunjucks';

const govukTemplates = path.dirname(require.resolve('govuk-frontend/package.json')) + '/dist';
const viewsPath = path.resolve(__dirname, '../../../../main/views');

export const env = nunjucks.configure([govukTemplates, viewsPath], {
  autoescape: true,
});

export const escapeHtml = (value: string): string => env.renderString('{{ value }}', { value });
