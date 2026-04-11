import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  isLoading = false;
  denied = false;
  configFlag = false;
  backendConfigured = true;
  oauthFailed = false;

  ngOnInit(): void {
    this.denied = this.route.snapshot.queryParamMap.get('denied') === '1';
    this.configFlag = this.route.snapshot.queryParamMap.get('config') === '1';
    this.oauthFailed = this.route.snapshot.queryParamMap.get('oauth') === '1';

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.authService.refreshStatus().subscribe((status) => {
      this.backendConfigured = status.configured;
      if (status.authenticated && status.officer) {
        this.router.navigateByUrl('/raids');
        return;
      }

      if (status.configured && (this.configFlag || this.oauthFailed || this.denied)) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  get configMissing(): boolean {
    return this.configFlag && !this.backendConfigured;
  }

  login(): void {
    this.isLoading = true;
    this.authService.loginWithDiscord();
  }
}
