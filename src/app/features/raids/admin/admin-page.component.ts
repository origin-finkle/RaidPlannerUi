import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import {
  AutoComposePreviewRaidDTO,
  AutoComposePreviewResultDTO,
  AutoComposeWeekRequestDTO,
  JoueurDTO,
  MissingRaidPingDTO,
  OfficerDashboardDTO,
  PlayerEquitySummaryDTO,
  PersonnageDTO,
  PlanningHealthSummaryDTO,
  RaidDTO,
  RaidDayResponse,
  RaidDiagnosticDTO,
  RaidPublicationHistoryDTO,
  RaidSchedulerStatusDTO,
  RaidTemplateDTO
} from '../../../core/models/raid.model';
import { JoueurService } from '../../../core/services/joueur.service';
import { RaidService } from '../../../core/services/raid.service';

type AdminTab = 'dashboard' | 'roster' | 'health' | 'equity' | 'diagnostics' | 'reminders' | 'tests' | 'templates' | 'settings' | 'history';
type OfficerFeedItem = {
  key: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  raidId: number;
  raidDate: string;
  primaryActionLabel: string;
  primaryAction: 'planner' | 'diagnostics' | 'reminders';
};

@Component({
  selector: 'app-admin-page',
  standalone: true,
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss',
  imports: [CommonModule, FormsModule, RouterModule]
})
export class AdminPageComponent implements OnInit {
  private static readonly TEST_EXPORT_CHANNEL_ID = '1355602641748496394';
  private platformId = inject(PLATFORM_ID);
  private joueurService = inject(JoueurService);
  private raidService = inject(RaidService);
  private router = inject(Router);

  activeTab: AdminTab = 'dashboard';

  joueurs: JoueurDTO[] = [];
  groupedRaids: RaidDayResponse[] = [];
  officerDashboard: OfficerDashboardDTO | null = null;
  planningHealth: PlanningHealthSummaryDTO | null = null;
  playerEquity: PlayerEquitySummaryDTO | null = null;
  publicationHistory: RaidPublicationHistoryDTO[] = [];
  raidTemplates: RaidTemplateDTO[] = [];
  raidSchedulerStatus: RaidSchedulerStatusDTO | null = null;
  schedulerDayOptions = [
    { value: 'MONDAY', label: 'Lundi' },
    { value: 'TUESDAY', label: 'Mardi' },
    { value: 'WEDNESDAY', label: 'Mercredi' },
    { value: 'THURSDAY', label: 'Jeudi' },
    { value: 'FRIDAY', label: 'Vendredi' },
    { value: 'SATURDAY', label: 'Samedi' },
    { value: 'SUNDAY', label: 'Dimanche' }
  ];
  schedulerTimezoneOptions = ['Europe/Paris', 'UTC'];

  joueurEnCours: JoueurDTO | null = null;
  personnagesDuJoueur: PersonnageDTO[] = [];

  selectedOperationalRaidId: number | null = null;
  raidDiagnostic: RaidDiagnosticDTO | null = null;
  isDashboardLoading = false;
  dashboardErrorMessage: string | null = null;
  isDiagnosticLoading = false;
  diagnosticErrorMessage: string | null = null;
  isHealthLoading = false;
  isEquityLoading = false;
  isSettingsLoading = false;
  isSettingsSaving = false;
  isTemplatesLoading = false;
  isTemplateSaving = false;
  healthErrorMessage: string | null = null;
  equityErrorMessage: string | null = null;
  settingsFeedback: string | null = null;
  templateFeedback: string | null = null;
  isHistoryLoading = false;
  isSchedulerLoading = false;
  isSchedulerSaving = false;
  historyErrorMessage: string | null = null;
  schedulerErrorMessage: string | null = null;
  quickActionFeedback: string | null = null;

  isBuildingMissingPing = false;
  isSendingMissingPingToTest = false;
  isRescanningRaid = false;
  isPublishingCompositionTest = false;
  isPublishingSignupFlowTest = false;
  isPreviewingAutoCompose = false;
  missingPingMessage: string | null = null;
  missingPingPlayers: string[] = [];
  reminderPreview: string | null = null;
  reminderFeedback: string | null = null;
  compositionTestMessage: string | null = null;
  signupFlowTestMessage: string | null = null;
  autoComposePreview: AutoComposePreviewRaidDTO[] = [];
  autoComposePreviewWarnings: string[] = [];
  autoComposePreviewMessage: string | null = null;
  autoComposeSettings: AutoComposeWeekRequestDTO = {
    maxRaids: 2,
    targetTanks: 2,
    targetHeals: 2,
    preferMains: true,
    balanceAcrossRaids: true,
    prioritizeBuffCoverage: true,
    huntersFillMissingBuffs: true
  };
  templateDraft: RaidTemplateDTO = this.createEmptyTemplate();

