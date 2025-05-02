export interface RaidDayResponse {
  date: string;
  raids: RaidDTO[];
}

export interface RaidDTO {
  id: number;
  nom: string;
  heure: string;
  joueurDTOList: JoueurDTO[];
  group1?: PersonnageDTO[];
  group2?: PersonnageDTO[];

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

export interface BuffProvider  {
  classe: string;
  specialisations?: string[];
}


