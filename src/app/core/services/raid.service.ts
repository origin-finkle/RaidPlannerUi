import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AutoComposePreviewResultDTO,
  AutoComposeWeekRequestDTO,
  AutoComposeWeekResultDTO,
  BenchRecommendationDTO,
  MissingRaidPingDTO,
  OfficerDashboardDTO,
  PlayerEquitySummaryDTO,
  PlanningHealthSummaryDTO,
  RaidConfirmationSummaryDTO,
  RaidCompositionStateDTO,
  RaidDiagnosticDTO,
  RaidPublicationComparisonDTO,
  RaidCompositionDTO,
  RaidDayResponse,
  RaidPublicationHistoryDTO,
  RaidSchedulerStatusDTO,
  RaidTemplateDTO,
  UpdateRaidCompositionStateRequestDTO
} from '../models/raid.model';

@Injectable({ providedIn: 'root' })
export class RaidService {
  constructor(private http: HttpClient) {}

  saveComposition(dto: RaidCompositionDTO): Observable<void> {
    return this.http.post<void>(`/api/raids/composition`, dto);
  }

  getAutoComposeSettings(): Observable<AutoComposeWeekRequestDTO> {
    return this.http.get<AutoComposeWeekRequestDTO>('/api/raids/auto-compose-settings');
  }

  updateAutoComposeSettings(dto: AutoComposeWeekRequestDTO): Observable<AutoComposeWeekRequestDTO> {
    return this.http.put<AutoComposeWeekRequestDTO>('/api/raids/auto-compose-settings', dto);
  }

  getGroupedRaids(): Observable<RaidDayResponse[]> {
    return this.http.get<RaidDayResponse[]>('/api/raids');
  }

  getRaidDiagnostic(raidId: number): Observable<RaidDiagnosticDTO> {
    return this.http.get<RaidDiagnosticDTO>(`/api/raids/${raidId}/diagnostic`);
  }

  getCompositionState(raidId: number): Observable<RaidCompositionStateDTO> {
    return this.http.get<RaidCompositionStateDTO>(`/api/raids/${raidId}/composition-state`);
  }

  updateCompositionState(raidId: number, dto: UpdateRaidCompositionStateRequestDTO): Observable<RaidCompositionStateDTO> {
    return this.http.patch<RaidCompositionStateDTO>(`/api/raids/${raidId}/composition-state`, dto);
  }

  getPublicationComparison(raidId: number): Observable<RaidPublicationComparisonDTO> {
    return this.http.get<RaidPublicationComparisonDTO>(`/api/raids/${raidId}/publication-compare`);
  }

  getRaidConfirmations(raidId: number): Observable<RaidConfirmationSummaryDTO> {
    return this.http.get<RaidConfirmationSummaryDTO>(`/api/raids/${raidId}/confirmations`);
  }

  getBenchRecommendations(raidId: number): Observable<BenchRecommendationDTO> {
    return this.http.get<BenchRecommendationDTO>(`/api/raids/${raidId}/bench-manager`);
  }

  exportFormattedCompo(raidId: number, texte: string, envoyerSurDiscord: boolean, overrideChannelId?: string | null) {
    return this.http.post<void>(`/api/raids/${raidId}/export`, {
      texteFormatte: texte,
      envoyerSurDiscord,
      overrideChannelId: overrideChannelId ?? null
    });
  }

  autoComposeWeek(raidId: number, config: AutoComposeWeekRequestDTO): Observable<AutoComposeWeekResultDTO> {
    return this.http.post<AutoComposeWeekResultDTO>(`/api/raids/${raidId}/auto-compose-week`, config);
  }

  previewAutoComposeWeek(raidId: number, config: AutoComposeWeekRequestDTO): Observable<AutoComposePreviewResultDTO> {
    return this.http.post<AutoComposePreviewResultDTO>(`/api/raids/${raidId}/auto-compose-week/preview`, config);
  }

  rescanRaid(raidId: number): Observable<string> {
    return this.http.post(`/api/raids/${raidId}/rescan`, {}, { responseType: 'text' });
  }

  getMissingPing(raidId: number): Observable<MissingRaidPingDTO> {
    return this.http.get<MissingRaidPingDTO>(`/api/raids/${raidId}/missing-ping`);
  }

  sendMissingPingToTestChannel(raidId: number): Observable<MissingRaidPingDTO> {
    return this.http.post<MissingRaidPingDTO>(`/api/raids/${raidId}/missing-ping/test`, {});
  }

  publishCustomSignupFlowToTestChannel(raidId: number): Observable<string> {
    return this.http.post(`/api/raids/${raidId}/signup-flow/test`, {}, { responseType: 'text' });
  }

  publishCustomSignupFlowToRaidChannel(raidId: number, channelId?: string | null): Observable<string> {
    const query = channelId ? `?channelId=${encodeURIComponent(channelId)}` : '';
    return this.http.post(`/api/raids/${raidId}/signup-flow/publish${query}`, {}, { responseType: 'text' });
  }

  publishTemplateSignupFlowToTestChannel(templateId: number, weekOffset = 0): Observable<string> {
    return this.http.post(`/api/raids/templates/${templateId}/signup-flow/test?weekOffset=${weekOffset}`, {}, { responseType: 'text' });
  }

  publishTemplateSignupFlowToRaidChannel(templateId: number, weekOffset = 0): Observable<string> {
    return this.http.post(`/api/raids/templates/${templateId}/signup-flow/publish?weekOffset=${weekOffset}`, {}, { responseType: 'text' });
  }

  addManualSignup(raidId: number, personnageId: number): Observable<void> {
    return this.http.post<void>(`/api/raids/${raidId}/manual-signups`, { personnageId });
  }

  removeManualSignup(raidId: number, personnageId: number): Observable<void> {
    return this.http.delete<void>(`/api/raids/${raidId}/manual-signups/${personnageId}`);
  }

  getPlanningHealth(): Observable<PlanningHealthSummaryDTO> {
    return this.http.get<PlanningHealthSummaryDTO>('/api/raids/planning-health');
  }

  getOfficerDashboard(): Observable<OfficerDashboardDTO> {
    return this.http.get<OfficerDashboardDTO>('/api/raids/officer-dashboard');
  }

  getPublicationHistory(): Observable<RaidPublicationHistoryDTO[]> {
    return this.http.get<RaidPublicationHistoryDTO[]>('/api/raids/publication-history');
  }

  getRaidSchedulerStatus(): Observable<RaidSchedulerStatusDTO> {
    return this.http.get<RaidSchedulerStatusDTO>('/api/raids/scheduler-status');
  }

  updateRaidSchedulerStatus(dto: RaidSchedulerStatusDTO): Observable<RaidSchedulerStatusDTO> {
    return this.http.put<RaidSchedulerStatusDTO>('/api/raids/scheduler-status', dto);
  }

  getPlayerEquity(): Observable<PlayerEquitySummaryDTO> {
    return this.http.get<PlayerEquitySummaryDTO>('/api/raids/player-equity');
  }

  getRaidTemplates(): Observable<RaidTemplateDTO[]> {
    return this.http.get<RaidTemplateDTO[]>('/api/raids/templates');
  }

  saveRaidTemplate(dto: RaidTemplateDTO): Observable<RaidTemplateDTO> {
    return this.http.post<RaidTemplateDTO>('/api/raids/templates', dto);
  }

  deleteRaidTemplate(templateId: number): Observable<void> {
    return this.http.delete<void>(`/api/raids/templates/${templateId}`);
  }
}
