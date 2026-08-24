import { HttpStatusCode } from 'axios';
import { Response } from 'express';

import BaseController, { LocalisedOption } from '../../../main/controllers/BaseController';
import { FactRequest } from '../../../main/interfaces/FactRequest';
import { mockRequest } from '../mocks/mockRequest';

class FakeController extends BaseController {
  public localeData<T>(req: FactRequest, path: string): T {
    return this.getLocaleData<T>(req, path);
  }

  public view(req: FactRequest, res: Response, data: Record<string, unknown> = {}): void {
    this.renderView(req, res, 'test-view', 'nested.page', data);
  }

  public notFound(req: FactRequest, res: Response): void {
    this.renderNotFound(req, res);
  }

  public error(req: FactRequest, res: Response, status: HttpStatusCode): void {
    this.renderError(req, res, status);
  }

  public value<T>(req: FactRequest, englishValue: T, welshValue: T): T {
    return this.localise(req, englishValue, welshValue);
  }

  public valueWithFallback<T>(req: FactRequest, englishValue: T, welshValue: T | null | undefined): T {
    return this.localiseWithEnglishFallback(req, englishValue, welshValue);
  }

  public options(req: FactRequest, values: Parameters<FakeController['localiseOptions']>[1]): LocalisedOption[] {
    return this.localiseOptions(req, values);
  }
}

describe('BaseController', () => {
  const controller = new FakeController();
  const localeData = {
    nested: { page: { title: 'Page title', nested: { value: 'original' } } },
    'not-found': { heading: 'Not found' },
    error: { heading: 'Something went wrong' },
  };

  test('retrieves nested locale data as a defensive clone', () => {
    const req = mockRequest(localeData);
    const result = controller.localeData<{ nested: { value: string } }>(req, 'nested.page');

    result.nested.value = 'changed';

    expect(localeData.nested.page.nested.value).toBe('original');
  });

  test('renders a localized view with additional data taking precedence', () => {
    const req = mockRequest(localeData);
    const res = { render: jest.fn() } as unknown as Response;

    controller.view(req, res, { title: 'Overridden title', result: 1 });

    expect(res.render).toHaveBeenCalledWith('test-view', {
      title: 'Overridden title',
      nested: { value: 'original' },
      result: 1,
    });
  });

  test('renders localized not-found and error pages with their statuses', () => {
    const req = mockRequest(localeData);
    const res = { status: jest.fn().mockReturnThis(), render: jest.fn() } as unknown as Response;

    controller.notFound(req, res);
    controller.error(req, res, HttpStatusCode.BadGateway);

    expect(res.status).toHaveBeenNthCalledWith(1, HttpStatusCode.NotFound);
    expect(res.render).toHaveBeenNthCalledWith(1, 'not-found', localeData['not-found']);
    expect(res.status).toHaveBeenNthCalledWith(2, HttpStatusCode.BadGateway);
    expect(res.render).toHaveBeenNthCalledWith(2, 'error', localeData.error);
  });

  test('selects values by language and only applies fallback when requested', () => {
    const req = mockRequest(localeData);

    expect(controller.value(req, 'English', 'Welsh')).toBe('English');
    req.lng = 'cy';
    expect(controller.value(req, 'English', 'Welsh')).toBe('Welsh');
    expect(controller.value(req, 'English', null)).toBeNull();
    expect(controller.valueWithFallback(req, 'English', null)).toBe('English');
    expect(controller.valueWithFallback(req, 'English', '')).toBe('English');
    expect(controller.valueWithFallback(req, 'English', 'Welsh')).toBe('Welsh');
  });

  test('maps shared service data to localized options', () => {
    const req = mockRequest(localeData);
    req.lng = 'cy';

    expect(
      controller.options(req, [
        {
          id: 'service-id',
          name: 'Service',
          nameCy: 'Gwasanaeth',
          description: 'Description',
          descriptionCy: 'Disgrifiad',
          slug: 'service',
        },
      ])
    ).toEqual([
      {
        id: 'service-id',
        text: 'Gwasanaeth',
        description: 'Disgrifiad',
        value: 'service',
      },
    ]);
  });
});
