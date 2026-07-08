import { env } from '../helpers/nunjucksEnv';

const i18n = require('../../../../main/locales/en/court.json');

describe('Information for professionals macro', () => {
  test('renders court codes and DX codes', () => {
    const template = `
      {% from "components/information-for-professionals.njk" import informationForProfessionals %}
      {{ informationForProfessionals(courtCodes, courtProfessionalInformation, courtDxCodes, courtFaxNumbers, infoText, language) }}
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
      language: 'en',
    });

    expect(html).toContain(i18n.informationForProfessionals.courtCodes.crownCourtCode);
    expect(html).toContain('123');
    expect(html).toContain('DX 1');
  });

  test('renders scheme unavailable states and fax details when optional fields are absent', () => {
    const template = `
      {% from "components/information-for-professionals.njk" import informationForProfessionals %}
      {{ informationForProfessionals(courtCodes, courtProfessionalInformation, courtDxCodes, courtFaxNumbers, infoText, language) }}
    `;

    const html = env.renderString(template, {
      infoText: i18n.informationForProfessionals,
      courtCodes: [
        {
          crownCourtCode: null,
          magistrateCourtCode: null,
          countyCourtCode: null,
          familyCourtCode: null,
          tribunalCode: null,
          gbs: null,
        },
      ],
      courtDxCodes: [],
      courtFaxNumbers: [{ faxNumber: '0118 000 0000', description: 'Main fax' }],
      courtProfessionalInformation: [
        {
          interviewRooms: false,
          interviewRoomCount: null,
          interviewPhoneNumber: null,
          videoHearings: false,
          commonPlatform: false,
          accessScheme: false,
        },
      ],
      language: 'en',
    });

    expect(html).toContain(i18n.informationForProfessionals.faxNumber);
    expect(html).toContain('0118 000 0000');
    expect(html).toContain('Main fax');
    expect(html).toContain(i18n.informationForProfessionals.commonPlatform);
    expect(html).toContain(i18n.informationForProfessionals.accessScheme);
    expect(html).toContain(i18n.informationForProfessionals.schemeNotAvailable);
    expect(html).toContain(i18n.informationForProfessionals.interviewRooms);
    expect(html).toContain(i18n.informationForProfessionals.interviewRoomsUnavailable);
    expect(html).toContain(i18n.informationForProfessionals.videoHearing);
    expect(html).toContain(i18n.informationForProfessionals.videoHearingUnavailable);
    expect(html).not.toContain(i18n.informationForProfessionals.videoHearingBody);
  });

  test('renders explanationCy and descriptionCy when Welsh is selected', () => {
    const template = `
      {% from "components/information-for-professionals.njk" import informationForProfessionals %}
      {{ informationForProfessionals(courtCodes, courtProfessionalInformation, courtDxCodes, courtFaxNumbers, infoText, language) }}
    `;

    const html = env.renderString(template, {
      infoText: i18n.informationForProfessionals,
      courtCodes: [],
      courtDxCodes: [
        {
          dxCode: 'DX 1',
          explanation: 'English explanation',
          explanationCy: 'Esboniad Cymraeg',
        },
      ],
      courtFaxNumbers: [
        {
          faxNumber: '0118 000 0000',
          description: 'English fax description',
          descriptionCy: 'Disgrifiad ffacs Cymraeg',
        },
      ],
      courtProfessionalInformation: [],
      language: 'cy',
    });

    expect(html).toContain('Esboniad Cymraeg');
    expect(html).toContain('Disgrifiad ffacs Cymraeg');
    expect(html).not.toContain('English explanation');
    expect(html).not.toContain('English fax description');
  });

  test('falls back to English explanation and description when Welsh values are unavailable', () => {
    const template = `
      {% from "components/information-for-professionals.njk" import informationForProfessionals %}
      {{ informationForProfessionals(courtCodes, courtProfessionalInformation, courtDxCodes, courtFaxNumbers, infoText, language) }}
    `;

    const html = env.renderString(template, {
      infoText: i18n.informationForProfessionals,
      courtCodes: [],
      courtDxCodes: [
        {
          dxCode: 'DX 1',
          explanation: 'English explanation',
          explanationCy: '   ',
        },
      ],
      courtFaxNumbers: [
        {
          faxNumber: '0118 000 0000',
          description: 'English fax description',
          descriptionCy: null,
        },
      ],
      courtProfessionalInformation: [],
      language: 'cy',
    });

    expect(html).toContain('English explanation');
    expect(html).toContain('English fax description');
  });
});
