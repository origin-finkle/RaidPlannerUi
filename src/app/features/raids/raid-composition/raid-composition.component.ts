import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuffProvider, JoueurDTO, PersonnageDTO } from '../../../core/models/raid.model';
import { AuthService } from '../../../core/services/auth.service';
import { RaidService } from '../../../core/services/raid.service';
import Sortable from 'sortablejs';

type BuffDefinitions = Record<string, BuffProvider[]>;
type CoverageSummary = {
  counts: Record<string, number>;
  activeProviders: Record<string, string[]>;
  possibleProviders: Record<string, string[]>;
};

@Component({
  selector: 'app-raid-composition',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './raid-composition.component.html',
  styleUrls: ['./raid-composition.component.scss']
})
export class RaidCompositionComponent implements OnChanges, AfterViewInit, OnInit {
  @Input() joueurs: JoueurDTO[] = [];
  @Input() allJoueurs: JoueurDTO[] = [];
  @Input() group1FromRaid: PersonnageDTO[] = [];
  @Input() group2FromRaid: PersonnageDTO[] = [];
  @Input() raidId!: number;
  @Input() usedCharacters: PersonnageDTO[] = [];
  @Input() compositionLocked = false;
  @Input() publishLabel = 'Publier sur Discord';
  @Input() publishHint = 'Publie la compo actuelle dans le salon du raid.';
  @Input() publishTone: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';

  @Output() compositionChanged = new EventEmitter<{
    raidId: number;
    group1: PersonnageDTO[];
    group2: PersonnageDTO[];
  }>();
  @Output() manualSignupAdded = new EventEmitter<number>();
  @Output() manualSignupRemoved = new EventEmitter<number>();

  group1: PersonnageDTO[] = [];
  group2: PersonnageDTO[] = [];
  available: PersonnageDTO[] = [];
  selectedManualCharacterId: number | null = null;
  private readonly manualSignupComment = 'MANUAL_OFFICER_ADD';

  private readonly raidBuffDefinitions: BuffDefinitions = {
    "Puissance d'attaque": [
      { classe: 'DK' },
      { classe: 'Chasseur' },
      { classe: 'Guerrier' }
    ],
    'Chance de critique': [
      { classe: 'Druide', specialisations: ['Feral', 'Gardien'] },
      { classe: 'Mage' },
      { classe: 'Moine', specialisations: ['Marche vent'] },
      { classe: 'Chasseur' }
    ],
    'Maitrise': [
      { classe: 'Chasseur' },
      { classe: 'Paladin' },
      { classe: 'Chaman' }
    ],
    'Hate physique': [
      { classe: 'DK', specialisations: ['Givre', 'Impie'] },
      { classe: 'Voleur' },
      { classe: 'Chaman', specialisations: ['Amelioration'] },
      { classe: 'Chasseur' }
    ],
    'Hate des sorts': [
      { classe: 'Druide', specialisations: ['Equilibre'] },
      { classe: 'Pretre', specialisations: ['Ombre'] },
      { classe: 'Chaman' },
      { classe: 'Chasseur' }
    ],
    'Puissance des sorts': [
      { classe: 'Mage' },
      { classe: 'Chaman' },
      { classe: 'Demoniste' },
      { classe: 'Chasseur' }
    ],
    'Endurance': [
      { classe: 'Pretre' },
      { classe: 'Demoniste' },
      { classe: 'Guerrier' },
      { classe: 'Chasseur', specialisations: ['BM'] }
    ],
    'Stats': [
      { classe: 'Druide' },
      { classe: 'Moine' },
      { classe: 'Paladin' },
      { classe: 'Chasseur', specialisations: ['BM'] }
    ]
  };

