import { Response } from 'express';

import SearchController from '../../../main/controllers/SearchController';
import { FactRequest } from '../../../main/interfaces/FactRequest';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { unavailableDataApiError } from '../mocks/dataApiError';

const mockGetAll = jest.fn();
const dataApiRequests = { getAll: mockGetAll } as unknown as DataApiRequests;

describe('CourtController', () => {
  const controller = new SearchController(dataApiRequests);

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

    test('returns a stable JSON error envelope when the Data API is unavailable', async () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const req = {} as unknown as FactRequest;
      mockGetAll.mockResolvedValue(unavailableDataApiError);

      await controller.getAllJson(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'DATA_API_UNAVAILABLE',
          message: 'The Data API is temporarily unavailable',
        },
      });
    });
  });
});
