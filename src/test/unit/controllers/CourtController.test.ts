import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import CourtController from '../../../main/controllers/CourtController';
import { mockRequest } from '../mocks/mockRequest';

describe('CourtController', () => {
  const courtSlug = 'reading-county-court';
  const mockApiRequests = {
    getCourtDetails: jest.fn(),
    getAllCourtDetails: jest.fn(),
  };

  const controller = new CourtController(mockApiRequests as never);

  test('should return court details as JSON', async () => {
    const mockData = { name: 'Reading County Court' };
    mockApiRequests.getCourtDetails.mockResolvedValue(mockData);

    const req = mockRequest({});
    req.params = { slug: courtSlug };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getCourtDetailsJson(req, res);

    expect(mockApiRequests.getCourtDetails).toHaveBeenCalledWith(courtSlug);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  test('should return 404 status when API call throws an error', async () => {
    mockApiRequests.getCourtDetails.mockRejectedValue(new Error('Not Found'));

    const req = mockRequest({ 'not-found': 'Not Found Content' });
    req.params = { slug: courtSlug };

    const res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getCourtDetailsJson(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', 'Not Found Content');
  });

  test('should return 404 status when API call returns HttpStatusCode.NotFound (not found)', async () => {
    mockApiRequests.getCourtDetails.mockResolvedValue(HttpStatusCode.NotFound);

    const req = mockRequest({ 'not-found': 'Not Found Content' });
    req.params = { slug: courtSlug };

    const res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getCourtDetailsJson(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', 'Not Found Content');
  });

  test('should return 500 status when API call fails with other error', async () => {
    mockApiRequests.getCourtDetails.mockRejectedValue(new Error('Failed'));

    const req = mockRequest({ 'not-found': 'Not Found Content' });
    req.params = { slug: courtSlug };

    const res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getCourtDetailsJson(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', 'Not Found Content');
  });

  test('should return all court details as JSON', async () => {
    const mockData = [{ name: 'Reading County Court' }, { name: 'London Court' }];
    mockApiRequests.getAllCourtDetails.mockResolvedValue(mockData);

    const req = mockRequest({});
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getAllCourtDetailsJson(req, res);

    expect(mockApiRequests.getAllCourtDetails).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  test('should throw error when getAllCourtDetails API call fails', async () => {
    mockApiRequests.getAllCourtDetails.mockRejectedValue(new Error('Failed'));

    const req = mockRequest({});
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await expect(controller.getAllCourtDetailsJson(req, res)).rejects.toThrow('Failed');
  });
});
