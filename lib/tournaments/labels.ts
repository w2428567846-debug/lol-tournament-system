import type { Tournament } from '@/types';

export const tournamentVisibilityLabels: Record<Tournament['visibility'], string> = {
  PUBLIC: '公开赛事',
  UNLISTED: '仅限链接',
  PRIVATE: '群内赛事',
};

export const tournamentRegistrationTypeLabels: Record<Tournament['registrationType'], string> = {
  SOLO: '个人报名',
  TEAM: '队伍报名（历史模式）',
  BOTH: '个人与队伍报名（历史模式）',
};

export const tournamentFormatLabels: Record<Tournament['format'], string> = {
  GROUP: '小组赛',
  KNOCKOUT: '淘汰赛',
  GROUP_KNOCKOUT: '小组赛 + 淘汰赛',
};
