import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Response } from 'express';

import ChooseActionController from '../../../main/controllers/ChooseActionController';
import { FactRequest } from '../../../main/interfaces/FactRequest';

describe('ChooseActionController', () => {
  let req: Partial<FactRequest>;
  let res: Response;

  beforeEach(() => {
    req = {
      i18n: {
        getDataByLanguage: jest.fn().mockReturnValue({ 'choose-action': { title: 'Choose Action' } }),
      } as unknown as FactRequest['i18n'],
      lng: 'en',
      body: {},
    };
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;
  });

  test('renders choose-action page on GET', () => {
    new ChooseActionController().render(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith('choose-action', { title: 'Choose Action' });
  });

  test('redirects to correct url when valid action is provided on POST', () => {
    req.body = { action: 'nearest' };
    new ChooseActionController().continue(req as FactRequest, res);
    expect(res.redirect).toHaveBeenCalledWith('/services/nearest');
  });

  test('renders choose-action page with errors when action is missing', () => {
    req.body = {};
    new ChooseActionController().continue(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith('choose-action', expect.objectContaining({ errors: true }));
  });

  test('renders choose-action page with errors when action is invalid', () => {
    req.body = { action: 'invalid-action' };
    new ChooseActionController().continue(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith('choose-action', expect.objectContaining({ errors: true }));
  });

  test('does not redirect or render if req.body is undefined', () => {
    req.body = undefined;
    new ChooseActionController().continue(req as FactRequest, res);
    expect(res.render).toHaveBeenCalledWith('choose-action', expect.objectContaining({ errors: true }));
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
