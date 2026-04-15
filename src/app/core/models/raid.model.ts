export interface RaidDayResponse {
  date: string;
  raids: RaidDTO[];
}

export interface RaidDTO {
  id: number;
  nom: string;
  heure: string;
  channelId: string;
  joueurDTOList: JoueurDTO[];
  group1?: PersonnageDTO[];
  group2?: PersonnageDTO[];
  compositionStatus: 'DRAFT' | 'READY' | 'PUBLISHED' | string;
  compositionLocked: boolean;
  lastPublishedAt: string | null;
}

export interface JoueurDTO {
  id: number;
  pseudoIhm: string;
  pseudo: string;
  serverPseudo: string;
  personnageMain: PersonnageDTO;
  rerolls: PersonnageDTO[];
  raider: boolean;
  statutParticipation: string;
  commentaireInscription?: string | null;
}

export interface PersonnageDTO {
  id: number;
  nom: string;
  classe: string;
  specialisation: string;
  role: string;
  main: boolean;

  // Ajouté uniquement pour le front (non fourni par le back, injecté manuellement)
  pseudo?: string;
  usedAt?: string;
}

export interface RaidCompositionDTO {
  raidId: number;
  group1: PersonnageDTO[];
  group2: PersonnageDTO[];
}

export interface AutoComposeWeekResultDTO {
  selectedRaidIds: number[];
  updatedRaidIds: number[];
  warnings: string[];
}

export interface AutoComposePreviewRaidDTO {
  raidId: number;
  raidNom: string;
  raidDate: string;
  group1: PersonnageDTO[];
  group2: PersonnageDTO[];
  assignedCount: number;
}

export interface AutoComposePreviewResultDTO {
  selectedRaidIds: number[];
  warnings: string[];
  previewRaids: AutoComposePreviewRaidDTO[];
}

export interface AutoComposeWeekRequestDTO {
  maxRaids: number;
  targetTanks: number;
  targetHeals: number;
  preferMains: boolean;
  balanceAcrossRaids: boolean;
  prioritizeBuffCoverage: boolean;
  huntersFillMissingBuffs: boolean;
}

export interface RaidCompositionStateDTO {
  raidId: number;
  status: 'DRAFT' | 'READY' | 'PUBLISHED' | string;
  locked: boolean;
  lastPublishedAt: string | null;
  hasPublishedSnapshot: boolean;
}

export interface UpdateRaidCompositionStateRequestDTO {
  status?: 'DRAFT' | 'READY' | 'PUBLISHED' | string;
  locked?: boolean;
}

export interface MissingRaidPingDTO {
  message: string;
  missingCount: number;
  missingPlayers: string[];
}

export interface BuffProvider  {
  classe: string;
  specialisations?: string[];
}

export interface RaidSignupDiagnosticDTO {
  joueurId: number;
  pseudo: string;
  pseudoIhm: string;
  serverPseudo: string;
  personnageId: number;
  personnageNom: string;
  classe: string;
  specialisation: string;
  role: string;
  main: boolean;
  statutParticipation: string;
}

export interface RaidMessageDiagnosticDTO {
  channelId: string;
  channelName: string;
  guildId: string;
  messageId: number;
  url: string | null;
  author: string;
  bot: boolean;
  createdAt: string;
  title: string | null;
  description: string | null;
  parsedAsRaidHelper: boolean;
  compositionTool: boolean;
  placeholderSignup: boolean;
  extractedNom: string | null;
  extractedDate: string | null;
  raidHelperId: string | null;
  signupLineCount: number;
  linkedChannelId: string | null;
  linkedMessageId: number | null;
}

export interface RaidDiagnosticDTO {
  raidId: number;
  nom: string;
  date: string;
  storedChannelId: string;
  storedMessageId: number;
  storedRaidHelperId: string | null;
  publishedChannelId: string | null;
  publishedMessageId: number | null;
  storedMessage: RaidMessageDiagnosticDTO | null;
  resolvedMessage: RaidMessageDiagnosticDTO | null;
  sourceChanged: boolean;
  liveSignups: RaidSignupDiagnosticDTO[];
  snapshotSignups: RaidSignupDiagnosticDTO[];
  liveOnlyPlayers: string[];
  snapshotOnlyPlayers: string[];
}

export interface PlanningHealthIssueDTO {
  raidId: number;
  raidNom: string;
  raidDate: string;
  severity: 'low' | 'medium' | 'high' | string;
  liveSignupCount: number;
  snapshotSignupCount: number;
  published: boolean;
  issues: string[];
}

