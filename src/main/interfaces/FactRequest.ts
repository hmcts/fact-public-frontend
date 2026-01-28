import { Request } from 'express';
import { i18n } from 'i18next';

export interface FactRequest extends Request {
  i18n: i18n & {
    getDataByLanguage: (lng: string | undefined) => {
      template: object;
      home: object;
      notFound: object;
      error: object;
    };
  };
  lng?: string;
}
