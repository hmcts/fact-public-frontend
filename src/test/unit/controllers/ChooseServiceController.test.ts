import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Response } from 'express';

import { ChooseServiceController } from '../../../main/controllers/ChooseServiceController';
import { FactRequest } from '../../../main/interfaces/FactRequest';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { Service } from '../../../main/schemas/ServiceSchema';

const mockGetAllServices: jest.MockedFunction<() => Promise<Service[]>> = jest.fn();

const mockService: Service = {
  id: 'service-1',
  name: 'Test Service',
  slug: 'test-service',
  nameCy: 'Gwasanaeth Prawf',
  description: 'A test service',
  descriptionCy: 'Gwasanaeth prawf',
  serviceAreas: ['area-1', 'area-2'],
};

const dataApiRequests = { getAllServices: mockGetAllServices } as unknown as DataApiRequests;

describe('ChooseServiceController', () => {
  let req: Partial<FactRequest>;
  let res: Response;
  let controller: ChooseServiceController;

  beforeEach(() => {
    req = {
      i18n: {
        getDataByLanguage: jest.fn().mockReturnValue({
          'choose-service': { title: 'Choose Service' },
          'not-found': { title: 'Not Found' },
        }),
      } as unknown as FactRequest['i18n'],
      lng: 'en',
      params: { action: 'nearest' },
      body: {},
    };
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;
    mockGetAllServices.mockReset();
    controller = new ChooseServiceController(dataApiRequests);
  });

  test('renders choose-service page with valid action and services', async () => {
    mockGetAllServices.mockResolvedValue([mockService]);
    await controller.render(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith('choose-service', expect.objectContaining({ title: 'Choose Service' }));
  });

  test('renders not-found for invalid action', async () => {
    req.params = { action: 'invalid' };
    await controller.render(req as FactRequest, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.objectContaining({ title: 'Not Found' }));
  });

  test('redirects to /service-not-found for not-listed service', async () => {
    req.body = { service: 'not-listed' };
    await controller.continue(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith('/service-not-found');
  });

  test('redirects to /services/:service/service-areas/:action for valid service', async () => {
    req.body = { service: 'test-service' };
    req.params = { action: 'nearest' };
    await controller.continue(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith('/services/test-service/service-areas/nearest');
  });

  test('renders choose-service page with errors when service is missing', async () => {
    mockGetAllServices.mockResolvedValue([mockService]);
    req.body = {};
    await controller.continue(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith('choose-service', expect.objectContaining({ errors: true }));
  });

  test('renders not-found if getAllServices returns non-array', async () => {
    mockGetAllServices.mockResolvedValue(undefined as unknown as Service[]);
    await controller.render(req as FactRequest, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.objectContaining({ title: 'Not Found' }));
  });

  test('localises service name and description to Welsh', async () => {
    mockGetAllServices.mockResolvedValue([mockService]);
    req.lng = 'cy';
    await controller.render(req as FactRequest, res);
    const renderArgs = (res.render as jest.Mock).mock.calls[0][1] as {
      services: { text: string; description: string }[];
    };
    expect(renderArgs.services[0].text).toBe('Gwasanaeth Prawf');
    expect(renderArgs.services[0].description).toBe('Gwasanaeth prawf');
  });
});
