import { InjectionToken } from "@angular/core";
import { version } from '../../../../package.json';

export const APPLICATION_VERSION: InjectionToken<string> = new InjectionToken<string>('Application Version');

export const appVersionProvider = {
  provide: APPLICATION_VERSION,
  useValue: version
};
