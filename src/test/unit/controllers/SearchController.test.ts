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
    test('should return all location data as JSON', async () => {
      const res = {
        json: jest.fn(),
      } as unknown as Response;
      const req = {} as unknown as FactRequest;
      const mockLocations = [
        {
          locationType: 'COURT',
          serviceCentre: false,
          court: { name: 'Test Court 1', slug: 'test-court-1' },
          serviceCentreDetails: null,
        },
        {
          locationType: 'SERVICE_CENTRE',
          serviceCentre: true,
          court: null,
          serviceCentreDetails: { name: 'Test Service Centre', slug: 'test-service-centre' },
        },
      ];

      mockGetAll.mockResolvedValue(mockLocations);

      await controller.getAllJson(req, res);

      expect(mockGetAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockLocations);
    });
  });
});
