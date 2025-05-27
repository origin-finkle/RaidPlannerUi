import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter, inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BuffProvider, JoueurDTO, PersonnageDTO} from '../../../core/models/raid.model';
import { RaidService } from '../../../core/services/raid.service';


@Component({
  selector: 'app-raid-composition',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './raid-composition.component.html',
  styleUrls: ['./raid-composition.component.scss']
})


export class RaidCompositionComponent implements OnChanges, AfterViewInit {
  @Input() joueurs: JoueurDTO[] = [];
  @Input() group1FromRaid: PersonnageDTO[] = [];
  @Input() group2FromRaid: PersonnageDTO[] = [];
  @Input() raidId!: number;
  @Input() usedCharacters: PersonnageDTO[] = [];

  @Output() compositionChanged = new EventEmitter<{
    raidId: number;
    group1: PersonnageDTO[];
    group2: PersonnageDTO[];
  }>();

  group1: PersonnageDTO[] = [];
  group2: PersonnageDTO[] = [];
  available: PersonnageDTO[] = [];


  private readonly RAID_BUFFS: { [buff: string]: BuffProvider[] } = {
    'Armor': [
      {classe: 'Chaman'}, // toute spé
      {classe: 'Paladin'}
    ],
    'Endu': [
      {classe: 'Prêtre'},
      {classe: 'Guerrier'},
      {classe: 'Démoniste', specialisations: ['Destruction']},
      {classe: 'Chasseur', specialisations: ['BM']}
    ],
    'Stats': [
      {classe: 'Paladin'},
      {classe: 'Druide'},
      {classe: 'Chasseur', specialisations: ['BM']}
    ],
    '+6% Spell Power': [
      {classe: 'Mage'},
      {classe: 'Chaman'}
    ],
    'Intell': [
      {classe: 'Mage'},
      {classe: 'Démoniste', specialisations: ['Affliction']}
    ],
    'BL': [
      {classe: 'Chaman'},
      {classe: 'Mage'},
      {classe: 'Chasseur', specialisations: ['BM']}
    ],
    'Hâte 5%': [
      {classe: 'Chaman'}, // toute spé
      {classe: 'Prêtre', specialisations: ['Ombre']},
      {classe: 'Druide', specialisations: ['Equilibre']}
    ],
    'MP5': [
      {classe: 'Paladin'},
      {classe: 'Chaman'},
      {classe: 'Démoniste', specialisations: ['Affliction', 'Démonologie']}
    ],
    'Agi et Force': [
      {classe: 'DK'},
      {classe: 'Chasseur'},
      {classe: 'Chaman'},
      {classe: 'Guerrier'}
    ],
    'Résistance Feu et Givre': [
      {classe: 'Chaman'},
      {classe: 'Paladin'}
    ],
    'Hâte mélée': [
      {classe: 'Chaman'},
      {classe: 'Chasseur', specialisations: ['Survie']},
      {classe: 'DK', specialisations: ['Givre']}
    ],
    'Crit': [
      {classe: 'Druide', specialisations: ['Feral']},
      {classe: 'Chaman', specialisations: ['Elem']},
      {classe: 'Guerrier', specialisations: ['Fury']},
      {classe: 'Valeur', specialisations: ['Finesse']}
    ],
    'PA': [
      {classe: 'DK', specialisations: ['Sang']},
      {classe: 'Chasseur', specialisations: ['Précision']},
      {classe: 'Paladin'},
      {classe: 'Chaman', specialisations: ['Amélioration']}
    ],
    '3% damage': [
      {classe: 'Paladin', specialisations: ['Rétribution']},
      {classe: 'Chasseur', specialisations: ['BM']},
      {classe: 'Mage', specialisations: ['Arcane']}
    ],
    'Replenishment': [
      {classe: 'Druide', specialisations: ['Restauration']},
      {classe: 'Mage', specialisations: ['Givre']},
      {classe: 'Démoniste', specialisations: ['Destruction']},
      {classe: 'Prêtre', specialisations: ['Ombre']},
      {classe: 'Paladin', specialisations: ['Rétribution']}
    ],
    '10% spell Power': [
      {classe: 'Démoniste', specialisations: ['Démonologie']},
      {classe: 'Chaman', specialisations: ['Elem']}
    ],
  };

