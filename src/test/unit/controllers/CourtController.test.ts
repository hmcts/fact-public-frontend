import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import CourtController from '../../../main/controllers/CourtController';
import { FactRequest } from '../../../main/interfaces/FactRequest';
import { Court } from '../../../main/schemas/courtSchema';
import { CourtViewModel } from '../../../main/services/CourtService';
import { mockRequest } from '../mocks/mockRequest';

jest.mock('../../../main/requests/DataApiRequests', () => {
  const dataApiMock = {
    getCourtDetails: jest.fn(),
  };
  return {
    __dataApiMock: dataApiMock,
    DataApiRequests: jest.fn().mockImplementation(() => dataApiMock),
  };
});

jest.mock('../../../main/services/CourtService', () => {
  const courtServiceMock = {
    formatData: jest.fn(),
  };
  return {
    __courtServiceMock: courtServiceMock,
    CourtService: jest.fn().mockImplementation(() => courtServiceMock),
  };
});

const getMocks = () => {
  const dataApiModule = require('../../../main/requests/DataApiRequests') as {
    __dataApiMock: { getCourtDetails: jest.Mock };
  };
  const courtServiceModule = require('../../../main/services/CourtService') as {
    __courtServiceMock: { formatData: jest.Mock };
  };
  return {
    dataApiMock: dataApiModule.__dataApiMock,
    courtServiceMock: courtServiceModule.__courtServiceMock,
  };
};

const buildCourt = (overrides: Partial<Court> = {}): Court => ({
  id: '1',
  name: 'Test Court',
  slug: 'test-court',
  open: true,
  warningNotice: null,
  lastUpdatedAt: '2024-01-01T00:00:00.000Z',
  openOnCath: null,
  mrdId: null,
  region: { name: 'Region', country: 'Country' },
  courtDxCodes: [],
  courtCodes: [],
  courtFaxNumbers: [],
  courtAddresses: [],
  courtOpeningHours: [],
  courtCounterServiceOpeningHours: [],
  courtContactDetails: [],
  courtTranslations: [],
  courtAccessibilityOptions: [],
  courtFacilities: [],
  courtProfessionalInformation: [],
  courtAreasOfLaw: [],
  courtPhotos: [],
  ...overrides,
});

describe('CourtController', () => {
  beforeEach(() => {
    const { dataApiMock, courtServiceMock } = getMocks();
    dataApiMock.getCourtDetails.mockReset();
    courtServiceMock.formatData.mockReset();
  });

  describe('get', () => {
    test('renders not-found on 404', async () => {
      const controller = new CourtController();
      const req = mockRequest({ 'not-found': { heading: 'Not found' } });
      req.params.slug = 'missing-court';
      const res = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      } as unknown as Response;

      const { dataApiMock } = getMocks();
      dataApiMock.getCourtDetails.mockResolvedValue(HttpStatusCode.NotFound);

      await controller.get(req, res);

      expect(dataApiMock.getCourtDetails).toHaveBeenCalledWith('missing-court');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.render).toHaveBeenCalledWith('not-found', { heading: 'Not found' });
    });

    test('renders court-closed with interpolated title when court is closed', async () => {
      const controller = new CourtController();
      const req = mockRequest({
        'court-closed': { title: '{name} - Find a Court or Tribunal - GOV.UK', p1: 'Closed' },
      });
      req.params.slug = 'closed-court';
      const res = { render: jest.fn() } as unknown as Response;

      const closedCourt = buildCourt({ name: 'Closed Court', slug: 'closed-court', open: false });
      const viewModel = {
        ...closedCourt,
        openingHoursByType: [],
        enquiriesPhoneNumber: null,
        counterService: null,
      } as CourtViewModel;
      const { dataApiMock, courtServiceMock } = getMocks();
      dataApiMock.getCourtDetails.mockResolvedValue(closedCourt);
      courtServiceMock.formatData.mockReturnValue(viewModel);

      await controller.get(req, res);

      expect(courtServiceMock.formatData).toHaveBeenCalledWith(closedCourt, 'en');
      expect(res.render).toHaveBeenCalledWith('court-closed', {
        title: 'Closed Court - Find a Court or Tribunal - GOV.UK',
        p1: 'Closed',
        name: 'Closed Court',
      });
    });

    test('renders court page when court is open', async () => {
      const controller = new CourtController();
      const req = mockRequest({
        court: { pageTitleSuffix: 'Find a Court or Tribunal - GOV.UK' },
      });
      req.params.slug = 'open-court';
      const res = { render: jest.fn() } as unknown as Response;

      const openCourt = buildCourt({ name: 'Open Court', slug: 'open-court', open: true });
      const viewModel = {
        ...openCourt,
        openingHoursByType: [],
        enquiriesPhoneNumber: null,
        counterService: null,
      } as CourtViewModel;
      const { dataApiMock, courtServiceMock } = getMocks();
      dataApiMock.getCourtDetails.mockResolvedValue(openCourt);
      courtServiceMock.formatData.mockReturnValue(viewModel);

      await controller.get(req, res);

      expect(dataApiMock.getCourtDetails).toHaveBeenCalledWith('open-court');
      expect(courtServiceMock.formatData).toHaveBeenCalledWith(openCourt, 'en');
      expect(res.render).toHaveBeenCalledWith('court', {
        pageTitleSuffix: 'Find a Court or Tribunal - GOV.UK',
        court: viewModel,
      });
    });
  });

  describe('getJson', () => {
    test('returns court JSON when successful', async () => {
      const controller = new CourtController();
      const req = {
        params: { slug: 'test-court' },
      } as unknown as FactRequest;
      const res = {
        json: jest.fn(),
      } as unknown as Response;
      const court = buildCourt({ slug: 'test-court' });

      const { dataApiMock } = getMocks();
      dataApiMock.getCourtDetails.mockResolvedValue(court);

      await controller.getJson(req, res);

      expect(dataApiMock.getCourtDetails).toHaveBeenCalledWith('test-court');
      expect(res.json).toHaveBeenCalledWith(court);
    });

    test('renders not-found on JSON route when court is not found', async () => {
      const controller = new CourtController();
      const req = {
        params: { slug: 'unknown-court' },
        lng: 'en',
        i18n: {
          getDataByLanguage: jest.fn().mockReturnValue({ notFound: { heading: 'Not found JSON' } }),
        },
      } as unknown as FactRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      } as unknown as Response;

      const { dataApiMock } = getMocks();
      dataApiMock.getCourtDetails.mockResolvedValue(HttpStatusCode.NotFound);

      await controller.getJson(req, res);

      expect(dataApiMock.getCourtDetails).toHaveBeenCalledWith('unknown-court');
      expect(req.i18n.getDataByLanguage).toHaveBeenCalledWith('en');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.render).toHaveBeenCalledWith('not-found', { heading: 'Not found JSON' });
    });

    test('returns raw non-404 API status on JSON route', async () => {
      const controller = new CourtController();
      const req = {
        params: { slug: 'errored-court' },
      } as unknown as FactRequest;
      const res = {
        json: jest.fn(),
      } as unknown as Response;

      const { dataApiMock } = getMocks();
      dataApiMock.getCourtDetails.mockResolvedValue(HttpStatusCode.BadGateway);

      await controller.getJson(req, res);

      expect(res.json).toHaveBeenCalledWith(HttpStatusCode.BadGateway);
    });
  });
});