  private readonly raidDebuffDefinitions: BuffDefinitions = {
    "Reduction d'armure": [
      { classe: 'Druide' },
      { classe: 'Voleur' },
      { classe: 'Guerrier' },
      { classe: 'Chasseur' }
    ],
    "Reduction vitesse d'incantation": [
      { classe: 'DK' },
      { classe: 'Mage' },
      { classe: 'Voleur' },
      { classe: 'Demoniste' },
      { classe: 'Chasseur' }
    ],
    'Reduction de soins': [
      { classe: 'Chasseur' },
      { classe: 'Moine', specialisations: ['Marche vent'] },
      { classe: 'Voleur' },
      { classe: 'Guerrier', specialisations: ['Arme', 'Fury'] }
    ],
    'Vulnerabilite physique': [
      { classe: 'DK', specialisations: ['Givre', 'Impie'] },
      { classe: 'Paladin', specialisations: ['Retribution'] },
      { classe: 'Guerrier' },
      { classe: 'Chasseur' }
    ],
    'Degats physiques reduits': [
      { classe: 'DK', specialisations: ['Sang'] },
      { classe: 'Druide', specialisations: ['Feral', 'Gardien'] },
      { classe: 'Moine', specialisations: ['Maitre brasseur'] },
      { classe: 'Paladin', specialisations: ['Protection', 'Retribution'] },
      { classe: 'Chaman' },
      { classe: 'Demoniste' },
      { classe: 'Guerrier' },
      { classe: 'Chasseur' }
    ],
    'Vulnerabilite magique': [
      { classe: 'Voleur' },
      { classe: 'Demoniste' },
      { classe: 'Chasseur' }
    ]
  };

  private readonly utilityDefinitions: BuffDefinitions = {
    BL: [
      { classe: 'Chaman' },
      { classe: 'Mage' },
      { classe: 'Chasseur', specialisations: ['BM'] }
    ],
    Brez: [
      { classe: 'Druide' },
      { classe: 'DK' },
      { classe: 'Demoniste' },
      { classe: 'Chasseur', specialisations: ['BM'] }
    ]
  };

  private readonly emojiMap: Record<string, string> = {
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

  private readonly raidService = inject(RaidService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private sortableInstances: Sortable[] = [];
  isOfficer = false;

  @ViewChild('group1Container') group1Container!: ElementRef;
  @ViewChild('group2Container') group2Container!: ElementRef;
  @ViewChild('tankContainer') tankContainer!: ElementRef;
  @ViewChild('dpsContainer') dpsContainer!: ElementRef;
  @ViewChild('healContainer') healContainer!: ElementRef;

  raidBuffList = Object.keys(this.raidBuffDefinitions);
  raidDebuffList = Object.keys(this.raidDebuffDefinitions);
  utilityList = Object.keys(this.utilityDefinitions);
  coveredRaidBuffs: Record<string, number> = {};
  coveredRaidDebuffs: Record<string, number> = {};
  coveredUtilities: Record<string, number> = {};
  private raidBuffCoverageSummary: CoverageSummary = { counts: {}, activeProviders: {}, possibleProviders: {} };
  private raidDebuffCoverageSummary: CoverageSummary = { counts: {}, activeProviders: {}, possibleProviders: {} };
  private utilityCoverageSummary: CoverageSummary = { counts: {}, activeProviders: {}, possibleProviders: {} };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['group1FromRaid'] || changes['group2FromRaid'] || changes['joueurs'] || changes['compositionLocked']) {
      this.group1 = [...(this.group1FromRaid || [])];
      this.group2 = [...(this.group2FromRaid || [])];

      this.refreshCoverageSummaries();
      this.computeAvailable();
      this.scheduleSortableRefresh();
    }
  }

  ngOnInit(): void {
    this.authService.authStatus$.subscribe((status) => {
      this.isOfficer = !!status.officer;
    });
  }

  ngAfterViewInit(): void {
    this.scheduleSortableRefresh();
  }

  private setupSortable(container: HTMLElement): void {
    if (typeof window === 'undefined' || this.compositionLocked) {
      return;
    }

    const sortable = Sortable.create(container, {
      group: {
        name: 'shared',
        put: (toSortable) => {
          const to = toSortable.el as HTMLElement;

          if (to === this.group1Container?.nativeElement && this.group1.length >= 5) {
            return false;
          }

          if (to === this.group2Container?.nativeElement && this.group2.length >= 5) {
            return false;
          }

          return true;
        }
      },
      animation: 150,
      onEnd: () => this.syncGroups()
    });

    this.sortableInstances.push(sortable);
  }

  private scheduleSortableRefresh(): void {
    if (typeof window === 'undefined') {
      return;
    }

    setTimeout(() => this.refreshSortables());
  }

