import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import CourtController from '../../../main/controllers/CourtController';
import { mockRequest } from '../mocks/mockRequest';

describe('CourtController', () => {
  const courtSlug = 'reading-county-court';
  const mockApiRequests = {
    getCourt: jest.fn(),
    getAllCourts: jest.fn(),
  };

  const controller = new CourtController(mockApiRequests as never);

  test('should return court details as JSON', async () => {
    const mockData = { name: 'Reading County Court' };
    mockApiRequests.getCourt.mockResolvedValue(mockData);

    const req = mockRequest({});
    req.params = { slug: courtSlug };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getJson(req, res);

    expect(mockApiRequests.getCourt).toHaveBeenCalledWith(courtSlug);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  test('should return 404 status when API call returns HttpStatusCode.NotFound (not found)', async () => {
    mockApiRequests.getCourt.mockResolvedValue(HttpStatusCode.NotFound);

    const req = mockRequest({ 'not-found': 'Not Found Content' });
    req.params = { slug: courtSlug };

    const res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getJson(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', 'Not Found Content');
  });

  test('should return 500 status when API call returns HttpStatusCode.InternalServerError', async () => {
    mockApiRequests.getCourt.mockResolvedValue(HttpStatusCode.InternalServerError);

    const req = mockRequest({ 'not-found': 'Not Found Content' });
    req.params = { slug: courtSlug };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getJson(req, res);

    expect(res.json).toHaveBeenCalledWith(500);
  });

  test('should return all court details as JSON', async () => {
    const mockData = [{ name: 'Reading County Court' }, { name: 'London Court' }];
    mockApiRequests.getAllCourts.mockResolvedValue(mockData);

    const req = mockRequest({});
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getAllJson(req, res);

    expect(mockApiRequests.getAllCourts).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  test('should return HttpStatusCode when getAllCourts API call fails', async () => {
    mockApiRequests.getAllCourts.mockResolvedValue(HttpStatusCode.InternalServerError);

    const req = mockRequest({});
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getAllJson(req, res);

    expect(res.json).toHaveBeenCalledWith(500);
  });
});
