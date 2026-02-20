import { HttpStatusCode } from 'axios';
import { Response } from 'express';

const mockGetCourt = jest.fn();

jest.mock('../../../main/requests/DataApiRequests', () => ({
  DataApiRequests: jest.fn().mockImplementation(() => ({
    getCourt: mockGetCourt,
  })),
}));

import CourtController from '../../../main/controllers/CourtController';
import { FactRequest } from '../../../main/interfaces/FactRequest';

describe('CourtController', () => {
  const controller = new CourtController();

  describe('getJson', () => {
    test('should return court data as JSON when successful', async () => {
      const res = {
        json: jest.fn(),
      } as unknown as Response;
      const req = {
        params: { slug: 'test-court' },
      } as unknown as FactRequest;
      const mockCourt = { name: 'Test Court', slug: 'test-court' };

      mockGetCourt.mockResolvedValue(mockCourt);

      await controller.getJson(req, res);

      expect(mockGetCourt).toHaveBeenCalledWith('test-court');
      expect(res.json).toHaveBeenCalledWith(mockCourt);
    });

    test('should render not-found page when court is not found', async () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      } as unknown as Response;
      const req = {
        params: { slug: 'unknown-court' },
        lng: 'en',
        i18n: {
          getDataByLanguage: jest.fn().mockReturnValue({ notFound: { some: 'content' } }),
        },
      } as unknown as FactRequest;

      mockGetCourt.mockResolvedValue(HttpStatusCode.NotFound);

      await controller.getJson(req, res);

      expect(mockGetCourt).toHaveBeenCalledWith('unknown-court');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.render).toHaveBeenCalledWith('not-found', { some: 'content' });
      expect(req.i18n.getDataByLanguage).toHaveBeenCalledWith('en');
    });
  });
});