export interface PlanningHealthSummaryDTO {
  totalRaids: number;
  raidsWithIssues: number;
  raidsWithoutSignups: number;
  unpublishedRaids: number;
  outdatedRaids: number;
  issues: PlanningHealthIssueDTO[];
}

export interface RaidPublicationHistoryDTO {
  id: number;
  raidId: number;
  raidNom: string;
  raidDate: string;
  channelId: string;
  guildId: string | null;
  messageId: number;
  updated: boolean;
  testPublication: boolean;
  publishedAt: string;
  messageUrl: string | null;
}

export interface RaidSchedulerStatusDTO {
  enabled: boolean;
  dayOfWeek: string;
  hour: number;
  minute: number;
  cron: string;
  timezone: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastImportedCount: number | null;
  publicationDay: string;
  publicationTime: string;
  channelIds: string[];
  channelNames: string[];
}

export interface RaidPublicationComparisonDTO {
  raidId: number;
  raidNom: string;
  raidDate: string;
  lastPublishedAt: string | null;
  hasPublishedSnapshot: boolean;
  currentGroup1: PersonnageDTO[];
  currentGroup2: PersonnageDTO[];
  publishedGroup1: PersonnageDTO[];
  publishedGroup2: PersonnageDTO[];
  currentOnlyPlayers: string[];
  publishedOnlyPlayers: string[];
}

export interface RaidConfirmationPlayerDTO {
  joueurId: number;
  personnageId: number;
  pseudoIhm: string;
  serverPseudo: string;
  personnageNom: string;
  classe: string;
  specialisation: string;
  role: string;
  confirmationStatus: string;
}

export interface RaidConfirmationSummaryDTO {
  raidId: number;
  raidNom: string;
  raidDate: string;
  totalPlayers: number;
  confirmedCount: number;
  cancelledCount: number;
  pendingCount: number;
  completionRate: number;
  confirmedPlayers: RaidConfirmationPlayerDTO[];
  cancelledPlayers: RaidConfirmationPlayerDTO[];
  pendingPlayers: RaidConfirmationPlayerDTO[];
}

export interface BenchSuggestionPlayerDTO {
  joueurId: number;
  personnageId: number;
  pseudoIhm: string;
  serverPseudo: string;
  personnageNom: string;
  classe: string;
  specialisation: string;
  role: string;
  mainCharacter: boolean;
  signupStatus: string;
  confirmationStatus: string;
  fairnessScore: number;
  reasons: string[];
}

export interface BenchRecommendationDTO {
  raidId: number;
  raidNom: string;
  raidDate: string;
  assignedCount: number;
  reserveCount: number;
  benchCandidates: BenchSuggestionPlayerDTO[];
  reserveCandidates: BenchSuggestionPlayerDTO[];
  warnings: string[];
}

export interface OfficerDashboardRaidDTO {
  raidId: number;
  raidNom: string;
  raidDate: string;
  compositionStatus: string;
  compositionLocked: boolean;
  published: boolean;
  totalAssignedPlayers: number;
  confirmedCount: number;
  cancelledCount: number;
  pendingCount: number;
  liveSignupCount: number;
  healthIssueCount: number;
  actions: string[];
}

export interface OfficerDashboardDTO {
  trackedRaids: number;
  readyToPublishCount: number;
  pendingConfirmationRaidCount: number;
  raidsWithDeclines: number;
  raidsWithHealthIssues: number;
  raids: OfficerDashboardRaidDTO[];
}

export interface RaidTemplateDTO {
  id: number | null;
  nom: string;
  jourSemaine: string;
  heure: string;
  channelId: string;
  messageId: string | null;
  raidSize: number | null;
  targetTanks: number | null;
  targetHeals: number | null;
  preferMains: boolean | null;
  prioritizeBuffCoverage: boolean | null;
  huntersFillMissingBuffs: boolean | null;
}

export interface PlayerEquityRowDTO {
  joueurId: number;
  pseudoIhm: string;
  serverPseudo: string;
  raidsAssigned: number;
  signupsCount: number;
  mainAssignments: number;
  rerollAssignments: number;
  benchCount: number;
  lateCount: number;
  tentativeCount: number;
  absenceCount: number;
}

export interface PlayerEquitySummaryDTO {
  rangeStart: string;
  rangeEnd: string;
  totalPlayers: number;
  players: PlayerEquityRowDTO[];
}


