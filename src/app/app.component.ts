import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { AuthStatusDTO } from './core/models/auth.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  readonly appVersion = '1.0.0';
  readonly author = 'Djiba';
  readonly timezone = 'Europe/Paris';
  readonly resetWindow = 'Mercredi -> Mardi';
  authStatus: AuthStatusDTO | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.authService.authStatus$.subscribe((status) => {
      this.authStatus = status;
    });

    this.authService.refreshStatus().subscribe({
      next: (status) => {
        this.authStatus = status;
      },
      error: () => {
        this.authStatus = {
          configured: true,
          authenticated: false,
          officer: false,
          discordId: null,
          username: null,
          displayName: null
        };
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      window.location.href = '/login';
    });
  }
}
