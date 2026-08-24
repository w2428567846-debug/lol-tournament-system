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
  slug: string;
  description: string;
  status: 'DRAFT' | 'REGISTRATION' | 'ONGOING' | 'FINISHED';
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  registrationType: 'SOLO' | 'TEAM' | 'BOTH';
  registrationStartAt: string;
  registrationEndAt: string;
  playerLimit: number | null;
  teamLimit: number | null;
  startAt: string;
  endAt: string;
  format: 'GROUP' | 'KNOCKOUT' | 'GROUP_KNOCKOUT';
  defaultBestOf: 1 | 3 | 5;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  rules?: string;
};

export type TournamentParticipantPreview = {
  displayName: string;
  primaryRole: PlayerRole;
  rank: string;
};

export type TournamentDetail = Tournament & {
  approvedCount: number;
  pendingCount: number;
  participants: TournamentParticipantPreview[];
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

export type PlayerProfile = {
  id: string;
  userId: string;
  displayName: string;
  riotId: string;
  server: string;
  primaryRole: PlayerRole;
  secondaryRole: PlayerRole | null;
  rank: string;
  groupNickname: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'WAITLISTED' | 'REJECTED' | 'CANCELLED';

export type TournamentRegistration = {
  id: string;
  tournamentId: string;
  playerId: string;
  status: RegistrationStatus;
  preferredRole: PlayerRole;
  secondaryRole: PlayerRole | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountRegistration = TournamentRegistration & {
  tournament: Pick<Tournament, 'name' | 'slug' | 'startAt'>;
};

export type AdminRegistration = TournamentRegistration & {
  player: Pick<PlayerProfile, 'displayName' | 'riotId' | 'server'>;
  tournament: Pick<Tournament, 'id' | 'name' | 'slug'>;
};