  private refreshSortables(): void {
    this.sortableInstances.forEach((instance) => instance.destroy());
    this.sortableInstances = [];

    if (this.compositionLocked) {
      return;
    }

    const containers = [
      { ref: this.group1Container, name: 'group1' },
      { ref: this.group2Container, name: 'group2' },
      { ref: this.tankContainer, name: 'tanks' },
      { ref: this.dpsContainer, name: 'dps' },
      { ref: this.healContainer, name: 'heals' }
    ];

    for (const { ref, name } of containers) {
      if (ref?.nativeElement) {
        this.setupSortable(ref.nativeElement);
      } else {
        console.warn(`ViewChild ${name} is undefined`);
      }
    }
  }

  private syncGroups(): void {
    this.group1 = this.extractCharacters(this.group1Container.nativeElement).slice(0, 5);
    this.group2 = this.extractCharacters(this.group2Container.nativeElement).slice(0, 5);

    this.refreshCoverageSummaries();
    this.computeAvailable();
    this.emitComposition();
  }

  private extractCharacters(container: HTMLElement): PersonnageDTO[] {
    return Array.from(container.children)
      .map((child) => {
        const nom = child.getAttribute('data-nom');
        return nom ? this.findCharacterByName(nom) : null;
      })
      .filter((personnage): personnage is PersonnageDTO => !!personnage);
  }

  private emitComposition(): void {
    this.compositionChanged.emit({
      raidId: this.raidId,
      group1: [...this.group1],
      group2: [...this.group2]
    });
  }

  private computeAvailable(): void {
    const canonicalJoueurs = this.getCanonicalRaidParticipants();
    const allCharacters = this.flattenCharacters(canonicalJoueurs);

    const assignedPseudos = new Set(
      [...this.group1, ...this.group2]
        .map((personnage) => this.findJoueurByPersonnage(personnage.nom)?.pseudo)
        .filter(Boolean)
    );

    const resetDate = this.getLastRaidResetDate();
    const lockedCharacters = new Set(
      this.usedCharacters
        .filter((personnage) => personnage.usedAt && new Date(personnage.usedAt) >= resetDate)
        .map((personnage) => personnage.nom)
    );

    this.available = allCharacters.filter((personnage) => {
      const joueur = this.findJoueurByPersonnage(personnage.nom);
      return !!joueur && !assignedPseudos.has(joueur.pseudo) && !lockedCharacters.has(personnage.nom);
    });
  }

  private flattenCharacters(joueurs: JoueurDTO[]): PersonnageDTO[] {
    return joueurs
      .filter((joueur) => joueur.statutParticipation !== 'ABSENCE')
      .flatMap((joueur) => this.getDisplayCharactersForJoueur(joueur));
  }

  private getLastRaidResetDate(): Date {
    const now = new Date();
    const currentDay = now.getDay();
    const diff = (currentDay + 7 - 3) % 7;
    const reset = new Date(now);
    reset.setDate(now.getDate() - diff);
    reset.setHours(0, 0, 0, 0);
    return reset;
  }

  get availableTanks(): PersonnageDTO[] {
    return this.available.filter((personnage) => personnage.role?.toUpperCase() === 'TANK');
  }

  get availableDps(): PersonnageDTO[] {
    return this.available.filter((personnage) => personnage.role?.toUpperCase() === 'DPS');
  }

  get availableHeals(): PersonnageDTO[] {
    return this.available.filter((personnage) => personnage.role?.toUpperCase() === 'HEAL');
  }

  get manualAddCandidates(): PersonnageDTO[] {
    const currentRaidPlayerIds = new Set(
      this.joueurs
        .map((joueur) => joueur.id)
        .filter((id): id is number => typeof id === 'number')
    );

    return this.allJoueurs
      .filter((joueur) => joueur.raider)
      .filter((joueur) => !currentRaidPlayerIds.has(joueur.id))
      .flatMap((joueur) => this.getDisplayCharactersForJoueur(joueur))
      .sort((left, right) => this.manualCandidateLabel(left).localeCompare(this.manualCandidateLabel(right), 'fr'));
  }