  specialisationsParClasse: { [classe: string]: string[] } = {
    Guerrier: ['Arme', 'Fury', 'Protection'],
    Paladin: ['Sacre', 'Protection', 'Retri'],
    Chasseur: ['BM', 'Precision', 'Survie'],
    Voleur: ['Assassinat', 'Combat', 'Finesse'],
    Pretre: ['Discipline', 'Sacre', 'Ombre'],
    DK: ['Sang', 'Givre', 'Impie'],
    Chaman: ['Amelioration', 'Elem', 'Restauration'],
    Mage: ['Feu', 'Givre', 'Arcane'],
    Demoniste: ['Affliction', 'Demonologie', 'Destruction'],
    Druide: ['Equilibre', 'Feral', 'Restauration'],
    Moine: ['Maitre brasseur', 'Tisse-brume', 'Marche-vent']
  };

  classes: string[] = Object.keys(this.specialisationsParClasse);

  nouveauPersonnage: Partial<PersonnageDTO> = {
    nom: '',
    classe: '',
    specialisation: '',
    role: '',
    main: false
  };
  mergeSourcePersonnageId: number | null = null;
  mergeTargetPersonnageId: number | null = null;
  isMergingPersonnages = false;
  mergeFeedback: string | null = null;
  isAddingPersonnage = false;
  characterFeedback: string | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadJoueurs();
    this.loadRaids();
    this.loadOfficerDashboard();
    this.loadRaidSchedulerStatus();
    this.loadPlanningHealth();
    this.loadPublicationHistory();
    this.loadAutoComposeSettings();
    this.loadPlayerEquity();
    this.loadRaidTemplates();
  }

  get totalRaidCount(): number {
    return this.groupedRaids.reduce((sum, day) => sum + day.raids.length, 0);
  }

  get diagnosticDiffCount(): number {
    if (!this.raidDiagnostic) {
      return 0;
    }

    return this.raidDiagnostic.liveOnlyPlayers.length + this.raidDiagnostic.snapshotOnlyPlayers.length;
  }

  get selectedOperationalRaid(): RaidDTO | null {
    if (!this.selectedOperationalRaidId) {
      return null;
    }

    for (const day of this.groupedRaids) {
      const raid = day.raids.find((entry) => entry.id === this.selectedOperationalRaidId);
      if (raid) {
        return raid;
      }
    }

    return null;
  }

  get raidOptions(): Array<{ id: number; label: string }> {
    return this.groupedRaids.flatMap((day) =>
      day.raids.map((raid) => ({
        id: raid.id,
        label: `${this.formatDateLabel(day.date)} · ${raid.nom}`
      }))
    );
  }

  get officerFeedItems(): OfficerFeedItem[] {
    const items: OfficerFeedItem[] = [];

    for (const issue of this.planningHealth?.issues ?? []) {
      items.push({
        key: `health-${issue.raidId}`,
        severity: issue.severity === 'high' ? 'high' : issue.severity === 'medium' ? 'medium' : 'low',
        title: `${issue.raidNom} demande une verification`,
        message: issue.issues.slice(0, 2).join(' - '),
        raidId: issue.raidId,
        raidDate: issue.raidDate,
        primaryActionLabel: 'Ouvrir le diagnostic',
        primaryAction: 'diagnostics'
      });
    }

    for (const raid of this.officerDashboard?.raids ?? []) {
      if (raid.pendingCount > 0) {
        items.push({
          key: `pending-${raid.raidId}`,
          severity: raid.pendingCount >= 3 ? 'high' : 'medium',
          title: `${raid.raidNom} attend encore des confirmations`,
          message: `${raid.pendingCount} joueur(s) n'ont pas encore repondu sur ${raid.totalAssignedPlayers}.`,
          raidId: raid.raidId,
          raidDate: raid.raidDate,
          primaryActionLabel: 'Ouvrir les rappels',
          primaryAction: 'reminders'
        });
      }

      if (!raid.published && raid.totalAssignedPlayers > 0) {
        items.push({
          key: `publish-${raid.raidId}`,
          severity: raid.compositionLocked ? 'medium' : 'low',
          title: `${raid.raidNom} est pret a etre publie`,
          message: `${raid.totalAssignedPlayers} joueur(s) sont deja assignes dans la compo actuelle.`,
          raidId: raid.raidId,
          raidDate: raid.raidDate,
          primaryActionLabel: 'Ouvrir le planner',
          primaryAction: 'planner'
        });
      }
    }

    return items
      .filter((item, index, array) => array.findIndex((entry) => entry.key === item.key) === index)
      .sort((left, right) => this.feedSeverityWeight(right.severity) - this.feedSeverityWeight(left.severity))
      .slice(0, 6);
  }

  selectTab(tab: AdminTab): void {
    this.activeTab = tab;
    if (tab === 'dashboard' && !this.officerDashboard && !this.isDashboardLoading) {
      this.loadOfficerDashboard();
    }
    if (tab === 'health' && !this.planningHealth && !this.isHealthLoading) {
      this.loadPlanningHealth();
    }
    if (tab === 'diagnostics' && this.selectedOperationalRaidId && !this.raidDiagnostic && !this.isDiagnosticLoading) {
      this.loadRaidDiagnostic();
    }
    if (tab === 'equity' && !this.playerEquity && !this.isEquityLoading) {
      this.loadPlayerEquity();
    }
    if (tab === 'history' && this.publicationHistory.length === 0 && !this.isHistoryLoading) {
      this.loadPublicationHistory();
    }
    if (tab === 'settings' && !this.isSettingsLoading) {
      this.loadAutoComposeSettings();
    }
    if (tab === 'templates' && !this.isTemplatesLoading) {
      this.loadRaidTemplates();
    }
  }

  onOperationalRaidChange(): void {
    this.raidDiagnostic = null;
    this.diagnosticErrorMessage = null;
    this.missingPingMessage = null;
    this.missingPingPlayers = [];
    this.reminderPreview = null;
    this.reminderFeedback = null;
    this.compositionTestMessage = null;
    this.autoComposePreview = [];
    this.autoComposePreviewWarnings = [];
    this.autoComposePreviewMessage = null;

    if (this.activeTab === 'diagnostics') {
      this.loadRaidDiagnostic();
    }
  }

  refreshOperationalData(): void {
    this.loadRaids(true);
    this.loadOfficerDashboard();
    this.loadPlanningHealth();
    this.loadPublicationHistory();
    if (this.activeTab === 'diagnostics') {
      this.loadRaidDiagnostic();
    }
  }

  triggerFeedAction(item: OfficerFeedItem): void {
    if (item.primaryAction === 'planner') {
      this.openRaidInPlanner(item.raidId, item.raidDate);
      return;
    }

    this.openRaidOperations(item.raidId, item.primaryAction);
  }

  loadPlanningHealth(): void {
    this.isHealthLoading = true;
    this.healthErrorMessage = null;
    this.raidService.getPlanningHealth().subscribe({
      next: (summary) => {
        this.planningHealth = summary;
        this.isHealthLoading = false;
      },
      error: () => {
        this.isHealthLoading = false;
        this.healthErrorMessage = 'Impossible de charger la sante du planning.';
      }
    });
  }

  loadOfficerDashboard(): void {
    this.isDashboardLoading = true;
    this.dashboardErrorMessage = null;
    this.raidService.getOfficerDashboard().subscribe({
      next: (dashboard) => {
        this.officerDashboard = dashboard;
        this.isDashboardLoading = false;
      },
      error: () => {
        this.officerDashboard = null;
        this.isDashboardLoading = false;
        this.dashboardErrorMessage = 'Impossible de charger le dashboard officier.';
      }
    });
  }

  loadRaidSchedulerStatus(): void {
    this.isSchedulerLoading = true;
    this.schedulerErrorMessage = null;

    this.raidService.getRaidSchedulerStatus().subscribe({
      next: (status) => {
        this.raidSchedulerStatus = status;
        this.isSchedulerLoading = false;
      },
      error: () => {
        this.raidSchedulerStatus = null;
        this.schedulerErrorMessage = "Impossible de charger le scheduler d'import.";
        this.isSchedulerLoading = false;
      }
    });
  }

  saveRaidSchedulerStatus(): void {
    if (!this.raidSchedulerStatus || this.isSchedulerSaving) {
      return;
    }

    this.isSchedulerSaving = true;
    this.schedulerErrorMessage = null;
    this.settingsFeedback = null;

    this.raidService.updateRaidSchedulerStatus(this.raidSchedulerStatus).subscribe({
      next: (status) => {
        this.raidSchedulerStatus = status;
        this.isSchedulerSaving = false;
        this.settingsFeedback = "Scheduler d'import enregistre.";
      },
      error: () => {
        this.isSchedulerSaving = false;
        this.schedulerErrorMessage = "Impossible d'enregistrer le scheduler d'import.";
      }
    });
  }

  loadPublicationHistory(): void {
    this.isHistoryLoading = true;
    this.historyErrorMessage = null;
    this.raidService.getPublicationHistory().subscribe({
      next: (history) => {
        this.publicationHistory = history;
        this.isHistoryLoading = false;
      },
      error: () => {
        this.isHistoryLoading = false;
        this.historyErrorMessage = "Impossible de charger l'historique des publications.";
      }
    });
  }

  loadPlayerEquity(): void {
    this.isEquityLoading = true;
    this.equityErrorMessage = null;
    this.raidService.getPlayerEquity().subscribe({
      next: (summary) => {
        this.playerEquity = summary;
        this.isEquityLoading = false;
      },
      error: () => {
        this.isEquityLoading = false;
        this.equityErrorMessage = "Impossible de charger la vue d'equite.";
      }
    });
  }

  loadRaidTemplates(): void {
    this.isTemplatesLoading = true;
    this.templateFeedback = null;
    this.raidService.getRaidTemplates().subscribe({
      next: (templates) => {
        this.raidTemplates = templates;
        this.isTemplatesLoading = false;
      },
      error: () => {
        this.isTemplatesLoading = false;
        this.templateFeedback = "Impossible de charger les templates.";
      }
    });
  }

  editTemplate(template: RaidTemplateDTO): void {
    this.templateDraft = { ...template };
  }

  saveTemplate(): void {
    if (this.isTemplateSaving || !this.templateDraft.nom?.trim()) {
      return;
    }

    this.isTemplateSaving = true;
    this.templateFeedback = null;
    this.raidService.saveRaidTemplate(this.templateDraft).subscribe({
      next: () => {
        this.isTemplateSaving = false;
        this.templateFeedback = 'Template enregistre.';
        this.templateDraft = this.createEmptyTemplate();
        this.loadRaidTemplates();
      },
      error: () => {
        this.isTemplateSaving = false;
        this.templateFeedback = "Impossible d'enregistrer le template.";
      }
    });
  }

  deleteTemplate(templateId: number | null): void {
    if (!templateId) {
      return;
    }

    this.templateFeedback = null;
    this.raidService.deleteRaidTemplate(templateId).subscribe({
      next: () => {
        this.templateFeedback = 'Template supprime.';
        if (this.templateDraft.id === templateId) {
          this.templateDraft = this.createEmptyTemplate();
        }
        this.loadRaidTemplates();
      },
      error: () => {
        this.templateFeedback = 'Impossible de supprimer ce template.';
      }
    });
  }

  loadAutoComposeSettings(): void {
    this.isSettingsLoading = true;
    this.settingsFeedback = null;
    this.raidService.getAutoComposeSettings().subscribe({
      next: (settings) => {
        this.autoComposeSettings = { ...settings };
        this.isSettingsLoading = false;
      },
      error: () => {
        this.isSettingsLoading = false;
        this.settingsFeedback = "Impossible de charger les regles par defaut.";
      }
    });
  }

  saveAutoComposeSettings(): void {
    if (this.isSettingsSaving) {
      return;
    }

    this.isSettingsSaving = true;
    this.settingsFeedback = null;
    this.raidService.updateAutoComposeSettings(this.autoComposeSettings).subscribe({
      next: (settings) => {
        this.autoComposeSettings = { ...settings };
        this.isSettingsSaving = false;
        this.settingsFeedback = 'Regles auto-compose enregistrees.';
      },
      error: () => {
        this.isSettingsSaving = false;
        this.settingsFeedback = "Impossible d'enregistrer les regles auto-compose.";
      }
    });
  }

  loadRaidDiagnostic(): void {
    if (!this.selectedOperationalRaidId) {
      return;
    }

    this.isDiagnosticLoading = true;
    this.diagnosticErrorMessage = null;
    this.raidService.getRaidDiagnostic(this.selectedOperationalRaidId).subscribe({
      next: (diagnostic) => {
        this.raidDiagnostic = diagnostic;
        this.isDiagnosticLoading = false;
      },
      error: () => {
        this.isDiagnosticLoading = false;
        this.diagnosticErrorMessage = "Impossible de charger le diagnostic de ce raid.";
      }
    });
  }

  rescanSelectedRaid(): void {
    if (!this.selectedOperationalRaidId || this.isRescanningRaid) {
      return;
    }

    this.isRescanningRaid = true;
    this.reminderFeedback = null;
    this.raidService.rescanRaid(this.selectedOperationalRaidId).subscribe({
      next: (message) => {
        this.reminderFeedback = message;
        this.isRescanningRaid = false;
        this.loadRaids(true);
        this.loadRaidDiagnostic();
      },
      error: () => {
        this.reminderFeedback = "Impossible de rescanner ce raid.";
        this.isRescanningRaid = false;
      }
    });
  }

  quickRescanRaid(raidId: number): void {
    if (this.isRescanningRaid) {
      return;
    }

    this.isRescanningRaid = true;
    this.quickActionFeedback = null;
    this.raidService.rescanRaid(raidId).subscribe({
      next: (message) => {
        this.quickActionFeedback = message;
        this.isRescanningRaid = false;
        this.loadRaids(true);
        this.loadOfficerDashboard();
        this.loadPlanningHealth();
      },
      error: () => {
        this.quickActionFeedback = "Impossible de rescanner ce raid.";
        this.isRescanningRaid = false;
      }
    });
  }

  buildMissingPingForSelectedRaid(): void {
    if (!this.selectedOperationalRaidId || this.isBuildingMissingPing) {
      return;
    }

    this.isBuildingMissingPing = true;
    this.missingPingMessage = null;
    this.missingPingPlayers = [];
    this.reminderPreview = null;
    this.reminderFeedback = null;

    this.raidService.getMissingPing(this.selectedOperationalRaidId).subscribe({
      next: async (result: MissingRaidPingDTO) => {
        this.isBuildingMissingPing = false;
        this.missingPingMessage = result.message;
        this.missingPingPlayers = result.missingPlayers ?? [];
        this.reminderPreview = result.message;

        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(result.message);
            this.reminderFeedback = result.missingCount > 0
              ? 'Le rappel a ete copie.'
              : 'Aucun joueur a relancer sur ce raid.';
          } catch {
            this.reminderFeedback = 'Le rappel a ete genere, mais la copie auto est indisponible.';
          }
        }
      },
      error: () => {
        this.isBuildingMissingPing = false;
        this.reminderFeedback = "Impossible de generer le rappel.";
      }
    });
  }

  sendMissingPingToTestChannel(): void {
    if (!this.selectedOperationalRaidId || this.isSendingMissingPingToTest) {
      return;
    }

    this.isSendingMissingPingToTest = true;
    this.reminderFeedback = null;

    this.raidService.sendMissingPingToTestChannel(this.selectedOperationalRaidId).subscribe({
      next: (result: MissingRaidPingDTO) => {
        this.isSendingMissingPingToTest = false;
        this.missingPingMessage = result.message;
        this.missingPingPlayers = result.missingPlayers ?? [];
        this.reminderPreview = result.message;
        this.reminderFeedback = 'Le rappel a ete envoye sur le salon de test.';
      },
      error: () => {
        this.isSendingMissingPingToTest = false;
        this.reminderFeedback = "Impossible d'envoyer le rappel sur le salon de test.";
      }
    });
  }

  publishSavedCompositionToTestChannel(): void {
    const raid = this.selectedOperationalRaid;
    if (!raid || this.isPublishingCompositionTest) {
      return;
    }

    this.isPublishingCompositionTest = true;
    this.compositionTestMessage = null;
    const texte = this.buildSavedCompositionText(raid);

    this.raidService.exportFormattedCompo(
      raid.id,
      texte,
      true,
      AdminPageComponent.TEST_EXPORT_CHANNEL_ID
    ).subscribe({
      next: () => {
        this.isPublishingCompositionTest = false;
        this.compositionTestMessage = `Compo envoyee sur le salon test ${AdminPageComponent.TEST_EXPORT_CHANNEL_ID}.`;
        this.loadPublicationHistory();
      },
      error: (error: HttpErrorResponse) => {
        this.isPublishingCompositionTest = false;
        this.compositionTestMessage = this.extractErrorMessage(
          error,
          "Impossible d'envoyer la compo sauvegardee sur le salon test."
        );
      }
    });
  }

  publishSignupFlowToTestChannel(): void {
    const raid = this.selectedOperationalRaid;
    if (!raid || this.isPublishingSignupFlowTest) {
      return;
    }

    this.isPublishingSignupFlowTest = true;
    this.signupFlowTestMessage = null;

    this.raidService.publishCustomSignupFlowToTestChannel(raid.id).subscribe({
      next: (message) => {
        this.isPublishingSignupFlowTest = false;
        this.signupFlowTestMessage = message;
      },
      error: (error: HttpErrorResponse) => {
        this.isPublishingSignupFlowTest = false;
        this.signupFlowTestMessage = this.extractErrorMessage(
          error,
          "Impossible de publier le prototype d'inscription Discord dans le salon test."
        );
      }
    });
  }

  copySavedCompositionPreview(): void {
    if (!isPlatformBrowser(this.platformId) || !this.savedCompositionPreview) {
      return;
    }

    this.compositionTestMessage = null;
    const texte = this.savedCompositionPreview;

    navigator.clipboard?.writeText(texte).then(
      () => {
        this.compositionTestMessage = 'Le texte de la compo a ete copie.';
      },
      () => {
        this.compositionTestMessage = 'Impossible de copier le texte de la compo.';
      }
    );
  }

  previewAutoComposeSelectedWeek(): void {
    if (!this.selectedOperationalRaidId || this.isPreviewingAutoCompose) {
      return;
    }

    this.isPreviewingAutoCompose = true;
    this.autoComposePreview = [];
    this.autoComposePreviewWarnings = [];
    this.autoComposePreviewMessage = null;

    this.raidService.previewAutoComposeWeek(this.selectedOperationalRaidId, {
      ...this.autoComposeSettings
    }).subscribe({
      next: (result: AutoComposePreviewResultDTO) => {
        this.isPreviewingAutoCompose = false;
        this.autoComposePreview = result.previewRaids ?? [];
        this.autoComposePreviewWarnings = result.warnings ?? [];
        this.autoComposePreviewMessage = this.autoComposePreview.length
          ? 'Previsualisation generee sans ecriture en base.'
          : 'Aucune proposition exploitable pour cette semaine.';
      },
      error: () => {
        this.isPreviewingAutoCompose = false;
        this.autoComposePreview = [];
        this.autoComposePreviewWarnings = ["La previsualisation a echoue."];
      }
    });
  }

  onPseudoChange(event: Event, joueur: JoueurDTO): void {
    const target = event.target as HTMLInputElement;
    const newPseudo = target.value;

    if (!newPseudo.trim()) {
      return;
    }

    this.joueurService.updatePseudoIhm(joueur.id, newPseudo).subscribe(() => {
      joueur.pseudoIhm = newPseudo;
    });
  }

  onEditPlayer(joueur: JoueurDTO): void {
    this.joueurService.getJoueurById(joueur.id).subscribe((loadedJoueur) => {
      if (!loadedJoueur) {
        return;
      }

      this.joueurEnCours = loadedJoueur;
      this.characterFeedback = null;
      this.applyLoadedJoueur(loadedJoueur);
    });
  }

  fermerDialog(): void {
    this.joueurEnCours = null;
    this.personnagesDuJoueur = [];
    this.characterFeedback = null;
    this.isAddingPersonnage = false;
    this.resetMergeState();
  }

  enregistrerPersonnage(perso: PersonnageDTO): void {
    this.joueurService.updatePersonnage(perso).subscribe({
      next: () => {
        console.log(`Personnage ${perso.nom} mis a jour`);
      },
      error: (err) => {
        console.error('Erreur de mise a jour du personnage', err);
      }
    });
  }

  onClasseChange(perso: Partial<PersonnageDTO>): void {
    const specs = this.specialisationsParClasse[perso.classe ?? ''];
    if (specs && !specs.includes(perso.specialisation ?? '')) {
      perso.specialisation = specs[0];
    }
  }

  ajouterPersonnage(): void {
    if (!this.joueurEnCours || this.isAddingPersonnage) {
      return;
    }

    if (!this.nouveauPersonnage.nom?.trim()
      || !this.nouveauPersonnage.classe?.trim()
      || !this.nouveauPersonnage.specialisation?.trim()
      || !this.nouveauPersonnage.role?.trim()) {
      this.characterFeedback = 'Complete le nom, la classe, la specialisation et le role avant de valider.';
      return;
    }

    const personnage: PersonnageDTO = {
      id: 0,
      nom: this.nouveauPersonnage.nom.trim(),
      classe: this.nouveauPersonnage.classe.trim(),
      specialisation: this.nouveauPersonnage.specialisation.trim(),
      role: this.nouveauPersonnage.role.trim(),
      pseudo: this.joueurEnCours.pseudo,
      main: this.nouveauPersonnage.main ?? false
    };

    this.isAddingPersonnage = true;
    this.characterFeedback = null;

    this.joueurService.addPersonnage(this.joueurEnCours.id, personnage).subscribe({
      next: () => {
        this.isAddingPersonnage = false;
        this.characterFeedback = `Personnage ${personnage.nom} ajoute.`;
        this.resetNouveauPersonnage();
        this.reloadCurrentJoueur();
        this.loadJoueurs();
      },
      error: (error: HttpErrorResponse) => {
        this.isAddingPersonnage = false;
        this.characterFeedback = this.extractErrorMessage(error, "Impossible d'ajouter ce personnage.");
      }
    });
  }

  supprimerPersonnage(perso: PersonnageDTO): void {
    if (!this.joueurEnCours) {
      return;
    }

    this.joueurService.deletePersonnage(perso.id).subscribe({
      next: () => {
        const index = this.personnagesDuJoueur.indexOf(perso);
        if (index > -1) {
          this.personnagesDuJoueur.splice(index, 1);
        }
      },
      error: (err) => {
        console.error('Erreur suppression personnage:', err);
      }
    });
  }

  mergeSelectedPersonnages(): void {
    if (!this.joueurEnCours || !this.mergeSourcePersonnageId || !this.mergeTargetPersonnageId || this.isMergingPersonnages) {
      return;
    }

    this.isMergingPersonnages = true;
    this.mergeFeedback = null;

    this.joueurService.mergePersonnages(
      this.joueurEnCours.id,
      this.mergeSourcePersonnageId,
      this.mergeTargetPersonnageId
    ).subscribe({
      next: () => {
        this.isMergingPersonnages = false;
        this.mergeFeedback = 'Fusion terminee. Les references du doublon ont ete transferees.';
        this.reloadCurrentJoueur();
        this.loadJoueurs();
      },
      error: () => {
        this.isMergingPersonnages = false;
        this.mergeFeedback = 'Impossible de fusionner ces personnages.';
      }
    });
  }

  getSpecialisationsPourClasse(classe?: string): string[] {
    return classe && this.specialisationsParClasse[classe]
      ? this.specialisationsParClasse[classe]
      : [];
  }

  formatDateLabel(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date);
  }

  formatDateTimeLabel(value: string | null | undefined): string {
    if (!value) {
      return 'Inconnue';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  get savedCompositionPreview(): string {
    const raid = this.selectedOperationalRaid;
    if (!raid) {
      return '';
    }

    return this.buildSavedCompositionText(raid);
  }

  severityLabel(severity: string): string {
    if (severity === 'high') {
      return 'Critique';
    }
    if (severity === 'medium') {
      return 'A surveiller';
    }
    return 'Info';
  }

  get mergeCandidates(): PersonnageDTO[] {
    return this.personnagesDuJoueur;
  }

  get availableMergeTargets(): PersonnageDTO[] {
    if (!this.mergeSourcePersonnageId) {
      return this.personnagesDuJoueur;
    }

    return this.personnagesDuJoueur.filter((personnage) => personnage.id !== this.mergeSourcePersonnageId);
  }

  messageBadges(message: RaidDiagnosticDTO['resolvedMessage']): string[] {
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
      badges.push('Notification');
    }
    if (message.signupLineCount > 0) {
      badges.push(`${message.signupLineCount} lignes roster`);
    }
    return badges;
  }

  openRaidOperations(raidId: number, tab: 'diagnostics' | 'reminders' | 'tests' = 'diagnostics'): void {
    this.selectedOperationalRaidId = raidId;
    this.onOperationalRaidChange();
    this.selectTab(tab);
  }

  openRaidInPlanner(raidId: number, raidDate: string): void {
    const weekView = this.resolveWeekViewForRaid(raidDate);
    const date = this.extractDayKeyFromDateTime(raidDate);

    this.router.navigate(['/raids'], {
      queryParams: {
        raidId,
        date,
        week: weekView
      }
    });
  }

  private loadJoueurs(): void {
    this.joueurService.getJoueurs().subscribe((data) => {
      this.joueurs = data.filter((joueur) => joueur.raider === true);
    });
  }

  private loadRaids(preserveSelection = false): void {
    const previousSelection = preserveSelection ? this.selectedOperationalRaidId : null;
    this.raidService.getGroupedRaids().subscribe((groupedRaids) => {
      this.groupedRaids = groupedRaids;

      const availableIds = new Set(this.raidOptions.map((option) => option.id));
      if (previousSelection && availableIds.has(previousSelection)) {
        this.selectedOperationalRaidId = previousSelection;
      } else {
        this.selectedOperationalRaidId = this.raidOptions[0]?.id ?? null;
      }
    });
  }

  private resetNouveauPersonnage(): void {
    this.nouveauPersonnage = {
      nom: '',
      classe: '',
      specialisation: '',
      role: '',
      main: false
    };
  }

  private reloadCurrentJoueur(): void {
    if (!this.joueurEnCours) {
      return;
    }

    this.joueurService.getJoueurById(this.joueurEnCours.id).subscribe((loadedJoueur) => {
      if (!loadedJoueur) {
        return;
      }

      this.joueurEnCours = loadedJoueur;
      this.applyLoadedJoueur(loadedJoueur);
    });
  }

  private applyLoadedJoueur(joueur: JoueurDTO): void {
    this.personnagesDuJoueur = [];
    if (joueur.personnageMain) {
      this.personnagesDuJoueur.push(joueur.personnageMain);
    }
    if (joueur.rerolls) {
      this.personnagesDuJoueur.push(...joueur.rerolls);
    }

    this.resetMergeState();
    if (this.personnagesDuJoueur.length >= 2) {
      this.mergeSourcePersonnageId = this.personnagesDuJoueur[0].id;
      this.mergeTargetPersonnageId = this.personnagesDuJoueur[1].id;
    }
  }

  private resetMergeState(): void {
    this.mergeSourcePersonnageId = null;
    this.mergeTargetPersonnageId = null;
    this.isMergingPersonnages = false;
    this.mergeFeedback = null;
  }

  private createEmptyTemplate(): RaidTemplateDTO {
    return {
      id: null,
      nom: '',
      jourSemaine: '',
      heure: '',
      channelId: '',
      messageId: null,
      raidSize: 10,
      targetTanks: 2,
      targetHeals: 2,
      preferMains: true,
      prioritizeBuffCoverage: true,
      huntersFillMissingBuffs: true
    };
  }

  private buildSavedCompositionText(raid: RaidDTO): string {
    const formatGroup = (title: string, group: PersonnageDTO[] | undefined) => {
      const members = group ?? [];
      if (!members.length) {
        return ` **${title}**\n-`;
      }

      const lines = members.map((personnage, index) => {
        const emoji = this.getEmojiTag(personnage.classe, personnage.specialisation);
        return `${emoji} \`${index + 1}\` **${personnage.nom}**`;
      });

      return ` **${title}**\n${lines.join('\n')}`;
    };

    return `${formatGroup('Groupe 1', raid.group1)}\n\n${formatGroup('Groupe 2', raid.group2)}`;
  }

  private getEmojiTag(classe: string, specialisation: string): string {
    const key = `${this.normalizeClassName(classe)}-${this.normalizeSpecName(specialisation)}`;
    const emojiMap: Record<string, string> = {
      'dk-sang': '<:dk_sang:1363215681570603170>',
      'dk-givre': '<:dk_givre:1363215048675299479>',
      'dk-impie': '<:dk_impie:1363215050155884745>',
      'druide-feral': '<:druide_feral:1363215056023588924>',
      'druide-restauration': '<:druide_restauration:1363229950353608787>',
      'druide-equilibre': '<:druide_equilibre:1363215053142364221>',
      'moine-maitre brasseur': '<:moine_maitre_brasseur:1493745119952638103>',
      'moine-tisse brume': '<:moine_tissebrume:1493745192241598595>',
      'moine-marche vent': '<:moine_marchevent:1493745166878638180>',
      'paladin-sacre': '<:paladin_sacre:1363215077452419254>',
      'paladin-retribution': '<:paladin_retribution:1363215074520727735>',
      'paladin-protection': '<:paladin_protection:1363215984923513033>',
      'chaman-elem': '<:chaman_elem:1363215015540166768>',
      'chaman-amelioration': '<:chaman_amelioration:1363214654284894429>',
      'chaman-restauration': '<:chaman_restauration:1363215037757522172>',
      'guerrier-arme': '<:guerrier_arme:1363215059429495024>',
      'guerrier-fury': '<:guerrier_fury:1363215740328611991>',
      'guerrier-protection': '<:guerrier_protection:1363215062927544470>',
      'voleur-combat': '<:voleur_combat:1363215091125850224>',
      'voleur-finesse': '<:voleur_finesse:1363216048442179836>',
      'voleur-assassinat': '<:voleur_assassinat:1363215089427153016>',
      'chasseur-survie': '<:chasseur_survie:1363215042094432286>',
      'chasseur-precision': '<:chasseur_precision:1363215040487887061>',
      'chasseur-bm': '<:chasseur_bm:1363215038911090908>',
      'mage-feu': '<:mage_feu:1363215067826360492>',
      'mage-arcane': '<:mage_arcane:1363215952573104268>',
      'mage-givre': '<:mage_givre:1363215071160959178>',
      'demoniste-demonologie': '<:demoniste_demonologie:1363215045768773873>',
      'demoniste-affliction': '<:demoniste_affliction:1363215043453260068>',
      'demoniste-destruction': '<:demoniste_destruction:1363215047337316624>',
      'pretre-discipline': '<:pretre_discipline:1363215080027853051>',
      'pretre-ombre': '<:pretre_ombre:1363215649018740847>',
      'pretre-sacre': '<:pretre_sacre:1363215084003917984>'
    };

    return emojiMap[key] ?? '??';
  }

  private normalizeClassName(value?: string): string {
    const normalized = this.normalizeValue(value);
    const aliases: Record<string, string> = {
      deathknight: 'dk',
      dk: 'dk',
      druide: 'druide',
      druid: 'druide',
      chasseur: 'chasseur',
      hunter: 'chasseur',
      mage: 'mage',
      moine: 'moine',
      monk: 'moine',
      paladin: 'paladin',
      pretre: 'pretre',
      priest: 'pretre',
      voleur: 'voleur',
      rogue: 'voleur',
      chaman: 'chaman',
      shaman: 'chaman',
      demoniste: 'demoniste',
      warlock: 'demoniste',
      guerrier: 'guerrier',
      warrior: 'guerrier'
    };
    return aliases[normalized] || normalized;
  }

  private normalizeSpecName(value?: string): string {
    const normalized = this.normalizeValue(value);
    const aliases: Record<string, string> = {
      arms: 'arme',
      arme: 'arme',
      assassination: 'assassinat',
      assassinat: 'assassinat',
      arcane: 'arcane',
      balance: 'equilibre',
      bm: 'bm',
      beastmastery: 'bm',
      blood: 'sang',
      brewmaster: 'maitre brasseur',
      combat: 'combat',
      demonology: 'demonologie',
      demonologie: 'demonologie',
      destruction: 'destruction',
      discipline: 'discipline',
      elemental: 'elem',
      elem: 'elem',
      enhancement: 'amelioration',
      amelioration: 'amelioration',
      equilibre: 'equilibre',
      feral: 'feral',
      fire: 'feu',
      feu: 'feu',
      frost: 'givre',
      fury: 'fury',
      guardian: 'gardien',
      gardien: 'gardien',
      givre: 'givre',
      holy: 'sacre',
      impie: 'impie',
      marksmanship: 'precision',
      precision: 'precision',
      'maitre brasseur': 'maitre brasseur',
      mistweaver: 'tisse brume',
      'tisse brume': 'tisse brume',
      ombre: 'ombre',
      shadow: 'ombre',
      protection: 'protection',
      restoration: 'restauration',
      restauration: 'restauration',
      retribution: 'retribution',
      retri: 'retribution',
      sacre: 'sacre',
      subtlety: 'finesse',
      finesse: 'finesse',
      survie: 'survie',
      survival: 'survie',
      unholy: 'impie',
      windwalker: 'marche vent',
      'marche vent': 'marche vent'
    };
    return aliases[normalized] || normalized;
  }

  private normalizeValue(value?: string): string {
    if (!value) {
      return '';
    }

    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['`]/g, ' ')
      .replace(/[_-]+/g, ' ')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private resolveWeekViewForRaid(raidDate: string): 'current' | 'next' {
    const raid = new Date(raidDate);
    const currentWeekStart = this.getResetWeekStart(new Date());
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);

    return raid >= nextWeekStart ? 'next' : 'current';
  }

  private extractDayKeyFromDateTime(value: string): string {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getResetWeekStart(date: Date): Date {
    const copy = new Date(date);
    const daysSinceReset = (copy.getDay() + 4) % 7;
    copy.setHours(0, 0, 0, 0);
    copy.setDate(copy.getDate() - daysSinceReset);
    return copy;
  }

  private feedSeverityWeight(severity: OfficerFeedItem['severity']): number {
    if (severity === 'high') {
      return 3;
    }
    if (severity === 'medium') {
      return 2;
    }
    return 1;
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const payload = error?.error;
    if (typeof payload === 'string' && payload.trim()) {
      return payload.trim();
    }

    if (payload?.message) {
      return payload.message;
    }

    if (error?.message) {
      return `${fallback} (${error.message})`;
    }

    return fallback;
  }
}

