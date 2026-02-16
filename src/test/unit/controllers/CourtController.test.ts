/* eslint-disable jest/expect-expect */
import { HttpStatusCode } from 'axios';
import { Response } from 'express';
import { mock } from 'sinon';

import CourtController from '../../../main/controllers/CourtController';
import { Court } from '../../../main/schemas/courtSchema';
import { CourtViewModel } from '../../../main/services/CourtService';
import { mockRequest } from '../mocks/mockRequest';

jest.mock('../../../main/requests/DataApiRequests', () => {
  const dataApiMock = { getCourtDetails: jest.fn() };
  return {
    DataApiRequests: jest.fn().mockImplementation(() => dataApiMock),
    __dataApiMock: dataApiMock,
  };
});

jest.mock('../../../main/services/CourtService', () => {
  const courtServiceMock = { formatData: jest.fn() };
  return {
    CourtService: jest.fn().mockImplementation(() => courtServiceMock),
    __courtServiceMock: courtServiceMock,
  };
});

const getMocks = () => {
  const dataApi = require('../../../main/requests/DataApiRequests');
  const service = require('../../../main/services/CourtService');
  return {
    dataApiMock: dataApi.__dataApiMock as { getCourtDetails: jest.Mock },
    courtServiceMock: service.__courtServiceMock as { formatData: jest.Mock },
  };
};

describe('CourtController', () => {
  beforeEach(() => {
    const { dataApiMock, courtServiceMock } = getMocks();
    dataApiMock.getCourtDetails.mockReset();
    courtServiceMock.formatData.mockReset();
  });

  test('renders not-found on 404', async () => {
    const controller = new CourtController();
    const response = {
      render: () => '',
    } as unknown as Response & { status: () => Response };
    response.status = () => response;
    const responseMock = mock(response);
    const request = mockRequest({
      'not-found': { h1: 'Not found' },
    });

    const { dataApiMock } = getMocks();
    dataApiMock.getCourtDetails.mockResolvedValue(HttpStatusCode.NotFound);

    responseMock.expects('status').once().withArgs(404).returns(response);
    responseMock.expects('render').once().withArgs('not-found', { h1: 'Not found' });

    await controller.get(request, response);
    responseMock.verify();
  });

  test('renders court-closed with interpolated title', async () => {
    const controller = new CourtController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({
      'court-closed': { title: '{name} - Find a Court or Tribunal - GOV.UK', p1: 'Closed' },
    });

    const court = {
      id: '1',
      name: 'Closed Court',
      slug: 'closed-court',
      open: false,
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
    } as Court;

    const viewModel = { ...court, openingHoursByType: [], enquiriesPhoneNumber: null } as CourtViewModel;
    const { dataApiMock, courtServiceMock } = getMocks();
    dataApiMock.getCourtDetails.mockResolvedValue(court);
    courtServiceMock.formatData.mockReturnValue(viewModel);

    responseMock.expects('render').once().withArgs('court-closed', {
      title: 'Closed Court - Find a Court or Tribunal - GOV.UK',
      p1: 'Closed',
      name: 'Closed Court',
    });

    await controller.get(request, response);
    responseMock.verify();
  });

  test('renders court view when open', async () => {
    const controller = new CourtController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    const request = mockRequest({
      court: { pageTitleSuffix: 'Find a Court or Tribunal - GOV.UK' },
    });

    const court = {
      id: '1',
      name: 'Open Court',
      slug: 'open-court',
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
    } as Court;

    const viewModel = { ...court, openingHoursByType: [], enquiriesPhoneNumber: null } as CourtViewModel;
    const { dataApiMock, courtServiceMock } = getMocks();
    dataApiMock.getCourtDetails.mockResolvedValue(court);
    courtServiceMock.formatData.mockReturnValue(viewModel);

    responseMock.expects('render').once().withArgs('court', {
      pageTitleSuffix: 'Find a Court or Tribunal - GOV.UK',
      court: viewModel,
    });

    await controller.get(request, response);
    responseMock.verify();
  });
});
