import type { TournamentStatus } from '@/types';

export const tournamentStatusLabels: Record<TournamentStatus, string> = {
  DRAFT: '草稿',
  REGISTRATION: '报名开放',
  REGISTRATION_CLOSED: '报名已关闭',
  ROSTER_LOCKED: '名单已锁定',
  TEAM_FORMING: '队伍编排中',
  SCHEDULED: '赛程已发布',
  ONGOING: '比赛进行中',
  FINISHED: '已结束',
  CANCELLED: '已取消',
};

export const tournamentStatusDescriptions: Record<TournamentStatus, string> = {
  DRAFT: '仅管理员可见，可继续编辑赛事资料。',
  REGISTRATION: '在报名时间内，玩家可以提交、修改或取消报名。',
  REGISTRATION_CLOSED: '停止接收新报名，管理员可完成最后审核。',
  ROSTER_LOCKED: '正式名单已锁定，玩家不能自行修改或取消。',
  TEAM_FORMING: '主办方正在将已通过玩家编排进队伍。',
  SCHEDULED: '队伍与赛程已经确认，等待比赛开始。',
  ONGOING: '赛事正在进行。',
  FINISHED: '赛事已经完成。',
  CANCELLED: '赛事已取消。',
};