  trackByNom(_: number, personnage: PersonnageDTO): string {
    return personnage.nom;
  }

  manualCandidateLabel(personnage: PersonnageDTO): string {
    const joueur = this.findJoueurByCharacterAcrossRoster(personnage.nom);
    const playerLabel = joueur?.pseudoIhm || joueur?.serverPseudo || joueur?.pseudo || 'Joueur';
    const rerollSuffix = personnage.main ? '' : ' · Reroll';
    return `${playerLabel} - ${personnage.nom} (${personnage.classe} ${personnage.specialisation})${rerollSuffix}`;
  }

  addManualSignup(): void {
    if (this.compositionLocked || this.selectedManualCharacterId == null) {
      return;
    }

    this.manualSignupAdded.emit(this.selectedManualCharacterId);
    this.selectedManualCharacterId = null;
  }

  removeManualSignup(personnage: PersonnageDTO, event?: Event): void {
    event?.stopPropagation();

    if (this.compositionLocked || !this.isManualSignupCharacter(personnage.nom) || !personnage.id) {
      return;
    }

    this.manualSignupRemoved.emit(personnage.id);
  }

  addCharacterToComposition(personnage: PersonnageDTO): void {
    if (this.compositionLocked) {
      return;
    }

    const alreadyAssigned = [...this.group1, ...this.group2].some((current) => current.nom === personnage.nom);
    if (alreadyAssigned) {
      return;
    }

    if (this.group1.length < 5) {
      this.group1 = [...this.group1, personnage];
      this.afterManualCompositionChange();
      return;
    }

    if (this.group2.length < 5) {
      this.group2 = [...this.group2, personnage];
      this.afterManualCompositionChange();
    }
  }

  removeCharacterFromComposition(personnage: PersonnageDTO): void {
    if (this.compositionLocked) {
      return;
    }

    const nextGroup1 = this.group1.filter((current) => current.nom !== personnage.nom);
    const nextGroup2 = this.group2.filter((current) => current.nom !== personnage.nom);

    if (nextGroup1.length === this.group1.length && nextGroup2.length === this.group2.length) {
      return;
    }

    this.group1 = nextGroup1;
    this.group2 = nextGroup2;
    this.afterManualCompositionChange();
  }

  private afterManualCompositionChange(): void {
    this.refreshCoverageSummaries();
    this.computeAvailable();
    this.cdr.detectChanges();
    this.scheduleSortableRefresh();
    this.emitComposition();
  }

  private findJoueurByPersonnage(nom: string): JoueurDTO | undefined {
    return this.getCanonicalRaidParticipants().find(
      (joueur) =>
          joueur.personnageMain?.nom === nom || joueur.rerolls?.some((reroll) => reroll.nom === nom)
    );
  }

  isManualSignupCharacter(nomPerso: string): boolean {
    const joueur = this.findJoueurByPersonnage(nomPerso);
    return joueur?.commentaireInscription === this.manualSignupComment;
  }

  getSignupSourceLabel(nomPerso: string): string | null {
    return this.isManualSignupCharacter(nomPerso) ? 'Manuel' : null;
  }

  private findJoueurByCharacterAcrossRoster(nom: string): JoueurDTO | undefined {
    return this.allJoueurs.find(
      (joueur) =>
        joueur.personnageMain?.nom === nom || joueur.rerolls?.some((reroll) => reroll.nom === nom)
    ) ?? this.findJoueurByPersonnage(nom);
  }

  getClasseColorHex(classe: string | undefined): string {
    const colors: Record<string, string> = {
      guerrier: '#C79C6E',
      mage: '#69CCF0',
      voleur: '#FFF569',
      paladin: '#F58CBA',
      pretre: '#FFFFFF',
      chasseur: '#ABD473',
      demoniste: '#9482C9',
      chaman: '#0070DE',
      druide: '#FF7D0A',
      moine: '#00FF96',
      dk: '#C41F3B'
    };

    return colors[this.normalizeClassName(classe)] || '#999';
  }

  getClasseTextColor(classe: string | undefined): string {
    const lightBgClasses = new Set(['pretre', 'voleur', 'chasseur']);
    return lightBgClasses.has(this.normalizeClassName(classe)) ? '#222' : '#fff';
  }

