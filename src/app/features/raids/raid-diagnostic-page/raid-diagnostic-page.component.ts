import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RaidDiagnosticDTO, RaidMessageDiagnosticDTO, RaidSignupDiagnosticDTO } from '../../../core/models/raid.model';
import { RaidService } from '../../../core/services/raid.service';

@Component({
  selector: 'app-raid-diagnostic-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './raid-diagnostic-page.component.html',
  styleUrls: ['./raid-diagnostic-page.component.scss']
})
export class RaidDiagnosticPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private raidService = inject(RaidService);

  diagnostic: RaidDiagnosticDTO | null = null;
  isLoading = true;
  isRescanning = false;
  errorMessage: string | null = null;
  feedbackMessage: string | null = null;

  ngOnInit(): void {
    this.loadDiagnostic();
  }

  goBack(): void {
    this.router.navigateByUrl('/raids');
  }

  refresh(): void {
    this.loadDiagnostic();
  }

  rescanRaid(): void {
    const raidId = this.getRaidId();
    if (!raidId || this.isRescanning) {
      return;
    }

    this.isRescanning = true;
    this.feedbackMessage = null;
    this.raidService.rescanRaid(raidId).subscribe({
      next: (message) => {
        this.feedbackMessage = message;
        this.isRescanning = false;
        this.loadDiagnostic();
      },
      error: () => {
        this.feedbackMessage = "Impossible de rescanner ce raid.";
        this.isRescanning = false;
      }
    });
  }

  formatRaidDate(value: string | null | undefined): string {
    if (!value) {
      return 'Inconnue';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  formatMessageDate(value: string | null | undefined): string {
    if (!value) {
      return 'Inconnue';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  signupLabel(signup: RaidSignupDiagnosticDTO): string {
    const parts = [
      signup.personnageNom || signup.pseudoIhm || signup.serverPseudo,
      signup.classe,
      signup.specialisation
    ].filter(Boolean);

    return parts.join(' · ');
  }

  messageBadges(message: RaidMessageDiagnosticDTO | null): string[] {
    if (!message) {
      return [];
    }

    const badges: string[] = [];
    if (message.parsedAsRaidHelper) {
      badges.push('Raid-Helper');
    }
    if (message.compositionTool) {
      badges.push('Composition Tool');
    }
    if (message.placeholderSignup) {
      badges.push('Notification vide');
    }
    if (message.signupLineCount > 0) {
      badges.push(`${message.signupLineCount} ligne(s) roster`);
    }
    return badges;
  }

  private loadDiagnostic(): void {
    const raidId = this.getRaidId();
    if (!raidId) {
      this.errorMessage = "Raid introuvable.";
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.raidService.getRaidDiagnostic(raidId).subscribe({
      next: (diagnostic) => {
        this.diagnostic = diagnostic;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = "Impossible de charger le diagnostic du raid.";
        this.isLoading = false;
      }
    });
  }

  private getRaidId(): number | null {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (!rawId) {
      return null;
    }

    const raidId = Number(rawId);
    return Number.isFinite(raidId) ? raidId : null;
  }
}
