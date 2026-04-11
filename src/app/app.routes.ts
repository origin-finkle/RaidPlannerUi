import {Routes} from '@angular/router';
import { officerAuthGuard } from './core/guards/officer-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'raids',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login-page.component').then(m => m.LoginPageComponent)
  },
  {
    path: 'raids',
    canActivate: [officerAuthGuard],
    loadComponent: () =>
      import('./features/raids/raids-page/raids-page.component').then(m => m.RaidsPageComponent)
  },
  {
    path: 'raids/:id/diagnostic',
    canActivate: [officerAuthGuard],
    loadComponent: () =>
      import('./features/raids/raid-diagnostic-page/raid-diagnostic-page.component').then(m => m.RaidDiagnosticPageComponent)
  },
  {
    path: 'admin',
    canActivate: [officerAuthGuard],
    loadComponent: () => import('./features/raids/admin/admin-page.component').then(m => m.AdminPageComponent)
  }
];
