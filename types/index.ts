export type TeamSummary = {
  name: string;
  shortName: string;
};

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';

export type Match = {
  id: string;
  stage: string;
  teamA: TeamSummary;
  teamB: TeamSummary;
  bestOf: 1 | 3 | 5;
  status: MatchStatus;
  date: string;
  time: string;
  venue: string;
  scoreA?: number;
  scoreB?: number;
};

export type Tournament = {
  id: string;
  name: string;
  description: string;
  format: 'GROUP' | 'KNOCKOUT' | 'GROUP_KNOCKOUT';
  startDate: string;
  endDate: string;
  teamCount: number;
  maxTeams: number;
  defaultBestOf: 1 | 3 | 5;
};

export type Standing = TeamSummary & {
  wins: number;
  losses: number;
  points: number;
};

export type Team = TeamSummary & {
  id: string;
  description: string;
  region: string;
  players: number;
  record: string;
  status: 'ACTIVE' | 'RECRUITING';
};

export type PlayerRole = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

export type Player = {
  id: string;
  summonerName: string;
  realName: string;
  role: PlayerRole;
  team: TeamSummary | null;
  rank: string;
  rating: number;
  matches: number;
  status: 'SIGNED' | 'FREE_AGENT';
};
