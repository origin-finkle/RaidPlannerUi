import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RaidService } from '../../../core/services/raid.service';
import { JoueurService } from '../../../core/services/joueur.service';
import {
  AutoComposePreviewRaidDTO,
  AutoComposePreviewResultDTO,
  AutoComposeWeekRequestDTO,
  AutoComposeWeekResultDTO,
  BenchRecommendationDTO,
  CreateRaidRequestDTO,
  DiscordChannelOptionDTO,
  JoueurDTO,
  RaidTemplateDTO,
  RaidConfirmationSummaryDTO,
  RaidCompositionStateDTO,
  RaidPublicationComparisonDTO,
  RaidDayResponse,
  PersonnageDTO,
  RaidDTO,
  RaidCompositionDTO
} from '../../../core/models/raid.model';
import { RaidCompositionComponent } from '../raid-composition/raid-composition.component';
import {DragDropModule} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-raids-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RaidCompositionComponent, DragDropModule],
  templateUrl: './raids-page.component.html',
  styleUrls: ['./raids-page.component.scss']
})
export class RaidsPageComponent implements OnInit {
  private raidService = inject(RaidService);
  private joueurService = inject(JoueurService);
  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private initialPreferredDayDate: string | null = null;
  private initialPreferredRaidId: number | null = null;

  allGroupedRaids: RaidDayResponse[] = [];
  allJoueurs: JoueurDTO[] = [];
  selectedDay: RaidDayResponse | null = null;
  selectedRaid: RaidDTO | null = null;
  isAutoComposing = false;
  isPreviewingAutoCompose = false;
  isUpdatingCompositionState = false;
  isComparisonLoading = false;
  isConfirmationLoading = false;
  isBenchLoading = false;
  isLoadingDefaultRules = false;
  isLoadingTemplates = false;
  isPilotPanelExpanded = true;
  autoComposeMessage: string | null = null;
  autoComposeWarnings: string[] = [];
  autoComposePreview: AutoComposePreviewRaidDTO[] = [];
  autoComposePreviewWarnings: string[] = [];
  publicationComparison: RaidPublicationComparisonDTO | null = null;
  confirmationSummary: RaidConfirmationSummaryDTO | null = null;
  benchRecommendations: BenchRecommendationDTO | null = null;
  comparisonErrorMessage: string | null = null;
  confirmationErrorMessage: string | null = null;
  benchErrorMessage: string | null = null;
  createRaidMessage: string | null = null;
  templates: RaidTemplateDTO[] = [];
  discordChannelOptions: DiscordChannelOptionDTO[] = [];
  selectedTemplateId: number | null = null;
  selectedWeekView: 'current' | 'next' = 'current';
  isCreateRaidPanelOpen = false;
  isCreatingRaid = false;
  autoComposeConfig: AutoComposeWeekRequestDTO = {
    maxRaids: 2,
    targetTanks: 2,
    targetHeals: 2,
    preferMains: true,
    balanceAcrossRaids: true,
    prioritizeBuffCoverage: true,
    huntersFillMissingBuffs: true
  };
  createRaidDraft: CreateRaidRequestDTO = this.buildCreateRaidDraft();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const weekParam = this.route.snapshot.queryParamMap.get('week');
    const raidIdParam = this.route.snapshot.queryParamMap.get('raidId');
    this.initialPreferredDayDate = this.route.snapshot.queryParamMap.get('date');
    this.initialPreferredRaidId = raidIdParam ? Number(raidIdParam) : null;

    if (weekParam === 'current' || weekParam === 'next') {
      this.selectedWeekView = weekParam;
    }

