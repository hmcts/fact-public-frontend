import type { Response } from 'express';
import { match, restore, stub } from 'sinon';

import ResourcesController from '../../../main/controllers/ResourcesController';
import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { mockRequest } from '../mocks/mockRequest';

describe('ResourcesController', () => {
  beforeEach(() => {
    restore();
  });

  test('returns bad request when courtId is missing or invalid', async () => {
    const dataApiRequests = new DataApiRequests();
    const controller = new ResourcesController(dataApiRequests);
    const sendStatus = jest.fn();
    const response = {
      sendStatus,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: 'not-a-uuid' };

    const getFileStreamStub = stub(dataApiRequests, 'getFileStream');

    await controller.img(request, response);

    expect(sendStatus).toHaveBeenCalledTimes(1);
    expect(sendStatus).toHaveBeenCalledWith(400);
    expect(getFileStreamStub.called).toBe(false);
  });

  test('streams court image and forwards stream headers', async () => {
    const dataApiRequests = new DataApiRequests();
    const controller = new ResourcesController(dataApiRequests);
    const setHeader = jest.fn();
    const response = {
      setHeader,
    } as unknown as Response;
    const request = mockRequest({});
    request.params = { courtId: '11111111-1111-4111-8111-111111111111' };

    const stream = {
      on: stub(),
      pipe: stub(),
    };

    const getFileStreamStub = stub(dataApiRequests, 'getFileStream').resolves({
      headers: {
        contentType: 'image/jpeg',
        contentDisposition: 'inline; filename="court.jpg"',
        contentLength: '1234',
      },
      stream: stream as never,
    });

    await controller.img(request, response);

    expect(setHeader).toHaveBeenCalledTimes(3);
    expect(setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
    expect(setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="court.jpg"');
    expect(setHeader).toHaveBeenCalledWith('Content-Length', '1234');
    expect(
      getFileStreamStub.calledOnceWithExactly('/resources/v1/court-photo/11111111-1111-4111-8111-111111111111')
    ).toBe(true);
    expect(stream.on.calledOnceWithExactly('error', match.func)).toBe(true);
    expect(stream.pipe.calledOnceWithExactly(response)).toBe(true);
  });

  test('returns upstream status code for csv request when stream cannot be fetched', async () => {
    const dataApiRequests = new DataApiRequests();
    const controller = new ResourcesController(dataApiRequests);
    const sendStatus = jest.fn();
    const response = {
      sendStatus,
    } as unknown as Response;

    const getFileStreamStub = stub(dataApiRequests, 'getFileStream').resolves(503);

    await controller.csv(mockRequest({}), response);

    expect(sendStatus).toHaveBeenCalledTimes(1);
    expect(sendStatus).toHaveBeenCalledWith(503);
    expect(getFileStreamStub.calledOnceWithExactly('/resources/v1/csv')).toBe(true);
  });

  test('streams csv without setting headers when upstream headers are absent', async () => {
    const dataApiRequests = new DataApiRequests();
    const controller = new ResourcesController(dataApiRequests);
    const setHeader = jest.fn();
    const response = {
      setHeader,
    } as unknown as Response;

    const stream = {
      on: stub(),
      pipe: stub(),
    };

    const getFileStreamStub = stub(dataApiRequests, 'getFileStream').resolves({
      headers: {},
      stream: stream as never,
    });

    await controller.csv(mockRequest({}), response);

    expect(setHeader).not.toHaveBeenCalled();
    expect(getFileStreamStub.calledOnceWithExactly('/resources/v1/csv')).toBe(true);
    expect(stream.pipe.calledOnceWithExactly(response)).toBe(true);
  });

  test('sends bad gateway when the stream errors before response headers are sent', async () => {
    const dataApiRequests = new DataApiRequests();
    const controller = new ResourcesController(dataApiRequests);
    const sendStatus = jest.fn();
    const destroy = jest.fn();
    const response = {
      headersSent: false,
      sendStatus,
      destroy,
    } as unknown as Response;

    let errorHandler: (() => void) | undefined;
    const stream = {
      on: stub().callsFake((event: string, handler: () => void) => {
        if (event === 'error') {
          errorHandler = handler;
        }
        return stream;
      }),
      pipe: stub(),
    };

    stub(dataApiRequests, 'getFileStream').resolves({
      headers: {},
      stream: stream as never,
    });

    await controller.csv(mockRequest({}), response);
    errorHandler?.();

    expect(sendStatus).toHaveBeenCalledTimes(1);
    expect(sendStatus).toHaveBeenCalledWith(502);
    expect(destroy).not.toHaveBeenCalled();
  });

  test('destroys the response when the stream errors after headers are sent', async () => {
    const dataApiRequests = new DataApiRequests();
    const controller = new ResourcesController(dataApiRequests);
    const sendStatus = jest.fn();
    const destroy = jest.fn();
    const response = {
      headersSent: true,
      sendStatus,
      destroy,
    } as unknown as Response;

    let errorHandler: (() => void) | undefined;
    const stream = {
      on: stub().callsFake((event: string, handler: () => void) => {
        if (event === 'error') {
          errorHandler = handler;
        }
        return stream;
      }),
      pipe: stub(),
    };

    stub(dataApiRequests, 'getFileStream').resolves({
      headers: {},
      stream: stream as never,
    });

    await controller.csv(mockRequest({}), response);
    errorHandler?.();

    expect(sendStatus).not.toHaveBeenCalled();
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
