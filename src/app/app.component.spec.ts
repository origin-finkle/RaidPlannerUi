import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from './core/services/auth.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            authStatus$: of({
              configured: true,
              authenticated: false,
              officer: false,
              discordId: null,
              username: null,
              displayName: null
            }),
            refreshStatus: () => of({
              configured: true,
              authenticated: false,
              officer: false,
              discordId: null,
              username: null,
              displayName: null
            }),
            logout: () => of(void 0)
          }
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('exposes footer metadata', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.appVersion).toBe('1.0.0');
    expect(app.author).toBe('Djiba');
  });

  it('renders the application brand', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand__title')?.textContent).toContain('WoW Raid Planner');
  });
});