  RAID_DEBUFFS = {
    'PA': [
      {classe: 'DK', specialisations: ['Sang']},
      {classe: 'Druide', specialisations: ['Feral']},
      {classe: 'Paladin', specialisations: ['Protection']},
      {classe: 'Démoniste',},
      {classe: 'Guerrier',}
    ],
    'Armor': [
      {classe: 'Guerrier'},
      {classe: 'Druide'},
      {classe: 'Rogue'},
      {classe: 'Guerrier'},
    ],
    'Magique': [
      {classe: 'Démoniste'},
      {classe: 'DK', specialisations: ['Impie']},
      {classe: 'Druide', specialisations: ['Equilibre']},
      {classe: 'Voleur', specialisations: ['Assassinat']},
    ],
    'Attack speed': [
      {classe: 'DK'},
      {classe: 'Druide', specialisations: ['Feral']},
      {classe: 'Paladin', specialisations: ['Protection']},
      {classe: 'Chaman', specialisations: ['Amélioration']},
      {classe: 'Guerrier'},
    ],
    '5% Spell crit': [
      {classe: 'Mage', specialisations: ['Feu']},
      {classe: 'Démoniste', specialisations: ['Destruction']},
    ],
    'Saignement': [
      {classe: 'Druide', specialisations: ['Feral']},
      {classe: 'Voleur', specialisations: ['Finesse']},
      {classe: 'Guerrier', specialisations: ['Arme']},
    ],
    'Dégâts physiques': [
      {classe: 'DK', specialisations: ['Givre']},
      {classe: 'Voleur', specialisations: ['Combat']},
      {classe: 'Guerrier', specialisations: ['Arme']},
      {classe: 'Chasseur'},
    ],
  };

  emojiMap: { [key: string]: string } = {
    'DK-Sang': '<:dk_sang:1363215681570603170>',
    'DK-Givre': '<:dk_givre:1363215048675299479>',
    'DK-Impie': '<:dk_impie:1363215050155884745>',

    'Druide-Feral': '<:druide_feral:1363215056023588924>',
    'Druide-Restauration': '<:druide_restauration:1363229950353608787>',
    'Druide-Equilibre': '<:druide_equilibre:1363215053142364221>',

    'Paladin-Sacré': '<:paladin_sacre:1363215077452419254>',
    'Paladin-Rétribution': '<:paladin_retribution:1363215074520727735>',
    'Paladin-Protection': '<:paladin_protection:1363215984923513033>',

    'Chaman-Elem': '<:chaman_elem:1363215015540166768>',
    'Chaman-Amélio': '<:chaman_amelioration:1363214654284894429>',
    'Chaman-Restauration': '<:chaman_restauration:1363215037757522172>',

    'Guerrier-Arme': '<:guerrier_arme:1363215059429495024>',
    'Guerrier-Fury': '<:guerrier_fury:1363215740328611991>',
    'Guerrier-Protection': '<:guerrier_protection:1363215062927544470>',

    'Voleur-Combat': '<:voleur_combat:1363215091125850224>',
    'Voleur-Finesse': '<:voleur_finesse:1363216048442179836>',
    'Voleur-Assassinat': '<:voleur_assassinat:1363215089427153016>',

    'Chasseur-Survie': '<:chasseur_survie:1363215042094432286>',
    'Chasseur-Précision': '<:chasseur_precision:1363215040487887061>',
    'Chasseur-BM': '<:chasseur_bm:1363215038911090908>',

    'Mage-Feu': '<:mage_feu:1363215067826360492>',
    'Mage-Arcane': '<:mage_arcane:1363215952573104268>',
    'Mage-Givre': '<:mage_givre:637564231239073802>',

    'Démoniste-Démonologie': '<:demoniste_demonologie:1363215045768773873>',
    'Démoniste-Affliction': '<:demoniste_affliction:1363215043453260068>',
    'Démoniste-Destruction': '<:demoniste_destruction:1363215047337316624>',

    'Prêtre-Discipline': '<:pretre_discipline:1363215080027853051>',
    'Prêtre-Ombre': '<:pretre_ombre:1363215649018740847>',
    'Prêtre-Sacré': '<:pretre_sacre:1363215084003917984>',
  };

  @ViewChild('group1Container') group1Container!: ElementRef;
  @ViewChild('group2Container') group2Container!: ElementRef;
  @ViewChild('tankContainer') tankContainer!: ElementRef;
  @ViewChild('dpsContainer') dpsContainer!: ElementRef;
  @ViewChild('healContainer') healContainer!: ElementRef;

