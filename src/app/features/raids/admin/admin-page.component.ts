import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {JoueurDTO, PersonnageDTO} from '../../../core/models/raid.model';
import { CommonModule } from '@angular/common'; //
import {JoueurService} from '../../../core/services/joueur.service';
import { FormsModule } from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';



@Component({
  selector: 'app-admin-page',
  standalone: true,
  templateUrl: './admin-page.component.html',
  imports: [CommonModule, FormsModule, NgSelectModule],
})
export class AdminPageComponent implements OnInit {
  joueurs: JoueurDTO[] = [];
  joueurEnCours: JoueurDTO | null = null;
  personnagesDuJoueur: PersonnageDTO[] = [];
  mainNom: string | null = null;

  specialisationsParClasse: { [classe: string]: string[] } = {
    'Guerrier': ['Arme', 'Fury', 'Protection'],
    'Paladin': ['Sacré', 'Protection', 'Rétribution'],
    'Chasseur': ['BM', 'Précision', 'Survie'],
    'Voleur': ['Assassinat', 'Combat', 'Finesse'],
    'Prêtre': ['Discipline', 'Sacré', 'Ombre'],
    'DK': ['Sang', 'Givre', 'Impie'],
    'Chaman': ['Amélioration', 'Elem', 'Restauration'],
    'Mage': ['Feu', 'Givre', 'Arcane'],
    'Démoniste': ['Affliction', 'Démonologie', 'Destruction'],
    'Druide': ['Equilibre', 'Feral', 'Restauration']
  };

  classes: string[] = Object.keys(this.specialisationsParClasse);


    @ViewChild('editDialog') editDialog!: ElementRef<HTMLDialogElement>;

  constructor(private joueurService: JoueurService) {}

  ngOnInit(): void {
    this.joueurService.getJoueurs().subscribe((data) => {
      this.joueurs = data.filter(j =>
        j.raider === true
      );
    });
  }

  onPseudoChange(event: Event, joueur: JoueurDTO): void {
    const target = event.target as HTMLInputElement;
    const newPseudo = target.value;

    if (!newPseudo.trim()) return;

    this.joueurService.updatePseudoIhm(joueur.id, newPseudo).subscribe(() => {
      joueur.pseudoIhm = newPseudo;
    });
  }


  onEditPlayer(joueur: JoueurDTO): void {
    this.joueurService.getJoueurById(joueur.id).subscribe((joueur) => {
      const joueurMisAJour = joueur;
      if (!joueurMisAJour) return;

      this.joueurEnCours = joueurMisAJour;

      this.personnagesDuJoueur = [];
      if (joueurMisAJour.personnageMain) {
        this.personnagesDuJoueur.push(joueurMisAJour.personnageMain);
      }
      if (joueurMisAJour.rerolls) {
        this.personnagesDuJoueur.push(...joueurMisAJour.rerolls);
      }
    });
  }


  fermerDialog(): void {
    this.joueurEnCours = null;
    this.personnagesDuJoueur = [];
  }

  enregistrerPersonnage(perso: PersonnageDTO): void {

    const dto: PersonnageDTO = {
      id: perso.id ?? 0,
      nom: perso.nom,
      classe: perso.classe,
      specialisation: perso.specialisation,
      role: perso.role,
      pseudo: perso.pseudo,
      main: perso.main
    };
    this.joueurService.updatePersonnage(perso).subscribe({
      next: () => {
        console.log(`✅ Personnage ${perso.nom} mis à jour`);
      },
      error: (err) => {
        console.error("❌ Erreur de mise à jour du personnage", err);
      }
    });
  }
  onClasseChange(perso: Partial<PersonnageDTO>) {
    const specs = this.specialisationsParClasse[perso.classe ?? ''];
    if (specs && !specs.includes(perso.specialisation ?? '')) {
      perso.specialisation = specs[0];
    }
  }

  nouveauPersonnage: Partial<PersonnageDTO> = {
    nom: '',
    classe: '',
    specialisation: '',
    role: '',
    main: false
  };

  ajouterPersonnage() {
    if (!this.joueurEnCours || !this.nouveauPersonnage.nom?.trim()) return;

    const personnage: PersonnageDTO = {
      id: 0,
      nom: this.nouveauPersonnage.nom!,
      classe: this.nouveauPersonnage.classe!,
      specialisation: this.nouveauPersonnage.specialisation!,
      role: this.nouveauPersonnage.role!,
      pseudo: this.joueurEnCours.pseudo,
      main: this.nouveauPersonnage.main ?? false
    };

    this.joueurService.addPersonnage(this.joueurEnCours.id, personnage).subscribe(() => {
      this.personnagesDuJoueur.push(personnage);
      this.resetNouveauPersonnage();
    });
  }

  resetNouveauPersonnage() {
    this.nouveauPersonnage = {
      nom: '',
      classe: '',
      specialisation: '',
      role: '',
      main: false
    };
  }


  getSpecialisationsPourClasse(classe?: string): string[] {
    return classe && this.specialisationsParClasse[classe]
      ? this.specialisationsParClasse[classe]
      : [];
  }

  getClasseColor(classe: string): string {
    const colors: { [key: string]: string } = {
      "druide": "#FF7D0A",
      "chasseur": "#ABD473",
      "mage": "#69CCF0",
      "paladin": "#F58CBA",
      "prêtre": "#FFFFFF",
      "voleur": "#FFF569",
      "chaman": "#0070DE",
      "démoniste": "#9482C9",
      "guerrier": "#C79C6E",
      "DK": "#C41F3B"
    };
    return colors[classe?.toLowerCase()] || "#AAA";
  }

  getSpecColor(spec: string): string {
    const colors: { [key: string]: string } = {
      "Equilibre": "#A8FF98",
      "Feral": "#D08770",
      "Restauration": "#88C0D0",
      "BM": "#D8DEE9",
      "Précision": "#81A1C1",
      "Survie": "#A3BE8C",
      "Arcane": "#B48EAD",
      "Feu": "#BF616A",
      "Fivre": "#5E81AC",
      "Sacré": "#EBCB8B",
      "Protection": "#D08770",
      "Rétribution": "#B48EAD",
      "Discipline": "#A3BE8C",
      "Ombre": "#B48EAD",
      "Assassinat": "#A3BE8C",
      "Combat": "#D08770",
      "Finesse": "#EBCB8B",
      "Elem": "#88C0D0",
      "Amélioration": "#81A1C1",
      "Affliction": "#5E81AC",
      "Démonologie": "#B48EAD",
      "Destruction": "#BF616A",
      "Arme": "#C79C6E",
      "Fury": "#D08770",
      "Impie": "#A3BE8C",
      "Sang": "#8B0000"
    };
    return colors[spec?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")] || "#AAA";
  }


  supprimerPersonnage(perso: PersonnageDTO): void {
    if (!this.joueurEnCours) return;

    this.joueurService.deletePersonnage(perso.id).subscribe({
      next: () => {
        const index = this.personnagesDuJoueur.indexOf(perso);
        if (index > -1) {
          this.personnagesDuJoueur.splice(index, 1);
        }
      },
      error: err => {
        console.error('Erreur suppression personnage:', err);
      }
    });
  }


}
