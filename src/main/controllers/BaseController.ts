import { HttpStatusCode } from 'axios';
import { Response } from 'express';
import { cloneDeep, get } from 'lodash';

import { FactRequest } from '../interfaces/FactRequest';
import { DataApiError, toDataApiErrorEnvelope } from '../requests/DataApiError';

type ViewData = Record<string, unknown>;

type LocalisableOption = {
  id: string;
  name: string;
  nameCy: string;
  description: string | null;
  descriptionCy: string | null;
  slug: string;
};

export type LocalisedOption = {
  id: string;
  text: string;
  description: string | null;
  value: string;
};

export default abstract class BaseController {
  protected getLocaleData<T>(req: FactRequest, path: string): T {
    return cloneDeep(get(req.i18n.getDataByLanguage(req.lng), path)) as T;
  }

  protected renderView(
    req: FactRequest,
    res: Response,
    view: string,
    localePath: string,
    viewData: ViewData = {}
  ): void {
    res.render(view, {
      ...this.getLocaleData<ViewData>(req, localePath),
      ...viewData,
    });
  }

  protected renderNotFound(req: FactRequest, res: Response): void {
    res.status(HttpStatusCode.NotFound).render('not-found', this.getLocaleData<ViewData>(req, 'not-found'));
  }

  protected renderError(req: FactRequest, res: Response, status: HttpStatusCode): void {
    res.status(status).render('error', this.getLocaleData<ViewData>(req, 'error'));
  }

  protected renderDataApiError(req: FactRequest, res: Response, error: DataApiError): void {
    if (error.status === HttpStatusCode.NotFound) {
      return this.renderNotFound(req, res);
    }
    return this.renderError(req, res, error.status);
  }

  protected sendDataApiJsonError(res: Response, error: DataApiError): void {
    res.status(error.status).json(toDataApiErrorEnvelope(error));
  }

  protected localise<T>(req: FactRequest, englishValue: T, welshValue: T): T {
    return req.lng === 'cy' ? welshValue : englishValue;
  }

  protected localiseWithEnglishFallback<T>(req: FactRequest, englishValue: T, welshValue: T | null | undefined): T {
    return req.lng === 'cy' && welshValue ? welshValue : englishValue;
  }

  protected localiseOptions<T extends LocalisableOption>(req: FactRequest, options: T[]): LocalisedOption[] {
    return options.map(option => ({
      id: option.id,
      text: this.localise(req, option.name, option.nameCy),
      description: this.localise(req, option.description, option.descriptionCy),
      value: option.slug,
    }));
  }
}
