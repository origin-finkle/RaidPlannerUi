import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import {JoueurDTO, PersonnageDTO} from '../models/raid.model';

@Injectable({ providedIn: 'root' })
export class JoueurService {
  constructor(private http: HttpClient) {}

  getJoueurs(): Observable<JoueurDTO[]> {
    return this.http.get<JoueurDTO[]>('/api/joueurs');
  }

  updatePseudoIhm(id: number, pseudoIhm: string): Observable<void> {
    return this.http.put<void>(`/api/joueurs/${id}/pseudo`, { pseudoIhm });
  }

  updatePersonnage(personnage: PersonnageDTO): Observable<void> {
    return this.http.put<void>(`/api/personnages/${personnage.id}`, personnage);
  }

  addPersonnage(joueurId: number, personnage: PersonnageDTO): Observable<any> {
    return this.http.post(`/api/personnages/${joueurId}/personnages`, personnage);
  }

  deletePersonnage(personnageId:number): Observable<any> {
    return this.http.delete<void>(`/api/personnages/${personnageId}`);
  }

  mergePersonnages(joueurId: number, sourcePersonnageId: number, targetPersonnageId: number): Observable<void> {
    return this.http.post<void>(`/api/personnages/joueurs/${joueurId}/merge`, {
      sourcePersonnageId,
      targetPersonnageId
    });
  }

  getJoueurById(id:number): Observable<JoueurDTO> {
    return this.http.get<JoueurDTO>(`/api/joueurs/${id}`);

  }

}
