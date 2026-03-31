import { GET, POST, route } from 'awilix-express';
import { Response } from 'express';

import { FactRequest } from '../interfaces/FactRequest';
import { isValidAction } from '../utils/validationUtils';

@route('/service-choose-action')
export default class ChooseActionController {
  @GET()
  public render(req: FactRequest, res: Response): void {
    res.render('choose-action', req.i18n.getDataByLanguage(req.lng)['choose-action']);
  }

  @POST()
  public continue(req: FactRequest, res: Response): void {
    if (isValidAction(req.body?.action)) {
      res.redirect(`/services/${req.body.action}`);
    } else {
      res.render('choose-action', {
        ...req.i18n.getDataByLanguage(req.lng)['choose-action'],
        errors: true,
      });
    }
  }
}
