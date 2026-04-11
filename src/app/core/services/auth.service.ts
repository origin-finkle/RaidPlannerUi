import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, UrlTree } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthStatusDTO } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private authStatusSubject = new BehaviorSubject<AuthStatusDTO>({
    configured: false,
    authenticated: false,
    officer: false,
    discordId: null,
    username: null,
    displayName: null
  });

  readonly authStatus$ = this.authStatusSubject.asObservable();

  refreshStatus(): Observable<AuthStatusDTO> {
    return this.http.get<AuthStatusDTO>('/api/auth/me').pipe(
      tap((status) => this.authStatusSubject.next(status))
    );
  }

  requireOfficerAccess(): Observable<boolean | UrlTree> {
    return this.refreshStatus().pipe(
      map((status) => status.authenticated && status.officer
        ? true
        : this.router.createUrlTree(['/login'], {
            queryParams: status.authenticated ? { denied: 1 } : {}
          })),
      catchError(() => of(this.router.createUrlTree(['/login'])))
    );
  }

  loginWithDiscord(): void {
    window.location.href = '/api/auth/discord/login';
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}).pipe(
      tap(() => this.authStatusSubject.next({
        configured: true,
        authenticated: false,
        officer: false,
        discordId: null,
        username: null,
        displayName: null
      }))
    );
  }
}
