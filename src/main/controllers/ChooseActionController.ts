import { GET, POST, route } from 'awilix-express';
import { Response } from 'express';
import { cloneDeep } from 'lodash';

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
    if (req.body?.action && isValidAction(req.body.action)) {
      const action = req.body?.action as string;
      res.redirect('/services/' + action);
    } else {
      res.render('choose-action', {
        ...cloneDeep(req.i18n.getDataByLanguage(req.lng)['choose-action']),
        errors: true
      });
    }
  }
}
