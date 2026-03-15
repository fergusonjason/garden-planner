import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { appVersionProvider } from './core/tokens/application-version.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    appVersionProvider
  ]
};
