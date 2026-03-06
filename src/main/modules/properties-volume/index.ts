import * as propertiesVolume from '@hmcts/properties-volume';
import config from 'config';
import { Application } from 'express';
import { get, set } from 'lodash';

export class PropertiesVolume {
  enableFor(server: Application): void {
    if (server.locals.ENV !== 'development') {
      propertiesVolume.addTo(config);

      this.setSecret('secrets.fact-kv.APP_INSIGHTS_CONNECTION_STRING', 'appInsights.app-insights-connection-string');
      this.setSecret('secrets.fact-kv.public-frontend-app-reg-id', 'auth.app-reg-id');
      this.setSecret('secrets.fact-kv.api-app-reg-id', 'auth.api-app-reg-id');
    }
  }

  private setSecret(fromPath: string, toPath: string): void {
    if (config.has(fromPath)) {
      set(config, toPath, get(config, fromPath));
    }
  }
}
