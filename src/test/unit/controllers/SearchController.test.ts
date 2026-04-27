import { Response } from 'express';

const mockGetAll = jest.fn();

jest.mock('../../../main/requests/DataApiRequests', () => ({
  DataApiRequests: jest.fn().mockImplementation(() => ({
    getAll: mockGetAll,
  })),
}));

import SearchController from '../../../main/controllers/SearchController';
import { FactRequest } from '../../../main/interfaces/FactRequest';

describe('CourtController', () => {
  const controller = new SearchController();

  describe('getAllJson', () => {
    test('should return all courts data as JSON', async () => {
      const res = {
        json: jest.fn(),
      } as unknown as Response;
      const req = {} as unknown as FactRequest;
      const mockCourts = [{ name: 'Test Court 1' }, { name: 'Test Court 2' }];

      mockGetAll.mockResolvedValue(mockCourts);

      await controller.getAllJson(req, res);

      expect(mockGetAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockCourts);
    });
  });
});
