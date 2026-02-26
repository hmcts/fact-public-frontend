import { GET, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';

@route('/accessibility-statement')
export default class AccessibilityStatementController {
  @GET()
  public get(req: FactRequest, res: Response): void {
    const data = req.i18n?.getDataByLanguage(req.lng)?.accessibilityStatement;
    res.render('accessibility-statement', data);
  }
}
