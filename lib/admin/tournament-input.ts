import type { Tournament } from '@/types';
import { isSupportedRegistrationType } from '@/lib/tournaments/domain';
import { DEFAULT_TOURNAMENT_TIMEZONE, isValidTimeZone, localDateTimeToUtc } from '@/lib/timezone';

const visibilities: Tournament['visibility'][] = ['PUBLIC', 'UNLISTED', 'PRIVATE'];
const formats: Tournament['format'][] = ['GROUP', 'KNOCKOUT', 'GROUP_KNOCKOUT'];
const bestOfValues: Tournament['defaultBestOf'][] = [1, 3, 5];

export type TournamentInput = {
  name: string;
  slug: string;
  description: string;
  rules: string;
  registration_type: Tournament['registrationType'];
  timezone: string;
  visibility: Tournament['visibility'];
  registration_start_at: string;
  registration_end_at: string;
  player_limit: number | null;
  team_limit: number | null;
  start_at: string;
  end_at: string;
  format: Tournament['format'];
  default_best_of: Tournament['defaultBestOf'];
  invite_code?: string;
};

export function parseTournamentInput(body: Record<string, unknown>, options: { requireInviteForPrivate: boolean; existingRegistrationType?: Tournament['registrationType'] }): { value?: TournamentInput; error?: string } {
  const name = String(body.name ?? '').trim();
  const slug = String(body.slug ?? '').trim().toLocaleLowerCase('en-US');
  const description = String(body.description ?? '').trim();
  const rules = String(body.rules ?? '').trim();
  const registrationType = String(body.registration_type ?? '') as Tournament['registrationType'];
  const timezone = String(body.timezone ?? DEFAULT_TOURNAMENT_TIMEZONE).trim();
  const visibility = String(body.visibility ?? '') as Tournament['visibility'];
  const format = String(body.format ?? '') as Tournament['format'];
  const defaultBestOf = Number(body.default_best_of) as Tournament['defaultBestOf'];
  const playerLimitValue = String(body.player_limit ?? '').trim();
  const teamLimitValue = String(body.team_limit ?? '').trim();
  const playerLimit = playerLimitValue ? Number(playerLimitValue) : null;
  const teamLimit = teamLimitValue ? Number(teamLimitValue) : null;
  const inviteCode = String(body.invite_code ?? '').trim();
  if (!isValidTimeZone(timezone)) return { error: '赛事时区无效。' };
  const registrationStart = localDateTimeToUtc(String(body.registration_start_at ?? ''), timezone);
  const registrationEnd = localDateTimeToUtc(String(body.registration_end_at ?? ''), timezone);
  const start = localDateTimeToUtc(String(body.start_at ?? ''), timezone);
  const end = localDateTimeToUtc(String(body.end_at ?? ''), timezone);

  if (name.length < 3 || name.length > 100) return { error: '赛事名称需为 3–100 个字符。' };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: '链接标识只能使用小写字母、数字和连字符。' };
  const preservesLegacyType = options.existingRegistrationType !== undefined && registrationType === options.existingRegistrationType;
  if ((!isSupportedRegistrationType(registrationType) && !preservesLegacyType) || !visibilities.includes(visibility) || !formats.includes(format) || !bestOfValues.includes(defaultBestOf)) return { error: '当前阶段只支持个人报名赛事。' };
  if (!registrationStart || !registrationEnd || !start || !end) return { error: '请填写完整且有效的赛事当地日期时间。' };
  if (registrationStart >= registrationEnd || start >= end || registrationEnd > end) return { error: '报名与赛事日期顺序不正确。' };
  if (registrationType === 'SOLO' && (!Number.isInteger(playerLimit) || (playerLimit ?? 0) < 1)) return { error: '个人报名赛事必须设置正式通过名额。' };
  if (playerLimit !== null && (!Number.isInteger(playerLimit) || playerLimit < 1)) return { error: '正式通过名额必须为正整数。' };
  if (teamLimit !== null && (!Number.isInteger(teamLimit) || teamLimit < 1)) return { error: '队伍上限必须为正整数。' };
  if (visibility === 'PRIVATE' && options.requireInviteForPrivate && !inviteCode) return { error: '私人赛事必须设置邀请码。' };

  return {
    value: {
      name,
      slug,
      description,
      rules,
      registration_type: registrationType,
      timezone,
      visibility,
      registration_start_at: registrationStart,
      registration_end_at: registrationEnd,
      player_limit: playerLimit,
      team_limit: teamLimit,
      start_at: start,
      end_at: end,
      format,
      default_best_of: defaultBestOf,
      ...(inviteCode ? { invite_code: inviteCode } : {}),
    },
  };
}
