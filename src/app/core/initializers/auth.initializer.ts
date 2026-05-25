import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

export async function authInitializer(): Promise<void> {
  const authService = inject(AuthService);
  authService.initAuthListener();
  await authService.getSession();
}