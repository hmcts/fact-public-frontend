import { Response } from 'express';

jest.mock('../../../main/requests/DataApiRequests', () => {
  (global as any).mockGetAll = jest.fn();
  return {
    DataApiRequests: jest.fn().mockImplementation(() => ({
      getAll: (global as any).mockGetAll,
    })),
  };
});

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

      (global as any).mockGetAll.mockResolvedValue(mockCourts);

      await controller.getAllJson(req, res);

      expect((global as any).mockGetAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockCourts);
    });
  });
});
