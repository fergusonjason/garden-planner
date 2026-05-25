import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { LoginComponent } from '@features/auth/components/login/login.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    children: []
  },
  {
    path: 'register',
    loadComponent: () => import('@features/auth/components/register/register.component')
      .then(m => m.RegisterComponent),
    children: []
  },
  {
    path: 'auth/callback',
    // component: AuthCallbackComponent
    children: []
  },
  {
    path: '',
    loadComponent: () => import('@features/garden-planner/components/garden-planner-main/garden-planner-main')
      .then(m => m.GardenPlannerMain),
    // component: GardenPlannerMainComponent,
    canActivate: [authGuard],
    children: []
  },
  {
    path: '**',
    redirectTo: ''
  }
];
