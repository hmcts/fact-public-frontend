import { InjectionMode, asClass, asValue, createContainer } from 'awilix';
import { Application } from 'express';

import { DataApiRequests } from '../../requests/DataApiRequests';
import { Logger } from '../logging';

const logger = Logger.getLogger('app');

try {
  const test = asClass(DataApiRequests);
  logger.info(test);
} catch (error) {
  logger.error('Error creating DataApiRequests class:', error);
}

export class Container {
  public enableFor(app: Application): void {
    app.locals.container = createContainer({
      injectionMode: InjectionMode.CLASSIC,
    }).register({
      // As caching is now included in DataApiRequests we need to ensure
      // that all controllers/services that are using it are being given
      // the same instance.
      // dataApiRequests: asClass(DataApiRequests).singleton(),
      logger: asValue(logger),
    });
  }
}
