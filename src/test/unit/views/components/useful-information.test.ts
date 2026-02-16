import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/court.json');

describe('Useful information macro', () => {
  test('renders useful information links with opens-in-new-tab text', () => {
    const template = `
      {% from "components/useful-information.njk" import usefulInformation %}
      {{ usefulInformation(usefulInformationText) }}
    `;

    const html = env.renderString(template, {
      usefulInformationText: i18n.usefulInformation,
    });

    expect(html).toContain(i18n.usefulInformation.mainHeading);
    expect(html).toContain(i18n.usefulInformation.comingToCourtUrlText);
    expect(html).toContain(i18n.usefulInformation.opensInNewTab);
  });
});
