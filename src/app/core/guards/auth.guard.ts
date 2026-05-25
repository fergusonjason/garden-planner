import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = () => {

  const currentUser  = inject(AuthService).currentUser();
  const router = inject(Router);

  if (!currentUser) {
    const urlTree = router.createUrlTree(['/login']);
    return urlTree;
  }

  return true;
};
