import type { PlayerRole, RegistrationStatus } from '@/types';

export const registrationStatusLabels: Record<RegistrationStatus, string> = {
  PENDING: '等待审核',
  APPROVED: '已通过',
  WAITLISTED: '候补名单',
  REJECTED: '未通过',
  CANCELLED: '已取消',
};

export const playerRoleLabels: Record<PlayerRole, string> = {
  TOP: '上路',
  JUNGLE: '打野',
  MID: '中路',
  ADC: '下路',
  SUPPORT: '辅助',
};