  raidBuffList = Object.keys(this.RAID_BUFFS);
  raidDebuffList = Object.keys(this.RAID_DEBUFFS);
  coveredRaidBuffs: { [buff: string]: number } = {};
  coveredRaidDebuffs: { [buff: string]: number } = {};
  private raidService = inject(RaidService);


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['group1FromRaid'] || changes['group2FromRaid'] || changes['joueurs']) {
      this.group1 = [...(this.group1FromRaid || [])];
      this.group2 = [...(this.group2FromRaid || [])];
      const allCharacters = [...this.group1, ...this.group2];
      this.coveredRaidBuffs = this.getBuffCoverage(this.RAID_BUFFS, allCharacters);
      this.coveredRaidDebuffs = this.getBuffCoverage(this.RAID_DEBUFFS, allCharacters);
      this.computeAvailable();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const containers = [
        {ref: this.group1Container, name: 'group1'},
        {ref: this.group2Container, name: 'group2'},
        {ref: this.tankContainer, name: 'tanks'},
        {ref: this.dpsContainer, name: 'dps'},
        {ref: this.healContainer, name: 'heals'}
      ];

      for (const {ref, name} of containers) {
        if (ref?.nativeElement) {
          this.setupSortable(ref.nativeElement, name);
        } else {
          console.warn(`⚠️ ViewChild ${name} is undefined`);
        }
      }
    });
  }

  private async setupSortable(container: HTMLElement, group: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const Sortable = (await import('sortablejs')).default;

    Sortable.create(container, {
      group: {
        name: 'shared',
        put: (toSortable, fromSortable, dragEl, event) => {
          const to = toSortable.el as HTMLElement;
          if (to === this.group1Container?.nativeElement && this.group1.length >= 5) return false;
          if (to === this.group2Container?.nativeElement && this.group2.length >= 5) return false;
          return true;
        }
      },
      animation: 150,
      onEnd: () => {
        this.syncGroups();
      }
    });
  }

  private syncGroups(): void {
    const group1 = this.extractCharacters(this.group1Container.nativeElement);
    const group2 = this.extractCharacters(this.group2Container.nativeElement);
    const allAssigned = new Set([...group1, ...group2].map(p => p.nom));

    this.group1 = group1.slice(0, 5);
    this.group2 = group2.slice(0, 5);

    this.computeAvailable();
    this.emitComposition();
  }

  private extractCharacters(container: HTMLElement): PersonnageDTO[] {
    const children = Array.from(container.children);
    return children
      .map(child => {
        const nom = child.getAttribute('data-nom');
        if (!nom) return null;
        return this.findCharacterByName(nom);
      })
      .filter((p): p is PersonnageDTO => !!p); // élimine les nulls
  }

  private emitComposition(): void {
    this.compositionChanged.emit({
      raidId: this.raidId,
      group1: [...this.group1],
      group2: [...this.group2]
    });
  }

  private computeAvailable(): void {
    const allCharacters = this.flattenCharacters(this.joueurs);

    // 1. Personnages dont le joueur est déjà assigné à un groupe
    const assignedPseudos = new Set(
      [...this.group1, ...this.group2]
        .map(p => this.findJoueurByPersonnage(p.nom)?.pseudo)
        .filter(Boolean)
    );

    // 2. Personnages déjà utilisés cette semaine
    const resetDate = this.getLastRaidResetDate();
    const lockedCharacters = new Set(
      this.usedCharacters
        .filter(p => p.usedAt && new Date(p.usedAt) >= resetDate)
        .map(p => p.nom)
    );

    // 3. On filtre
    this.available = allCharacters.filter(p => {
      const joueur = this.findJoueurByPersonnage(p.nom);
      return joueur
        && !assignedPseudos.has(joueur.pseudo)
        && !lockedCharacters.has(p.nom);
    });
  }

  private flattenCharacters(joueurs: JoueurDTO[]): PersonnageDTO[] {
    return joueurs
      .flatMap(j => [j.personnageMain, ...(j.rerolls || [])])
      .filter(Boolean) as PersonnageDTO[];
  }

  private getLastRaidResetDate(): Date {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 3 = Wednesday
    const diff = (currentDay + 7 - 3) % 7; // days since last Wednesday
    const reset = new Date(now);
    reset.setDate(now.getDate() - diff);
    reset.setHours(0, 0, 0, 0);
    return reset;
  }

  get availableTanks(): PersonnageDTO[] {
    return this.available.filter(p => p.role?.toUpperCase() === 'TANK');
  }

  get availableDps(): PersonnageDTO[] {
    return this.available.filter(p => p.role?.toUpperCase() === 'DPS');
  }

  get availableHeals(): PersonnageDTO[] {
    return this.available.filter(p => p.role?.toUpperCase() === 'HEAL');
  }

  trackByNom(_: number, p: PersonnageDTO): string {
    return p.nom;
  }

  private findJoueurByPersonnage(nom: string): JoueurDTO | undefined {
    return this.joueurs.find(j =>
      j.personnageMain?.nom === nom ||
      j.rerolls?.some(r => r.nom === nom)
    );
  }

  getClasseColorHex(classe: string | undefined): string {
    const colors: { [key: string]: string } = {
      guerrier: '#C79C6E',
      mage: '#69CCF0',
      voleur: '#FFF569',
      paladin: '#F58CBA',
      prêtre: '#FFFFFF',
      chasseur: '#ABD473',
      démoniste: '#9482C9',
      chaman: '#0070DE',
      druide: '#FF7D0A',
      dk: '#C41F3B',
      chevalierdelamort: '#C41F3B' // alias
    };

    return colors[classe?.toLowerCase() || ''] || '#999'; // couleur par défaut
  }

  getClasseTextColor(classe: string | undefined): string {
    const lightBgClasses = ['prêtre', 'voleur', 'chasseur']; // couleurs claires
    const isLight = lightBgClasses.includes(classe?.toLowerCase() || '');
    return isLight ? '#222' : '#fff'; // noir ou blanc
  }

  getBuffCoverage(definitions: { [buff: string]: BuffProvider[] }, characters: PersonnageDTO[]): {
    [buff: string]: number
  } {
    const res: { [buff: string]: number } = {};
    for (const buff in definitions) {
      res[buff] = characters.filter(p => {
        return definitions[buff].some(provider =>
          p.classe.toLowerCase() === provider.classe.toLowerCase() &&
          (!provider.specialisations || provider.specialisations.includes(p.specialisation || ''))
        );
      }).length;
    }
    return res;
  }

  getBuffClass(count: number): string {
    return count > 0 ? 'text-yellow-300 font-medium' : 'text-gray-500';
  }

  getSpecIcon(spec: string | undefined, classe: string | undefined): string | null {
    if (!spec || !classe) return null;
    const file = `${classe.toLowerCase()}_${spec.toLowerCase().replace(/\s+/g, '_')}.webp`;
    return `/assets/spec-icons/${file}`;
  }

  getStatutParticipationForCharacter(nomPerso: string): string | null {
    const joueur = this.joueurs.find(j =>
      j.personnageMain?.nom === nomPerso ||
      j.rerolls?.some(p => p.nom === nomPerso)
    );

    return joueur?.statutParticipation ?? null;
  }

  exportRaidHelperFormat(publier: boolean = false) {
    const group1Text = this.formatGroup('Groupe 1', this.group1);
    const group2Text = this.formatGroup('Groupe 2', this.group2);
    const texte = `${group1Text}\n\n${group2Text}`;

    this.raidService.exportFormattedCompo(this.raidId, texte, publier).subscribe(() => {
      console.log(texte)
      alert('✅ Composition envoyée au back et prête à publier sur Discord !');
    });
  }

  formatGroup(title: string, group: PersonnageDTO[]): string {
    const lines = group.map((p, i) => {
      const emoji = this.getEmojiTag(p.classe, p.specialisation);
      return `${emoji} \`${i + 1}\` **${p.nom}**`;
    });
    return ` **${title}**\n` + lines.join('\n');
  }

  getEmojiTag(classe: string, specialisation: string): string {
    return this.emojiMap[`${classe}-${specialisation}`] ?? '🧍';
  }

  private findCharacterByName(nom: string): PersonnageDTO | undefined {
    return [
      ...this.availableTanks,
      ...this.availableHeals,
      ...this.availableDps,
      ...this.group1,
      ...this.group2
    ].find(p => p.nom === nom);
  }

}
