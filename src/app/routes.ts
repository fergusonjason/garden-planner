import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { isOnboardedGuard } from '@core/guards/is-onboarded-guard';
import { LoginComponent } from '@features/auth/components/login/login.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    loadComponent: () => import('@features/auth/components/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('@features/auth/components/onboarding/onboarding.component')
      .then(m => m.OnboardingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'auth/callback',
    children: []
  },
  {
    path: '',
    loadComponent: () => import('@features/garden-planner/components/garden-planner-main/garden-planner-main')
      .then(m => m.GardenPlannerMain),
    canActivate: [authGuard, isOnboardedGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];