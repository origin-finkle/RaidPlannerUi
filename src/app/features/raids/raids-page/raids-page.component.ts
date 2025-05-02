import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RaidService } from '../../../core/services/raid.service';
import {
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
  imports: [CommonModule, RaidCompositionComponent,DragDropModule],
  templateUrl: './raids-page.component.html',
  styleUrls: ['./raids-page.component.scss']
})
export class RaidsPageComponent implements OnInit {
  private raidService = inject(RaidService);

  groupedRaids: RaidDayResponse[] = [];
  selectedDay: RaidDayResponse | null = null;
  selectedRaid: RaidDTO | null = null;

  ngOnInit(): void {
    this.raidService.getGroupedRaids().subscribe(res => {
      this.groupedRaids = res;
      if (res.length > 0) {
        this.selectDay(res[0]);
      }
    });
  }

  selectDay(day: RaidDayResponse): void {
    if (this.selectedDay && this.selectedRaid) {
      this.saveCurrentComposition(this.selectedRaid);
    }

    this.selectedDay = day;
    this.selectedRaid = day.raids[0] ?? null;
  }

  onRaidChange(raid: RaidDTO): void {
    console.log('Raid sélectionné :', raid);        // 👈 trace 1
    console.log('Raid actuel :', this.selectedRaid); // 👈 trace 2

    if (this.selectedRaid) {
      this.saveCurrentComposition(this.selectedRaid);
    }
    console.log('✅ Raid sélectionné :', raid);
    this.selectedRaid = raid;
  }

  onCompositionChanged(event: { raidId: number; group1: PersonnageDTO[]; group2: PersonnageDTO[] }) {
    const raid = this.selectedDay?.raids.find(r => r.id === event.raidId);
    if (raid) {
      // Enrichir avec la spécialisation si manquante
      const enrich = (p: PersonnageDTO): PersonnageDTO => {
        const joueur = raid.joueurDTOList.find(j =>
          j.personnageMain?.nom === p.nom || j.rerolls.some(r => r.nom === p.nom)
        );

        const found = [joueur?.personnageMain, ...(joueur?.rerolls || [])].find(per => per?.nom === p.nom);
        return found ? { ...p, specialisation: found.specialisation } : p;
      };

      raid.group1 = event.group1.map(enrich);
      raid.group2 = event.group2.map(enrich);
      console.log("changement !!!", raid);
      this.raidService.saveComposition({
        raidId: raid.id,
        group1: raid.group1,
        group2: raid.group2
      }).subscribe(() => {
        console.log('Compo mise à jour avec spécialisation');
      });
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
      console.log(`Composition du raid ${raid.id} sauvegardée.`);
    });
  }

  formatDateLabel(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getRaidWeekRange(dateStr: string): { start: Date; end: Date } {
    const date = new Date(dateStr);
    const day = date.getDay();
    const dayDiff = (day + 5) % 7;
    const start = new Date(date);
    start.setDate(date.getDate() - dayDiff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  getUsedCharactersForResetWeek(currentDate: string): PersonnageDTO[] {
    const date = new Date(currentDate);
    const dayOfWeek = date.getDay();
    const daysSinceReset = (dayOfWeek + 4) % 7; // mercredi = 3
    const start = new Date(date);
    start.setDate(date.getDate() - daysSinceReset);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const used: PersonnageDTO[] = [];

    this.groupedRaids.forEach(day => {
      const d = new Date(day.date);
      if (d >= start && d <= end) {
        day.raids.forEach(raid => {
          const usedAt = new Date(day.date).toISOString(); // 🔥 Tag de date d'utilisation

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



}
