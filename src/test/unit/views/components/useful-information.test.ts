import { env } from '../helpers/nunjucksEnv';

const courtI18n = require('../../../../main/locales/en/court.json');
const serviceCentreI18n = require('../../../../main/locales/en/service-centre.json');

describe('Useful information macro', () => {
  test('renders useful information links with opens-in-new-tab text', () => {
    const template = `
      {% from "components/useful-information.njk" import usefulInformation %}
      {{ usefulInformation(usefulInformationText) }}
    `;

    const html = env.renderString(template, {
      usefulInformationText: courtI18n.usefulInformation,
    });

    expect(html).toContain(courtI18n.usefulInformation.mainHeading);
    expect(html).toContain(courtI18n.usefulInformation.comingToCourtUrlText);
    expect(html).toContain(courtI18n.usefulInformation.opensInNewTab);
  });

  test('can render only the scammers subsection', () => {
    const template = `
      {% from "components/useful-information.njk" import usefulInformation %}
      {{ usefulInformation(usefulInformationText, false) }}
    `;

    const html = env.renderString(template, {
      usefulInformationText: courtI18n.usefulInformation,
    });

    expect(html).toContain(courtI18n.usefulInformation.mainHeading);
    expect(html).toContain(courtI18n.usefulInformation.scammers);
    expect(html).not.toContain(courtI18n.usefulInformation.comingToCourt);
    expect(html).not.toContain(courtI18n.usefulInformation.hearingsAtThisCourt);
  });

  test('renders Bury additional message for Bury slug', () => {
    const template = `
    {% from "components/useful-information.njk" import usefulInformation %}
    {{ usefulInformation(usefulInformationText, false, serviceCentreSlug) }}
  `;

    const html = env.renderString(template, {
      usefulInformationText: serviceCentreI18n.usefulInformation,
      serviceCentreSlug: 'bury-st-edmunds-regional-divorce-centre',
    });

    expect(html).toContain(serviceCentreI18n.usefulInformation.scammers);
    expect(html).toContain(serviceCentreI18n.usefulInformation.buryStEdmundsAdditionalMessage.split('\n')[0]);
  });

  test('does not render Bury additional message for non-Bury slug', () => {
    const template = `
    {% from "components/useful-information.njk" import usefulInformation %}
    {{ usefulInformation(usefulInformationText, false, serviceCentreSlug) }}
  `;

    const html = env.renderString(template, {
      usefulInformationText: serviceCentreI18n.usefulInformation,
      serviceCentreSlug: 'other-centre',
    });

    expect(html).not.toContain(serviceCentreI18n.usefulInformation.buryStEdmundsAdditionalMessage.split('\n')[0]);
  });
});
