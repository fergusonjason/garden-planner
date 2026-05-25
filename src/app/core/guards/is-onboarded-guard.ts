import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';

export const isOnboardedGuard: CanActivateFn = async (route, state) => {

  const authService = inject(AuthService);
  const userService = inject(UserService);
  const router = inject(Router);

  const currentUser = authService.currentUser();
  if (!currentUser) {
    return router.createUrlTree(['/login']);
  }

  const profile = await userService.getProfile(currentUser.id);
  if (!profile?.preferences) {
    return router.createUrlTree(['/onboarding']);
  }

  return true;
};