    this.loadAutoComposeDefaults();
    this.loadTemplates();
    this.loadDiscordChannels();
    this.loadAllJoueurs();
    this.loadRaids(this.initialPreferredDayDate, this.initialPreferredRaidId);
  }

  get canSubmitCreateRaid(): boolean {
    return !this.isCreatingRaid
      && !!this.createRaidDraft.nom?.trim()
      && !!this.createRaidDraft.date?.trim()
      && !!this.createRaidDraft.channelId?.trim();
  }

  get availableDiscordChannelOptions(): Array<{ id: string; label: string }> {
    return this.discordChannelOptions.map((channel) => ({
      id: channel.id,
      label: channel.label
    }));
  }

  openCreateRaidPanel(): void {
    this.isCreateRaidPanelOpen = true;
    this.createRaidMessage = null;
    this.createRaidDraft = this.buildCreateRaidDraft();
  }

  closeCreateRaidPanel(): void {
    this.isCreateRaidPanelOpen = false;
    this.isCreatingRaid = false;
    this.createRaidMessage = null;
    this.createRaidDraft = this.buildCreateRaidDraft();
  }

  createManualRaid(): void {
    if (!this.canSubmitCreateRaid) {
      return;
    }

    this.isCreatingRaid = true;
    this.createRaidMessage = null;

    this.raidService.createManualRaid({
      nom: this.createRaidDraft.nom.trim(),
      date: this.createRaidDraft.date,
      channelId: this.createRaidDraft.channelId.trim()
    }).subscribe({
      next: (createdRaid) => {
        const raidDate = createdRaid.heure.slice(0, 10);
        this.selectedWeekView = this.resolveWeekViewForDate(raidDate);
        this.isCreatingRaid = false;
        this.isCreateRaidPanelOpen = false;
        this.createRaidMessage = `Raid "${createdRaid.nom}" cree.`;
        this.loadRaids(raidDate, createdRaid.id);
      },
      error: (error) => {
        this.isCreatingRaid = false;
        this.createRaidMessage = error?.error?.message || (typeof error?.error === 'string' ? error.error : "Impossible de creer ce raid.");
      }
    });
  }

  selectDay(day: RaidDayResponse): void {
    if (this.selectedDay && this.selectedRaid) {
      this.saveCurrentComposition(this.selectedRaid);
    }

    this.selectedDay = day;
    this.selectedRaid = day.raids[0] ?? null;
    this.resetAutoComposePreview();
    this.loadSelectedRaidInsights();
    this.autoSelectTemplateForDay();
    this.syncRouteSelection();
  }

  onRaidChange(raid: RaidDTO): void {
    if (this.selectedRaid) {
      this.saveCurrentComposition(this.selectedRaid);
    }
    this.selectedRaid = raid;
    this.resetAutoComposePreview();
    this.loadSelectedRaidInsights();
    this.autoSelectTemplateForDay();
    this.syncRouteSelection();
  }

  selectWeekView(weekView: 'current' | 'next'): void {
    if (this.selectedWeekView === weekView) {
      return;
    }

    if (this.selectedDay && this.selectedRaid) {
      this.saveCurrentComposition(this.selectedRaid);
    }

    this.selectedWeekView = weekView;
    this.restoreSelection(null, null);
    this.resetAutoComposePreview();
    this.loadSelectedRaidInsights();
    this.syncRouteSelection();
  }

  autoComposeSelectedWeek(): void {
    if (!this.selectedRaid || this.isAutoComposing) {
      return;
    }

    this.autoComposeMessage = null;
    this.autoComposeWarnings = [];
    this.isAutoComposing = true;

    const currentRaidId = this.selectedRaid.id;
    const currentDayDate = this.selectedDay?.date ?? null;

    this.raidService.autoComposeWeek(currentRaidId, this.autoComposeConfig).subscribe({
      next: (result) => {
        this.autoComposeMessage = this.buildAutoComposeMessage(result);
        this.autoComposeWarnings = result.warnings ?? [];
        this.resetAutoComposePreview();
        this.loadRaids(currentDayDate, result.updatedRaidIds?.[0] ?? currentRaidId);
      },
      error: () => {
        this.isAutoComposing = false;
        this.autoComposeMessage = "La generation automatique n'a pas abouti.";
        this.autoComposeWarnings = [];
      }
      });
  }

  markSelectedRaidReady(): void {
    this.updateSelectedRaidCompositionState({ status: 'READY' });
  }

  markSelectedRaidDraft(): void {
    this.updateSelectedRaidCompositionState({ status: 'DRAFT' });
  }

  toggleSelectedRaidLock(): void {
    if (!this.selectedRaid) {
      return;
    }

    this.updateSelectedRaidCompositionState({ locked: !this.selectedRaid.compositionLocked });
  }

  previewAutoComposeSelectedWeek(): void {
    if (!this.selectedRaid || this.isPreviewingAutoCompose) {
      return;
    }

    this.isPreviewingAutoCompose = true;
    this.autoComposeMessage = null;
    this.autoComposeWarnings = [];
    this.autoComposePreview = [];
    this.autoComposePreviewWarnings = [];

    this.raidService.previewAutoComposeWeek(this.selectedRaid.id, this.autoComposeConfig).subscribe({
      next: (result: AutoComposePreviewResultDTO) => {
        this.isPreviewingAutoCompose = false;
        this.autoComposePreview = result.previewRaids ?? [];
        this.autoComposePreviewWarnings = result.warnings ?? [];
      },
      error: () => {
        this.isPreviewingAutoCompose = false;
        this.autoComposePreview = [];
        this.autoComposePreviewWarnings = ["La previsualisation a echoue."];
      }
    });
  }

  onCompositionChanged(event: { raidId: number; group1: PersonnageDTO[]; group2: PersonnageDTO[] }) {
    const raid = this.selectedDay?.raids.find(r => r.id === event.raidId);
    if (raid) {
      const enrich = (p: PersonnageDTO): PersonnageDTO => {
        const joueur = raid.joueurDTOList.find(j =>
          j.personnageMain?.nom === p.nom || j.rerolls.some(r => r.nom === p.nom)
        );

        const found = [joueur?.personnageMain, ...(joueur?.rerolls || [])].find(per => per?.nom === p.nom);
        return found ? { ...p, specialisation: found.specialisation } : p;
      };

      raid.group1 = event.group1.map(enrich);
      raid.group2 = event.group2.map(enrich);
        this.raidService.saveComposition({
        raidId: raid.id,
        group1: raid.group1,
        group2: raid.group2
        }).subscribe({
          next: () => {
            if (raid.compositionStatus === 'PUBLISHED') {
              raid.compositionStatus = 'READY';
            }
            this.loadSelectedRaidInsights();
        },
        error: () => {
          this.autoComposeMessage = "La composition n'a pas pu etre enregistree.";
        }
      });
    }
  }

  onManualSignupAdded(personnageId: number): void {
    if (!this.selectedRaid || !personnageId) {
      return;
    }

    const currentRaidId = this.selectedRaid.id;
    const currentDayDate = this.selectedDay?.date ?? null;

    this.raidService.addManualSignup(currentRaidId, personnageId).subscribe({
      next: () => {
        this.applyManualSignupLocally(personnageId);
        this.autoComposeMessage = 'Joueur ajoute manuellement au raid.';
        this.autoComposeWarnings = [];
        this.loadRaids(currentDayDate, currentRaidId);
      },
      error: () => {
        this.autoComposeMessage = "Impossible d'ajouter ce joueur manuellement au raid.";
        this.autoComposeWarnings = [];
      }
    });
  }

  onManualSignupRemoved(personnageId: number): void {
    if (!this.selectedRaid || !personnageId) {
      return;
    }

    const currentRaidId = this.selectedRaid.id;
    const currentDayDate = this.selectedDay?.date ?? null;

    this.raidService.removeManualSignup(currentRaidId, personnageId).subscribe({
      next: () => {
        this.applyManualSignupRemovalLocally(personnageId);
        this.autoComposeMessage = 'Ajout manuel retire du raid.';
        this.autoComposeWarnings = [];
        this.loadRaids(currentDayDate, currentRaidId);
      },
      error: () => {
        this.autoComposeMessage = "Impossible de retirer cet ajout manuel.";
        this.autoComposeWarnings = [];
      }
    });
  }

  private applyManualSignupLocally(personnageId: number): void {
    if (!this.selectedRaid) {
      return;
    }

    const joueur = this.allJoueurs.find((entry) =>
      entry.personnageMain?.id === personnageId || entry.rerolls?.some((personnage) => personnage.id === personnageId)
    );

    if (!joueur) {
      return;
    }

    const alreadyPresent = (this.selectedRaid.joueurDTOList ?? []).some((entry) => entry.id === joueur.id);
    if (alreadyPresent) {
      return;
    }

    this.selectedRaid = {
      ...this.selectedRaid,
      joueurDTOList: [
        ...(this.selectedRaid.joueurDTOList ?? []),
        {
          ...joueur,
          statutParticipation: 'TITULAIRE',
          commentaireInscription: 'MANUAL_OFFICER_ADD'
        }
      ]
    };

    if (this.selectedDay) {
      this.selectedDay = {
        ...this.selectedDay,
        raids: this.selectedDay.raids.map((raid) =>
          raid.id === this.selectedRaid?.id ? this.selectedRaid! : raid
        )
        };
      }
    }

  private applyManualSignupRemovalLocally(personnageId: number): void {
    if (!this.selectedRaid) {
      return;
    }

    const joueur = this.allJoueurs.find((entry) =>
      entry.personnageMain?.id === personnageId || entry.rerolls?.some((personnage) => personnage.id === personnageId)
    );

    if (!joueur) {
      return;
    }

    const characterNames = new Set(
      [joueur.personnageMain, ...(joueur.rerolls ?? [])]
        .filter((personnage): personnage is PersonnageDTO => !!personnage)
        .map((personnage) => personnage.nom)
    );

    this.selectedRaid = {
      ...this.selectedRaid,
      joueurDTOList: (this.selectedRaid.joueurDTOList ?? []).filter((entry) => entry.id !== joueur.id),
      group1: (this.selectedRaid.group1 ?? []).filter((personnage) => !characterNames.has(personnage.nom)),
      group2: (this.selectedRaid.group2 ?? []).filter((personnage) => !characterNames.has(personnage.nom))
    };

    if (this.selectedDay) {
      this.selectedDay = {
        ...this.selectedDay,
        raids: this.selectedDay.raids.map((raid) =>
          raid.id === this.selectedRaid?.id ? this.selectedRaid! : raid
        )
      };
    }
  }

  private saveCurrentComposition(raid: RaidDTO): void {
    const toDTO = (group: PersonnageDTO[]): PersonnageDTO[] =>
      group.map(p => ({
        id: p.id,
        nom: p.nom,
        classe: p.classe,
        specialisation: p.specialisation,
        role: p.role,
        pseudo: p.pseudo ?? 'inconnu',
        main: p.main
      }));

    const payload: RaidCompositionDTO = {
      raidId: raid.id,
      group1: toDTO(raid.group1 ?? []),
      group2: toDTO(raid.group2 ?? [])
    };

    this.raidService.saveComposition(payload).subscribe(() => {
      console.log(`Composition du raid ${raid.id} sauvegardee.`);
    });
  }

  get totalRaidCount(): number {
    return this.groupedRaids.reduce((count, day) => count + day.raids.length, 0);
  }

  get totalPlayerCount(): number {
    return this.selectedRaid?.joueurDTOList?.length ?? 0;
  }

  get totalAssignedCount(): number {
    return (this.selectedRaid?.group1?.length ?? 0) + (this.selectedRaid?.group2?.length ?? 0);
  }

  get canLockSelectedRaid(): boolean {
    return !!this.selectedRaid && !this.selectedRaid.compositionLocked;
  }

  get hasPublishedComparison(): boolean {
    return !!this.publicationComparison?.hasPublishedSnapshot;
  }

  get validationSummary(): { level: 'success' | 'warning' | 'danger'; issues: string[]; assignedCount: number; raidSize: number; tankCount: number; healCount: number } | null {
    if (!this.selectedRaid) {
      return null;
    }

    const characters = [...(this.selectedRaid.group1 ?? []), ...(this.selectedRaid.group2 ?? [])];
    const raidSize = this.getTargetRaidSize();
    const tankCount = characters.filter((character) => this.normalizeValue(character.role) === 'tank').length;
    const healCount = characters.filter((character) => this.normalizeValue(character.role) === 'heal').length;
    const targetTanks = this.autoComposeConfig.targetTanks ?? 2;
    const targetHeals = this.autoComposeConfig.targetHeals ?? 2;
    const issues: string[] = [];

    if (characters.length < raidSize) {
      issues.push(`Il manque ${raidSize - characters.length} place(s) pour atteindre ${raidSize}/${raidSize}.`);
    }
    if (tankCount < targetTanks) {
      issues.push(`Tanks insuffisants: ${tankCount}/${targetTanks}.`);
    }
    if (healCount < targetHeals) {
      issues.push(`Heals insuffisants: ${healCount}/${targetHeals}.`);
    }

    const duplicatePlayers = this.findDuplicatePlayers(characters);
    if (duplicatePlayers.length) {
      issues.push(`Doublon joueur detecte: ${duplicatePlayers.join(', ')}.`);
    }

    const missingBuffs = this.getMissingKeyBuffs(characters);
    if (missingBuffs.length) {
      issues.push(`Buffs cles manquants: ${missingBuffs.join(', ')}.`);
    }

    const level = issues.length === 0
      ? 'success'
      : (characters.length >= raidSize - 1 && tankCount >= targetTanks && healCount >= targetHeals ? 'warning' : 'danger');

    return {
      level,
      issues,
      assignedCount: characters.length,
      raidSize,
      tankCount,
      healCount
    };
  }

  get selectedWeekLabel(): string | null {
    const range = this.getDisplayedWeekRange();
    return `${this.formatShortDate(range.start)} au ${this.formatShortDate(range.end)}`;
  }

  get publishActionLabel(): string {
    if (!this.selectedRaid) {
      return 'Publier sur Discord';
    }

    return this.selectedRaid.lastPublishedAt || this.selectedRaid.compositionStatus === 'PUBLISHED'
      ? 'Mettre a jour Discord'
      : 'Publier sur Discord';
  }

  get publishActionHint(): string {
    if (!this.selectedRaid) {
      return 'Publie la compo actuelle dans le salon du raid.';
    }

    if (this.selectedRaid.compositionLocked && !this.selectedRaid.lastPublishedAt) {
      return 'Compo verrouillee et prete a etre publiee proprement dans le salon du raid.';
    }

    if (this.selectedRaid.lastPublishedAt || this.selectedRaid.compositionStatus === 'PUBLISHED') {
      return 'Le message du bot deja poste sera remplace par une mise a jour de la compo.';
    }

    return 'Premiere publication de la compo dans le salon Discord du raid.';
  }

  get publicationTone(): 'success' | 'warning' | 'danger' | 'neutral' {
    if (!this.selectedRaid) {
      return 'neutral';
    }

    if (this.selectedRaid.compositionStatus === 'PUBLISHED' && this.publicationComparison && this.publicationComparison.currentOnlyPlayers.length === 0 && this.publicationComparison.publishedOnlyPlayers.length === 0) {
      return 'success';
    }

    if (this.selectedRaid.lastPublishedAt || this.selectedRaid.compositionStatus === 'PUBLISHED') {
      return 'warning';
    }

    return this.selectedRaid.compositionLocked ? 'success' : 'neutral';
  }

  get confirmationTone(): 'success' | 'warning' | 'danger' | 'neutral' {
    if (!this.confirmationSummary || this.confirmationSummary.totalPlayers === 0) {
      return 'neutral';
    }

    if (this.confirmationSummary.pendingCount === 0) {
      return 'success';
    }

    if (this.confirmationSummary.confirmedCount === 0) {
      return 'danger';
    }

    return 'warning';
  }

  get benchTone(): 'success' | 'warning' | 'danger' | 'neutral' {
    if (!this.benchRecommendations) {
      return 'neutral';
    }

    if (this.benchRecommendations.warnings?.length) {
      return 'warning';
    }

    if (this.benchRecommendations.benchCandidates.length > 0 || this.benchRecommendations.reserveCandidates.length > 0) {
      return 'success';
    }

    return 'neutral';
  }

  togglePilotPanel(): void {
    this.isPilotPanelExpanded = !this.isPilotPanelExpanded;
  }

  toneLabel(tone: 'success' | 'warning' | 'danger' | 'neutral'): string {
    switch (tone) {
      case 'success':
        return 'OK';
      case 'warning':
        return 'A suivre';
      case 'danger':
        return 'Prioritaire';
      default:
        return 'Neutre';
    }
  }

  pilotPanelToggleLabel(): string {
    return this.isPilotPanelExpanded ? 'Masquer le pilotage' : 'Afficher le pilotage';
  }

  signalCardClass(tone: 'success' | 'warning' | 'danger' | 'neutral'): string {
    return `signal-card signal-card--${tone}`;
  }

  get groupedRaids(): RaidDayResponse[] {
    return this.allGroupedRaids.filter((day) => this.belongsToSelectedWeek(day.date));
  }

  get weekBoardDays(): Array<{ date: string; raids: RaidDTO[]; isSelected: boolean }> {
    const range = this.getDisplayedWeekRange();
    const days: Array<{ date: string; raids: RaidDTO[]; isSelected: boolean }> = [];

    for (let offset = 0; offset < 7; offset += 1) {
      const current = new Date(range.start);
      current.setDate(range.start.getDate() + offset);
      const date = this.toDayKey(current);
      const existing = this.groupedRaids.find((day) => day.date === date);

      days.push({
        date,
        raids: existing?.raids ?? [],
        isSelected: this.selectedDay?.date === date
      });
    }

    return days;
  }

  formatDateLabel(dateString: string): string {
    const date = this.parseDayDate(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatWeekdayShort(dateString: string): string {
    const date = this.parseDayDate(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  }

  formatDayChipNumber(dateString: string): string {
    const date = this.parseDayDate(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  selectRaidFromWeekBoard(dateString: string, raid: RaidDTO): void {
    const day = this.groupedRaids.find((entry) => entry.date === dateString);
    if (!day) {
      return;
    }

    if (this.selectedDay?.date !== day.date) {
      if (this.selectedDay && this.selectedRaid) {
        this.saveCurrentComposition(this.selectedRaid);
      }
      this.selectedDay = day;
    }

    if (this.selectedRaid?.id !== raid.id) {
      if (this.selectedRaid && this.selectedRaid.id !== raid.id) {
        this.saveCurrentComposition(this.selectedRaid);
      }
      this.selectedRaid = raid;
    }

    this.resetAutoComposePreview();
    this.loadSelectedRaidInsights();
    this.autoSelectTemplateForDay();
    this.syncRouteSelection();
  }

  raidStatusBadge(raid: RaidDTO): string {
    if (raid.compositionLocked) {
      return 'Verrouillee';
    }
    if (raid.compositionStatus === 'PUBLISHED') {
      return 'Publiee';
    }
    if (raid.compositionStatus === 'READY') {
      return 'Prete';
    }
    return 'Brouillon';
  }

  raidStatusTone(raid: RaidDTO): 'success' | 'warning' | 'danger' | 'neutral' {
    if (raid.compositionStatus === 'PUBLISHED') {
      return 'success';
    }
    if (raid.compositionLocked || raid.compositionStatus === 'READY') {
      return 'warning';
    }
    if ((raid.group1?.length ?? 0) + (raid.group2?.length ?? 0) === 0) {
      return 'danger';
    }
    return 'neutral';
  }

  raidStatusClass(raid: RaidDTO): string {
    return `week-raid-card__badge week-raid-card__badge--${this.raidStatusTone(raid)}`;
  }

  getRaidWeekRange(dateStr: string): { start: Date; end: Date } {
    const date = this.parseDayDate(dateStr);
    const start = this.getResetWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  getUsedCharactersForResetWeek(currentDate: string): PersonnageDTO[] {
    const date = this.parseDayDate(currentDate);
    const start = this.getResetWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const used: PersonnageDTO[] = [];

    this.groupedRaids.forEach(day => {
      const d = this.parseDayDate(day.date);
      if (d >= start && d <= end) {
        day.raids.forEach(raid => {
          const usedAt = d.toISOString();

          (raid.group1 || []).forEach(p => {
            used.push({ ...p, usedAt });
          });

          (raid.group2 || []).forEach(p => {
            used.push({ ...p, usedAt });
          });
        });
      }
    });

    return used;
  }

  getUsedCharactersForSelectedDay(): PersonnageDTO[] {
    const date = this.selectedDay?.date;
    return date ? this.getUsedCharactersForResetWeek(date) : [];
  }

  isRaidSelected(raid: RaidDTO): boolean {
    return this.selectedRaid?.id === raid.id;
  }

  formatRaidDate(heure: string): string {
    const date = new Date(heure);
    return date.toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  compositionStatusLabel(status: string | null | undefined): string {
    switch (status) {
      case 'READY':
        return 'Prete';
      case 'PUBLISHED':
        return 'Publiee';
      default:
        return 'Brouillon';
    }
  }

  validationTitle(level: 'success' | 'warning' | 'danger'): string {
    if (level === 'success') {
      return 'Compo validee';
    }
    if (level === 'warning') {
      return 'Presque prete';
    }
    return 'Compo a corriger';
  }

  applySelectedTemplate(): void {
    const template = this.templates.find((entry) => entry.id === this.selectedTemplateId);
    if (!template) {
      return;
    }

    this.autoComposeConfig = {
      ...this.autoComposeConfig,
      targetTanks: template.targetTanks ?? this.autoComposeConfig.targetTanks,
      targetHeals: template.targetHeals ?? this.autoComposeConfig.targetHeals,
      preferMains: template.preferMains ?? this.autoComposeConfig.preferMains,
      prioritizeBuffCoverage: template.prioritizeBuffCoverage ?? this.autoComposeConfig.prioritizeBuffCoverage,
      huntersFillMissingBuffs: template.huntersFillMissingBuffs ?? this.autoComposeConfig.huntersFillMissingBuffs
    };
  }

  private sortGroupedRaidsByResetWeek(days: RaidDayResponse[]): RaidDayResponse[] {
    return [...days].sort((left, right) => {
      const leftDate = this.parseDayDate(left.date);
      const rightDate = this.parseDayDate(right.date);
      const leftWeekStart = this.getResetWeekStart(leftDate);
      const rightWeekStart = this.getResetWeekStart(rightDate);

      const weekComparison = leftWeekStart.getTime() - rightWeekStart.getTime();
      if (weekComparison !== 0) {
        return weekComparison;
      }

      return this.getResetDayIndex(leftDate) - this.getResetDayIndex(rightDate);
    });
  }

  private getResetWeekStart(date: Date): Date {
    const start = new Date(date);
    const daysSinceReset = this.getResetDayIndex(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(date.getDate() - daysSinceReset);
    return start;
  }

  private getResetDayIndex(date: Date): number {
    return (date.getDay() + 4) % 7;
  }

  private getDisplayedWeekRange(): { start: Date; end: Date } {
    const start = this.getResetWeekStart(new Date());

    if (this.selectedWeekView === 'next') {
      start.setDate(start.getDate() + 7);
    }

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  private belongsToSelectedWeek(dateString: string): boolean {
    const date = this.parseDayDate(dateString);
    const range = this.getDisplayedWeekRange();
    return date >= range.start && date <= range.end;
  }

  private loadRaids(preferredDayDate?: string | null, preferredRaidId?: number | null): void {
    this.raidService.getGroupedRaids().subscribe({
      next: (res) => {
        this.allGroupedRaids = this.sortGroupedRaidsByResetWeek(res);
        this.restoreSelection(preferredDayDate, preferredRaidId);
        this.isAutoComposing = false;
        this.isPreviewingAutoCompose = false;
        this.loadSelectedRaidInsights();
        this.syncRouteSelection();
      },
      error: () => {
        this.isAutoComposing = false;
        this.isPreviewingAutoCompose = false;
      }
    });
  }

  private restoreSelection(preferredDayDate?: string | null, preferredRaidId?: number | null): void {
    if (this.groupedRaids.length === 0) {
      this.selectedDay = null;
      this.selectedRaid = null;
      return;
    }

    if (preferredRaidId != null) {
      const containingDay = this.groupedRaids.find((day) => day.raids.some((raid) => raid.id === preferredRaidId));
      if (containingDay) {
        this.selectedDay = containingDay;
        this.selectedRaid = containingDay.raids.find((raid) => raid.id === preferredRaidId) ?? containingDay.raids[0] ?? null;
        return;
      }
    }

    const preferredDay = preferredDayDate
      ? this.groupedRaids.find((day) => day.date === preferredDayDate)
      : null;
    const selectedDay = preferredDay ?? this.groupedRaids[0];
    this.selectedDay = selectedDay;

    const preferredRaid = preferredRaidId != null
      ? selectedDay.raids.find((raid) => raid.id === preferredRaidId)
      : null;
    this.selectedRaid = preferredRaid ?? selectedDay.raids[0] ?? null;
  }

  private loadPublicationComparison(): void {
    if (!this.selectedRaid) {
      this.publicationComparison = null;
      this.comparisonErrorMessage = null;
      return;
    }

    this.isComparisonLoading = true;
    this.comparisonErrorMessage = null;
    this.raidService.getPublicationComparison(this.selectedRaid.id).subscribe({
      next: (comparison) => {
        this.publicationComparison = comparison;
        this.isComparisonLoading = false;
      },
      error: () => {
        this.publicationComparison = null;
        this.comparisonErrorMessage = "Impossible de charger la comparaison avec la derniere publication.";
        this.isComparisonLoading = false;
      }
    });
  }

  private loadRaidConfirmations(): void {
    if (!this.selectedRaid) {
      this.confirmationSummary = null;
      this.confirmationErrorMessage = null;
      return;
    }

    this.isConfirmationLoading = true;
    this.confirmationErrorMessage = null;
    this.raidService.getRaidConfirmations(this.selectedRaid.id).subscribe({
      next: (summary) => {
        this.confirmationSummary = summary;
        this.isConfirmationLoading = false;
      },
      error: () => {
        this.confirmationSummary = null;
        this.confirmationErrorMessage = "Impossible de charger les confirmations.";
        this.isConfirmationLoading = false;
      }
    });
  }

  private loadBenchRecommendations(): void {
    if (!this.selectedRaid) {
      this.benchRecommendations = null;
      this.benchErrorMessage = null;
      return;
    }

    this.isBenchLoading = true;
    this.benchErrorMessage = null;
    this.raidService.getBenchRecommendations(this.selectedRaid.id).subscribe({
      next: (recommendations) => {
        this.benchRecommendations = recommendations;
        this.isBenchLoading = false;
      },
      error: () => {
        this.benchRecommendations = null;
        this.benchErrorMessage = "Impossible de charger les suggestions de rotation.";
        this.isBenchLoading = false;
      }
    });
  }

  private loadSelectedRaidInsights(): void {
    this.loadPublicationComparison();
    this.loadRaidConfirmations();
    this.loadBenchRecommendations();
  }

  private updateSelectedRaidCompositionState(payload: { status?: 'DRAFT' | 'READY' | 'PUBLISHED'; locked?: boolean }): void {
    if (!this.selectedRaid || this.isUpdatingCompositionState) {
      return;
    }

    this.isUpdatingCompositionState = true;
    this.raidService.updateCompositionState(this.selectedRaid.id, payload).subscribe({
      next: (state: RaidCompositionStateDTO) => {
        if (this.selectedRaid) {
          this.selectedRaid.compositionStatus = state.status;
          this.selectedRaid.compositionLocked = state.locked;
          this.selectedRaid.lastPublishedAt = state.lastPublishedAt;
        }
        this.isUpdatingCompositionState = false;
      },
      error: () => {
        this.autoComposeMessage = "Impossible de mettre a jour le statut de composition.";
        this.isUpdatingCompositionState = false;
      }
    });
  }

  private loadAutoComposeDefaults(): void {
    this.isLoadingDefaultRules = true;
    this.raidService.getAutoComposeSettings().subscribe({
      next: (settings) => {
        this.autoComposeConfig = { ...settings };
        this.isLoadingDefaultRules = false;
      },
      error: () => {
        this.isLoadingDefaultRules = false;
      }
    });
  }

  private loadTemplates(): void {
    this.isLoadingTemplates = true;
    this.raidService.getRaidTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.isLoadingTemplates = false;
        this.autoSelectTemplateForDay();
      },
      error: () => {
        this.isLoadingTemplates = false;
      }
    });
  }

  private loadDiscordChannels(): void {
    this.raidService.getWritableDiscordChannels().subscribe({
      next: (channels) => {
        this.discordChannelOptions = channels ?? [];
        if (!this.createRaidDraft.channelId && this.discordChannelOptions.length) {
          this.createRaidDraft = {
            ...this.createRaidDraft,
            channelId: this.discordChannelOptions[0].id
          };
        }
      },
      error: () => {
        this.discordChannelOptions = [];
      }
    });
  }

  private loadAllJoueurs(): void {
    this.joueurService.getJoueurs().subscribe({
      next: (joueurs) => {
        this.allJoueurs = joueurs ?? [];
      },
      error: () => {
        this.allJoueurs = [];
      }
    });
  }

  private autoSelectTemplateForDay(): void {
    if (!this.selectedDay || !this.templates.length) {
      return;
    }

    const weekday = this.formatDateLabel(this.selectedDay.date).split(' ')[0].toLowerCase();
    const matchingTemplate = this.templates.find((template) =>
      this.normalizeValue(template.jourSemaine) === this.normalizeValue(weekday)
    );

    this.selectedTemplateId = matchingTemplate?.id ?? null;
  }

  private findDuplicatePlayers(characters: PersonnageDTO[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const character of characters) {
      const playerKey = this.normalizeValue(character.pseudo ?? character.nom);
      if (!playerKey) {
        continue;
      }
      if (seen.has(playerKey)) {
        duplicates.add(character.pseudo ?? character.nom);
      } else {
        seen.add(playerKey);
      }
    }

    return [...duplicates];
  }

  private getMissingKeyBuffs(characters: PersonnageDTO[]): string[] {
    const keyBuffs: Array<{ label: string; matches: (character: PersonnageDTO) => boolean }> = [
      { label: 'Stats', matches: (character) => ['druide', 'moine', 'paladin'].includes(this.normalizeValue(character.classe)) },
      { label: 'Endurance', matches: (character) => ['pretre', 'demoniste', 'guerrier'].includes(this.normalizeValue(character.classe)) },
      { label: "Puissance d'attaque", matches: (character) => ['dk', 'chasseur', 'guerrier'].includes(this.normalizeValue(character.classe)) },
      { label: 'Puissance des sorts', matches: (character) => ['mage', 'chaman', 'demoniste'].includes(this.normalizeValue(character.classe)) }
    ];

    return keyBuffs
      .filter((buff) => !characters.some((character) => buff.matches(character)))
      .map((buff) => buff.label);
  }

  private getTargetRaidSize(): number {
    const template = this.templates.find((entry) => entry.id === this.selectedTemplateId);
    return template?.raidSize ?? 10;
  }

  private normalizeValue(value?: string | null): string {
    if (!value) {
      return '';
    }

    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private buildAutoComposeMessage(result: AutoComposeWeekResultDTO): string {
    const raidCount = result.updatedRaidIds?.length ?? 0;
    if (raidCount === 0) {
      return 'Aucune compo n a ete generee.';
    }

    if (raidCount === 1) {
      return 'Compo generee pour 1 raid.';
    }

    return `Compos generees pour ${raidCount} raids.`;
  }

  private buildCreateRaidDraft(): CreateRaidRequestDTO {
    const selectedDate = this.selectedDay?.date ?? this.toDayKey(this.getDisplayedWeekRange().start);
    const matchingTemplate = this.findTemplateForDate(selectedDate);

    return {
      nom: matchingTemplate?.nom ?? this.buildDefaultRaidName(selectedDate),
      date: this.combineDateAndTime(
        selectedDate,
        matchingTemplate?.heure ?? this.selectedRaid?.heure?.slice(11, 16) ?? '20:45'
      ),
      channelId: matchingTemplate?.channelId ?? this.discordChannelOptions[0]?.id ?? ''
    };
  }

  private resetAutoComposePreview(): void {
    this.autoComposePreview = [];
    this.autoComposePreviewWarnings = [];
  }

  private parseDayDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatShortDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }

  private findTemplateForDate(dateString: string): RaidTemplateDTO | undefined {
    const date = this.parseDayDate(dateString);
    const dayMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const targetDay = dayMap[date.getDay()];

    return this.templates.find((template) => this.normalizeValue(template.jourSemaine) === this.normalizeValue(targetDay));
  }

  private buildDefaultRaidName(dateString: string): string {
    const date = this.parseDayDate(dateString);
    const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    return `Raid du ${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`;
  }

  private combineDateAndTime(dateString: string, timeString: string): string {
    const time = /^\d{2}:\d{2}$/.test(timeString) ? timeString : '20:45';
    return `${dateString}T${time}:00`;
  }

  private resolveWeekViewForDate(dateString: string): 'current' | 'next' {
    const date = this.parseDayDate(dateString);
    const currentWeekStart = this.getResetWeekStart(new Date());
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    return date >= nextWeekStart ? 'next' : 'current';
  }

  private syncRouteSelection(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        week: this.selectedWeekView,
        date: this.selectedDay?.date ?? null,
        raidId: this.selectedRaid?.id ?? null
      },
      queryParamsHandling: 'merge'
    });
  }

  private toDayKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
