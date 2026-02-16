import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/court.json');

describe('Information for professionals macro', () => {
  test('renders court codes and DX codes', () => {
    const template = `
      {% from "components/information-for-professionals.njk" import informationForProfessionals %}
      {{ informationForProfessionals(courtCodes, courtProfessionalInformation, courtDxCodes, courtFaxNumbers, infoText) }}
    `;

    const html = env.renderString(template, {
      infoText: i18n.informationForProfessionals,
      courtCodes: [
        {
          crownCourtCode: 123,
          magistrateCourtCode: null,
          countyCourtCode: null,
          familyCourtCode: null,
          tribunalCode: null,
          gbs: null,
        },
      ],
      courtDxCodes: [{ dxCode: 'DX 1', explanation: 'DX expl' }],
      courtFaxNumbers: [],
      courtProfessionalInformation: [],
    });

    expect(html).toContain(i18n.informationForProfessionals.courtCodes.crownCourtCode);
    expect(html).toContain('123');
    expect(html).toContain('DX 1');
  });
});
