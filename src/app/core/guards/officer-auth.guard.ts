import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const officerAuthGuard: CanActivateFn = () => {
  return inject(AuthService).requireOfficerAccess();
};
