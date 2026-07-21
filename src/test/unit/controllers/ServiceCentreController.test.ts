import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import ServiceCentreController from '../../../main/controllers/ServiceCentreController';
import { ServiceCentreDetails } from '../../../main/schemas/allLocationDetails';
import { ServiceCentreViewModel } from '../../../main/services/ServiceCentreService';
import { mockRequest } from '../mocks/mockRequest';

jest.mock('../../../main/requests/DataApiRequests', () => {
  const dataApiMock = { getServiceCentreDetails: jest.fn() };
  return {
    __dataApiMock: dataApiMock,
    DataApiRequests: jest.fn().mockImplementation(() => dataApiMock),
  };
});

jest.mock('../../../main/services/ServiceCentreService', () => {
  const serviceCentreServiceMock = { formatData: jest.fn() };
  return {
    __serviceCentreServiceMock: serviceCentreServiceMock,
    ServiceCentreService: jest.fn().mockImplementation(() => serviceCentreServiceMock),
  };
});

const getMocks = () => {
  const dataApiModule = require('../../../main/requests/DataApiRequests') as {
    __dataApiMock: { getServiceCentreDetails: jest.Mock };
  };
  const serviceModule = require('../../../main/services/ServiceCentreService') as {
    __serviceCentreServiceMock: { formatData: jest.Mock };
  };
  return {
    dataApiMock: dataApiModule.__dataApiMock,
    serviceCentreServiceMock: serviceModule.__serviceCentreServiceMock,
  };
};

const buildServiceCentre = (overrides: Partial<ServiceCentreDetails> = {}): ServiceCentreDetails => ({
  id: 'service-centre-id',
  name: 'Test Service Centre',
  slug: 'test-service-centre',
  open: true,
  warningNotice: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastUpdatedAt: '2024-01-15T10:00:00.000Z',
  regionId: 'region-id',
  serviceAreas: [],
  catchmentType: null,
  serviceCentreAddresses: [],
  serviceCentreContactDetails: [],
  serviceCentreAreasOfLaw: [],
  ...overrides,
});

describe('ServiceCentreController', () => {
  beforeEach(() => {
    const { dataApiMock, serviceCentreServiceMock } = getMocks();
    dataApiMock.getServiceCentreDetails.mockReset();
    serviceCentreServiceMock.formatData.mockReset();
  });

  test('renders the localized not-found page for a missing service centre', async () => {
    const req = mockRequest({ 'not-found': { heading: 'Not found' } });
    req.params.slug = 'missing-service-centre';
    const res = { status: jest.fn().mockReturnThis(), render: jest.fn() } as unknown as Response;
    getMocks().dataApiMock.getServiceCentreDetails.mockResolvedValue(HttpStatusCode.NotFound);

    await new ServiceCentreController().get(req, res);

    expect(getMocks().dataApiMock.getServiceCentreDetails).toHaveBeenCalledWith('missing-service-centre');
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NotFound);
    expect(res.render).toHaveBeenCalledWith('not-found', { heading: 'Not found' });
  });

  test('renders the localized error page using the API status', async () => {
    const req = mockRequest({ error: { h1: 'Something went wrong' } });
    req.params.slug = 'failed-service-centre';
    const res = { status: jest.fn().mockReturnThis(), render: jest.fn() } as unknown as Response;
    getMocks().dataApiMock.getServiceCentreDetails.mockResolvedValue(HttpStatusCode.BadGateway);

    await new ServiceCentreController().get(req, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BadGateway);
    expect(res.render).toHaveBeenCalledWith('error', { h1: 'Something went wrong' });
  });

  test('renders the shared closed layout with localized service-centre copy', async () => {
    const req = mockRequest({
      'service-centre': {
        closed: {
          title: '{name} - Find a Court or Tribunal - GOV.UK',
          p1: 'This service centre is no longer in service.',
          linkText: 'Search for an alternative location',
        },
      },
    });
    req.params.slug = 'closed-service-centre';
    const res = { render: jest.fn() } as unknown as Response;
    const serviceCentre = buildServiceCentre({
      name: 'Closed Service Centre',
      slug: 'closed-service-centre',
      open: false,
    });
    getMocks().dataApiMock.getServiceCentreDetails.mockResolvedValue(serviceCentre);

    await new ServiceCentreController().get(req, res);

    expect(getMocks().serviceCentreServiceMock.formatData).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('court-closed', {
      title: 'Closed Service Centre - Find a Court or Tribunal - GOV.UK',
      p1: 'This service centre is no longer in service.',
      linkText: 'Search for an alternative location',
      name: 'Closed Service Centre',
    });
  });

  test.each([true, null, undefined])('renders the detail page when open is %s', async open => {
    const translations = { pageTitleSuffix: 'Find a Court or Tribunal - GOV.UK' };
    const req = mockRequest({ 'service-centre': translations });
    req.params.slug = 'service-centre';
    const res = { render: jest.fn() } as unknown as Response;
    const serviceCentre = buildServiceCentre({ open });
    const viewModel = {
      ...serviceCentre,
      lastUpdatedAt: '15 January 2024',
      serviceCentreAddresses: [],
      serviceCentreContactDetails: [],
      serviceCentreAreasOfLaw: [],
    } as ServiceCentreViewModel;
    const { dataApiMock, serviceCentreServiceMock } = getMocks();
    dataApiMock.getServiceCentreDetails.mockResolvedValue(serviceCentre);
    serviceCentreServiceMock.formatData.mockReturnValue(viewModel);

    await new ServiceCentreController().get(req, res);

    expect(serviceCentreServiceMock.formatData).toHaveBeenCalledWith(serviceCentre, 'en');
    expect(res.render).toHaveBeenCalledWith('service-centre', {
      ...translations,
      serviceCentre: viewModel,
    });
  });
});