  getBuffCoverage(definitions: BuffDefinitions, characters: PersonnageDTO[]): Record<string, number> {
    return this.computeCoverageSummary(definitions, characters).counts;
  }

  private matchesProvider(character: PersonnageDTO, provider: BuffProvider): boolean {
    if (this.normalizeClassName(character.classe) !== this.normalizeClassName(provider.classe)) {
      return false;
    }

    if (!provider.specialisations || provider.specialisations.length === 0) {
      return true;
    }

    const normalizedSpec = this.normalizeSpecName(character.specialisation);
    return provider.specialisations.some((spec) => this.normalizeSpecName(spec) === normalizedSpec);
  }

  getBuffClass(count: number): string {
    return count > 0 ? 'text-yellow-300 font-medium' : 'text-gray-500';
  }

  getPopoverTitle(count: number | undefined): string {
    return (count || 0) > 0 ? 'Apporte par' : 'Peut etre apporte par';
  }

  getBuffProviders(buff: string): string[] {
    const activeProviders = this.raidBuffCoverageSummary.activeProviders[buff] || [];
    return activeProviders.length > 0
      ? activeProviders
      : (this.raidBuffCoverageSummary.possibleProviders[buff] || []);
  }

  getDebuffProviders(debuff: string): string[] {
    const activeProviders = this.raidDebuffCoverageSummary.activeProviders[debuff] || [];
    return activeProviders.length > 0
      ? activeProviders
      : (this.raidDebuffCoverageSummary.possibleProviders[debuff] || []);
  }

  getUtilityProviders(utility: string): string[] {
    const activeProviders = this.utilityCoverageSummary.activeProviders[utility] || [];
    return activeProviders.length > 0
      ? activeProviders
      : (this.utilityCoverageSummary.possibleProviders[utility] || []);
  }

  getSpecIcon(spec: string | undefined, classe: string | undefined): string | null {
    if (!spec || !classe) {
      return null;
    }

    const file = `${this.getAssetClassName(classe)}_${this.getAssetSpecName(spec)}.webp`;
    return `/assets/spec-icons/${file}`;
  }

  getStatutParticipationForCharacter(nomPerso: string): string | null {
    return this.findJoueurByPersonnage(nomPerso)?.statutParticipation ?? null;
  }

  getTentativeReasonForCharacter(nomPerso: string): string | null {
    const joueur = this.findJoueurByPersonnage(nomPerso);

    if (!joueur || joueur.statutParticipation !== 'TENTATIVE') {
      return null;
    }

    const reason = joueur.commentaireInscription?.trim();
    return reason ? reason : null;
  }

  getParticipationTitle(nomPerso: string): string {
    const status = this.getStatutParticipationForCharacter(nomPerso);
    if (status !== 'TENTATIVE') {
      return status === 'BENCH'
        ? 'Participation : Bench'
        : status === 'LATE'
        ? 'Participation : En retard'
        : 'Participation : Tentative';
    }

    const reason = this.isOfficer ? this.getTentativeReasonForCharacter(nomPerso) : null;
    return reason ? `Participation : Tentative\nMotif : ${reason}` : 'Participation : Tentative';
  }

  exportRaidHelperFormat(publier = false, overrideChannelId?: string): void {
    const group1Text = this.formatGroup('Groupe 1', this.group1);
    const group2Text = this.formatGroup('Groupe 2', this.group2);
    const texte = `${group1Text}\n\n${group2Text}`;

    this.raidService.exportFormattedCompo(this.raidId, texte, publier, overrideChannelId ?? null).subscribe(() => {
      alert(
        overrideChannelId
          ? `Composition publiee sur le salon de test ${overrideChannelId}.`
          : 'Composition envoyee au back et prete a publier sur Discord.'
      );
    });
  }

  get publishToneClass(): string {
    return `composition-toolbar__status--${this.publishTone}`;
  }

  resetComposition(): void {
    if (this.compositionLocked) {
      return;
    }

    this.group1 = [];
    this.group2 = [];

    this.refreshCoverageSummaries();

    this.computeAvailable();
    this.cdr.detectChanges();
    this.scheduleSortableRefresh();
    this.emitComposition();
  }

