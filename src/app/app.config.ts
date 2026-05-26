import { ApplicationConfig, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appVersionProvider } from './core/tokens/application-version.token';
import { authInitializer } from '@core/initializers/auth.initializer';
import { uiDataInitializer } from '@core/initializers/reference-data.initializer';
import { routes } from './routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    appVersionProvider,
    provideAppInitializer(authInitializer),
    provideAppInitializer(uiDataInitializer)
  ]
};
