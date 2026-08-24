import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/auth/server';
import type { PlayerRole } from '@/types';

const roles: PlayerRole[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

const messages: Record<string, string> = {
  INVALID_INVITE_CODE: '邀请码不正确。',
  INVITE_CODE_REQUIRED: '这项私人赛事需要邀请码。',
  ALREADY_REGISTERED: '你已经报名过这项赛事。',
  PLAYER_PROFILE_REQUIRED: '请先完成选手档案。',
  REGISTRATION_CLOSED: '当前不在报名时间内。',
  PLAYER_LIMIT_REACHED: '报名人数已达到上限。',
  SOLO_REGISTRATION_DISABLED: '这项赛事不接受个人报名。',
};

export async function POST(request: Request) {
  const authenticated = await getAuthenticatedClient();
  if ('error' in authenticated) return NextResponse.json({ message: '请先登录后报名。' }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const tournamentId = String(body.tournament_id ?? '');
  const preferredRole = String(body.preferred_role ?? '') as PlayerRole;
  const secondaryValue = String(body.secondary_role ?? '');
  const secondaryRole = secondaryValue ? secondaryValue as PlayerRole : null;
  const note = String(body.note ?? '').trim() || null;
  const inviteCode = String(body.invite_code ?? '').trim() || null;

  if (!tournamentId || !roles.includes(preferredRole) || (secondaryRole && !roles.includes(secondaryRole))) return NextResponse.json({ message: '报名资料不完整。' }, { status: 400 });
  if (secondaryRole === preferredRole) return NextResponse.json({ message: '首选与第二位置不能相同。' }, { status: 400 });
  if ((note?.length ?? 0) > 500) return NextResponse.json({ message: '备注不能超过 500 个字符。' }, { status: 400 });

  const { data, error } = await authenticated.supabase.rpc('register_for_tournament', {
    p_tournament_id: tournamentId,
    p_preferred_role: preferredRole,
    p_secondary_role: secondaryRole,
    p_note: note,
    p_invite_code: inviteCode,
  });

  if (error) {
    const key = Object.keys(messages).find((candidate) => error.message.includes(candidate));
    return NextResponse.json({ message: key ? messages[key] : '报名未能提交，请稍后重试。' }, { status: 400 });
  }
  return NextResponse.json({ registration: data }, { status: 201 });
}
