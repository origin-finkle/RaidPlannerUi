import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'raids',
    pathMatch: 'full',
  },
  {
    path: 'raids',
    loadComponent: () =>
      import('./features/raids/raids-page/raids-page.component').then(m => m.RaidsPageComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/raids/admin/admin-page.component').then(m => m.AdminPageComponent)
  }
];
