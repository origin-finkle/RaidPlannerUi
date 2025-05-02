import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {RaidCompositionDTO, RaidDayResponse} from '../models/raid.model';

@Injectable({ providedIn: 'root' })
export class RaidService {
  constructor(private http: HttpClient) {}

  saveComposition(dto: RaidCompositionDTO): Observable<void> {
    return this.http.post<void>(`/api/raids/composition`, dto);
  }

  getGroupedRaids(): Observable<RaidDayResponse[]> {
    return this.http.get<RaidDayResponse[]>('/api/raids');
  }

  exportFormattedCompo(raidId: number, texte: string, envoyerSurDiscord: boolean) {
    envoyerSurDiscord= true;
    return this.http.post<void>(`/api/raids/${raidId}/export`, {
      texteFormatte: texte,
      envoyerSurDiscord
    });
  }
}
