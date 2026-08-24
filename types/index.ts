export type TeamSummary = {
  name: string;
  shortName: string;
};

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';

export type TournamentStatus =
  | 'DRAFT'
  | 'REGISTRATION'
  | 'REGISTRATION_CLOSED'
  | 'ROSTER_LOCKED'
  | 'TEAM_FORMING'
  | 'SCHEDULED'
  | 'ONGOING'
  | 'FINISHED'
  | 'CANCELLED';

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
  status: TournamentStatus;
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  registrationType: 'SOLO' | 'TEAM' | 'BOTH';
  timezone: string;
  registrationStartAt: string;
  registrationEndAt: string;
  playerLimit: number | null;
  teamLimit: number | null;
  startAt: string;
  endAt: string;
  format: 'GROUP' | 'KNOCKOUT' | 'GROUP_KNOCKOUT';
  defaultBestOf: 1 | 3 | 5;
  createdAt: string;
  updatedAt: string;
  rules?: string;
};

export type TournamentParticipantPreview = {
  gameId: string;
  primaryRole: PlayerRole;
  rank: string;
};

export type TournamentDetail = Tournament & {
  approvedCount: number;
  pendingCount: number;
  waitlistedCount: number;
  participants: TournamentParticipantPreview[];
  participantsRestricted: boolean;
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
  gameName: string;
  gameTag: string;
  gameId: string;
  primaryRole: PlayerRole;
  secondaryRole: PlayerRole | null;
  currentRank: string;
  groupNickname: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthProvider = 'WECHAT' | 'EMAIL_DEV';

export type Account = {
  id: string;
  authProvider: AuthProvider;
  role: 'USER' | 'ADMIN';
  wechatNickname: string | null;
  wechatAvatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'WAITLISTED' | 'REJECTED' | 'CANCELLED';

export type TournamentRegistration = {
  id: string;
  tournamentId: string;
  gameName: string;
  gameTag: string;
  gameId: string;
  rankSnapshot: string;
  status: RegistrationStatus;
  primaryRole: PlayerRole;
  secondaryRole: PlayerRole | null;
  groupNicknameSnapshot: string | null;
  note: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  reviewerLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountRegistration = TournamentRegistration & {
  tournament: Pick<Tournament, 'name' | 'slug' | 'startAt' | 'status' | 'timezone' | 'registrationStartAt' | 'registrationEndAt'>;
  canSelfManage: boolean;
  canResubmit: boolean;
  rosterLocked: boolean;
};

export type AdminRegistration = TournamentRegistration & {
  tournament: Pick<Tournament, 'id' | 'name' | 'slug' | 'status' | 'timezone'>;
};