  formatGroup(title: string, group: PersonnageDTO[]): string {
    const lines = group.map((personnage, index) => {
      const emoji = this.getEmojiTag(personnage.classe, personnage.specialisation);
      return `${emoji} \`${index + 1}\` **${personnage.nom}**`;
    });

    return ` **${title}**\n${lines.join('\n')}`;
  }

  getEmojiTag(classe: string, specialisation: string): string {
    const key = `${this.normalizeClassName(classe)}-${this.normalizeSpecName(specialisation)}`;
    return this.emojiMap[key] ?? '??';
  }

  private findCharacterByName(nom: string): PersonnageDTO | undefined {
    return [
      ...this.availableTanks,
      ...this.availableHeals,
      ...this.availableDps,
      ...this.group1,
      ...this.group2
    ].find((personnage) => personnage.nom === nom);
  }

  private getActiveProviderLabels(providers: BuffProvider[]): string[] {
    const allCharacters = [...this.group1, ...this.group2];

    const matchingCharacters = allCharacters.filter((character) =>
      providers.some((provider) => this.matchesProvider(character, provider))
    );

    return matchingCharacters.map((character) => {
      const classe = this.formatDisplayName(character.classe);
      const spec = this.formatDisplayName(character.specialisation);
      return `${character.nom} - ${classe}${spec ? ` ${spec}` : ''}`;
    });
  }

  private refreshCoverageSummaries(): void {
    const allCharacters = [...this.group1, ...this.group2];
    this.raidBuffCoverageSummary = this.computeCoverageSummary(this.raidBuffDefinitions, allCharacters);
    this.raidDebuffCoverageSummary = this.computeCoverageSummary(this.raidDebuffDefinitions, allCharacters);
    this.utilityCoverageSummary = this.computeCoverageSummary(this.utilityDefinitions, allCharacters);
    this.coveredRaidBuffs = this.raidBuffCoverageSummary.counts;
    this.coveredRaidDebuffs = this.raidDebuffCoverageSummary.counts;
    this.coveredUtilities = this.utilityCoverageSummary.counts;
  }

  private computeCoverageSummary(definitions: BuffDefinitions, characters: PersonnageDTO[]): CoverageSummary {
    const counts: Record<string, number> = {};
    const activeProviders: Record<string, string[]> = {};
    const possibleProviders: Record<string, string[]> = {};
    const hunterAssignments = new Set<string>();

    for (const buff of Object.keys(definitions)) {
      const providers = definitions[buff] || [];
      const naturalProviders = characters.filter((character) =>
        providers.some((provider) => !this.isHunterFallbackProvider(provider) && this.matchesProvider(character, provider))
      );

      const directLabels = naturalProviders.map((character) => this.formatCharacterProviderLabel(character));
      counts[buff] = directLabels.length;
      activeProviders[buff] = directLabels;
      possibleProviders[buff] = this.getPossibleProviderLabels(providers);
    }

    for (const buff of Object.keys(definitions)) {
      if ((counts[buff] || 0) > 0) {
        continue;
      }

      const providers = definitions[buff] || [];
      if (!providers.some((provider) => this.isHunterFallbackProvider(provider))) {
        continue;
      }

      const availableHunter = characters.find((character) =>
        this.normalizeClassName(character.classe) === 'chasseur'
        && !hunterAssignments.has(character.nom)
        && providers.some((provider) => this.isHunterFallbackProvider(provider) && this.matchesProvider(character, provider))
      );

      if (!availableHunter) {
        continue;
      }

      hunterAssignments.add(availableHunter.nom);
      counts[buff] = 1;
      activeProviders[buff] = [this.formatCharacterProviderLabel(availableHunter) + ' · Pet manquant'];
    }

    return { counts, activeProviders, possibleProviders };
  }

  private isHunterFallbackProvider(provider: BuffProvider): boolean {
    return this.normalizeClassName(provider.classe) === 'chasseur';
  }

  private formatCharacterProviderLabel(character: PersonnageDTO): string {
    const classe = this.formatDisplayName(character.classe);
    const spec = this.formatDisplayName(character.specialisation);
    return `${character.nom} - ${classe}${spec ? ` ${spec}` : ''}`;
  }

