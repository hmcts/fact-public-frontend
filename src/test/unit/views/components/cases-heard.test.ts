import { env } from '../helpers/nunjucksEnv';

const welshI18n = require('../../../../main/locales/cy/court.json');
const i18n = require('../../../../main/locales/en/court.json');

describe('Cases heard macro', () => {
  test('renders sorted list with external links and opens-in-new-tab text', () => {
    const template = `
      {% from "components/cases-heard.njk" import casesHeard %}
      {{ casesHeard(courtAreasOfLaw, casesHeardText, language) }}
    `;

    const html = env.renderString(template, {
      language: 'en',
      casesHeardText: i18n.casesHeard,
      courtAreasOfLaw: [
        {
          areasOfLaw: [
            {
              name: 'Zeta',
              nameCy: 'Zeta',
              displayName: null,
              displayNameCy: null,
              externalLink: 'https://z.example',
              externalLinkCy: null,
            },
            {
              name: 'Alpha',
              nameCy: 'Alpha',
              displayName: 'Alpha Display',
              displayNameCy: null,
              externalLink: null,
              externalLinkCy: null,
            },
          ],
        },
      ],
    });

    expect(html).toContain(i18n.casesHeard.intro);
    expect(html).toContain('Alpha Display');
    expect(html).toContain(`Zeta ${i18n.casesHeard.opensInNewTab}`);
    expect(html).toContain('href="https://z.example"');
  });

  test('uses Welsh fields with fallback to English', () => {
    const template = `
      {% from "components/cases-heard.njk" import casesHeard %}
      {{ casesHeard(courtAreasOfLaw, casesHeardText, language) }}
    `;

    const html = env.renderString(template, {
      language: 'cy',
      casesHeardText: welshI18n.casesHeard,
      courtAreasOfLaw: [
        {
          areasOfLaw: [
            {
              name: 'English Name',
              nameCy: '',
              displayName: null,
              displayNameCy: '',
              externalLink: 'https://en.example',
              externalLinkCy: null,
            },
          ],
        },
      ],
    });

    expect(html).toContain('English Name');
    expect(html).toContain('href="https://en.example"');
  });
});