  private getPossibleProviderLabels(providers: BuffProvider[]): string[] {
    return providers.map((provider) => {
      const classe = this.formatDisplayName(provider.classe);

      if (!provider.specialisations || provider.specialisations.length === 0) {
        return classe;
      }

      const specs = provider.specialisations
        .map((specialisation) => this.formatDisplayName(specialisation))
        .join(', ');

      return `${classe} (${specs})`;
    });
  }

  private formatDisplayName(value: string): string {
    const normalizedClass = this.normalizeClassName(value);
    const normalizedSpec = this.normalizeSpecName(value);

    const classLabels: Record<string, string> = {
      chaman: 'Chaman',
      chasseur: 'Chasseur',
      demoniste: 'Demoniste',
      dk: 'DK',
      druide: 'Druide',
      guerrier: 'Guerrier',
      mage: 'Mage',
      moine: 'Moine',
      paladin: 'Paladin',
      pretre: 'Pretre',
      voleur: 'Voleur'
    };

    const specLabels: Record<string, string> = {
      affliction: 'Affliction',
      amelioration: 'Amelioration',
      arcane: 'Arcane',
      arme: 'Arme',
      assassinat: 'Assassinat',
      bm: 'BM',
      combat: 'Combat',
      demonologie: 'Demonologie',
      destruction: 'Destruction',
      discipline: 'Discipline',
      elem: 'Elem',
      equilibre: 'Equilibre',
      feral: 'Feral',
      feu: 'Feu',
      finesse: 'Finesse',
      fury: 'Fury',
      gardien: 'Gardien',
      givre: 'Givre',
      impie: 'Impie',
      maitrebrasseur: 'Maitre brasseur',
      'maitre brasseur': 'Maitre brasseur',
      marchevent: 'Marche-vent',
      'marche vent': 'Marche-vent',
      ombre: 'Ombre',
      precision: 'Precision',
      protection: 'Protection',
      retribution: 'Retribution',
      restauration: 'Restauration',
      sacre: 'Sacre',
      sang: 'Sang',
      survie: 'Survie',
      tissebrume: 'Tisse-brume',
      'tisse brume': 'Tisse-brume'
    };

    if (classLabels[normalizedClass]) {
      return classLabels[normalizedClass];
    }

    if (specLabels[normalizedSpec]) {
      return specLabels[normalizedSpec];
    }

    return value;
  }

  private normalizeClassName(value?: string): string {
    const normalized = this.normalizeValue(value);

    const classAliases: Record<string, string> = {
      'death knight': 'dk',
      deathknight: 'dk',
      'chevalier de la mort': 'dk',
      chevalierdelamort: 'dk',
      dk: 'dk',
      druid: 'druide',
      druide: 'druide',
      hunter: 'chasseur',
      chasseur: 'chasseur',
      mage: 'mage',
      monk: 'moine',
      moine: 'moine',
      paladin: 'paladin',
      priest: 'pretre',
      pretre: 'pretre',
      pratre: 'pretre',
      rogue: 'voleur',
      voleur: 'voleur',
      shaman: 'chaman',
      chaman: 'chaman',
      warlock: 'demoniste',
      demoniste: 'demoniste',
      damoniste: 'demoniste',
      warrior: 'guerrier',
      guerrier: 'guerrier'
    };

    return classAliases[normalized] || normalized;
  }

  private normalizeSpecName(value?: string): string {
    const normalized = this.normalizeValue(value);

    const specAliases: Record<string, string> = {
      arms: 'arme',
      arme: 'arme',
      assassination: 'assassinat',
      assassinat: 'assassinat',
      arcane: 'arcane',
      balance: 'equilibre',
      beastmastery: 'bm',
      'beast mastery': 'bm',
      bm: 'bm',
      blood: 'sang',
      brewmaster: 'maitre brasseur',
      combat: 'combat',
      demo: 'demonologie',
      demonology: 'demonologie',
      demonologie: 'demonologie',
      damonologie: 'demonologie',
      destruction: 'destruction',
      discipline: 'discipline',
      elemental: 'elem',
      elem: 'elem',
      enhancement: 'amelioration',
      amelioration: 'amelioration',
      amelio: 'amelioration',
      amalioration: 'amelioration',
      equilibre: 'equilibre',
      feral: 'feral',
      fire: 'feu',
      feu: 'feu',
      frost: 'givre',
      fury: 'fury',
      gardien: 'gardien',
      guardian: 'gardien',
      givre: 'givre',
      holy: 'sacre',
      impie: 'impie',
      marksmanship: 'precision',
      precision: 'precision',
      pracision: 'precision',
      'maitre brasseur': 'maitre brasseur',
      mistweaver: 'tisse brume',
      'tisse brume': 'tisse brume',
      'tisse-brume': 'tisse brume',
      ombre: 'ombre',
      shadow: 'ombre',
      protection: 'protection',
      restoration: 'restauration',
      restauration: 'restauration',
      resto: 'restauration',
      retribution: 'retribution',
      retri: 'retribution',
      ratribution: 'retribution',
      sacre: 'sacre',
      sacra: 'sacre',
      subtlety: 'finesse',
      finesse: 'finesse',
      survie: 'survie',
      survival: 'survie',
      unholy: 'impie',
      windwalker: 'marche vent',
      'marche vent': 'marche vent',
      'marche-vent': 'marche vent'
    };

    return specAliases[normalized] || normalized;
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

  private getAssetClassName(value?: string): string {
    const normalized = this.normalizeClassName(value);
    const assetClassNames: Record<string, string> = {
      pretre: 'prêtre',
      demoniste: 'démoniste'
    };

    return assetClassNames[normalized] || normalized;
  }

  private getAssetSpecName(value?: string): string {
    const normalized = this.normalizeSpecName(value);
    const assetSpecNames: Record<string, string> = {
      amelioration: 'amélioration',
      precision: 'précision',
      demonologie: 'démonologie',
      retribution: 'rétribution',
      sacre: 'sacré',
      'tisse brume': 'tisse-brume',
      'marche vent': 'marche-vent'
    };

    return (assetSpecNames[normalized] || normalized).replace(/\s+/g, '_');
  }

  private getDisplayCharactersForJoueur(joueur: JoueurDTO): PersonnageDTO[] {
    return [joueur.personnageMain, ...(joueur.rerolls || [])].filter(Boolean) as PersonnageDTO[];
  }

  private getCanonicalRaidParticipants(): JoueurDTO[] {
    const canonicalByPlayer = new Map<string, JoueurDTO>();

    for (const joueur of this.joueurs ?? []) {
      const key = this.buildJoueurKey(joueur);
      if (!key) {
        continue;
      }

      const current = canonicalByPlayer.get(key);
      if (!current || this.compareSignupPriority(joueur, current) < 0) {
        canonicalByPlayer.set(key, joueur);
      }
    }

    return Array.from(canonicalByPlayer.values());
  }

  private buildJoueurKey(joueur: JoueurDTO | null | undefined): string | null {
    if (!joueur) {
      return null;
    }

    const discordId = this.normalizeValue(joueur.discordId ?? undefined);
    if (discordId) {
      return `discord:${discordId}`;
    }

    const serverPseudo = this.normalizeValue(joueur.serverPseudo);
    if (serverPseudo) {
      return `server:${serverPseudo}`;
    }

    const pseudo = this.normalizeValue(joueur.pseudo);
    if (pseudo) {
      return `pseudo:${pseudo}`;
    }

    if (joueur.id != null) {
      return `id:${joueur.id}`;
    }

    return null;
  }

  private compareSignupPriority(left: JoueurDTO, right: JoueurDTO): number {
    const leftScore = this.signupPriority(left);
    const rightScore = this.signupPriority(right);
    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    const leftManual = left.commentaireInscription === this.manualSignupComment ? 1 : 0;
    const rightManual = right.commentaireInscription === this.manualSignupComment ? 1 : 0;
    return rightManual - leftManual;
  }

  private signupPriority(joueur: JoueurDTO): number {
    switch (joueur.statutParticipation) {
      case 'ABSENCE':
        return 5;
      case 'BENCH':
        return 4;
      case 'LATE':
        return 3;
      case 'TENTATIVE':
        return 2;
      case 'TITULAIRE':
      default:
        return 1;
    }
  }
}
