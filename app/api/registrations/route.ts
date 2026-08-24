import { NextResponse } from 'next/server';
import { authGuardErrorResponse } from '@/lib/auth/api-response';
import { getAuthenticatedClient } from '@/lib/auth/server';
import { parseGameId } from '@/lib/game-id';
import type { PlayerRole } from '@/types';

const roles: PlayerRole[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

const messages: Record<string, string> = {
  INVALID_INVITE_CODE: '邀请码不正确。',
  INVITE_CODE_REQUIRED: '这项私人赛事需要邀请码。',
  ACCOUNT_ALREADY_REGISTERED: '你已经报名过这项赛事。',
  GAME_ID_ALREADY_REGISTERED: '这个游戏 ID 已经报名过这项赛事。',
  REGISTRATION_CLOSED: '当前不在报名时间内。',
  SOLO_REGISTRATION_DISABLED: '这项赛事不接受个人报名。',
};

export async function POST(request: Request) {
  const authenticated = await getAuthenticatedClient();
  if ('error' in authenticated) return authGuardErrorResponse(authenticated.error, '请先登录后报名。');

  const body = await request.json() as Record<string, unknown>;
  const tournamentId = String(body.tournament_id ?? '');
  const gameId = parseGameId(String(body.game_id ?? ''));
  const currentRank = String(body.current_rank ?? '').trim();
  const primaryRole = String(body.primary_role ?? '') as PlayerRole;
  const secondaryValue = String(body.secondary_role ?? '');
  const secondaryRole = secondaryValue ? secondaryValue as PlayerRole : null;
  const groupNickname = String(body.group_nickname ?? '').trim() || null;
  const note = String(body.note ?? '').trim() || null;
  const inviteCode = String(body.invite_code ?? '').trim() || null;

  if (!tournamentId || !gameId || !currentRank || currentRank.length > 40 || !roles.includes(primaryRole) || (secondaryRole && !roles.includes(secondaryRole))) return NextResponse.json({ message: '请填写有效的游戏 ID、段位和位置。' }, { status: 400 });
  if (secondaryRole === primaryRole) return NextResponse.json({ message: '首选与第二位置不能相同。' }, { status: 400 });
  if ((groupNickname?.length ?? 0) > 50 || (note?.length ?? 0) > 500) return NextResponse.json({ message: '群昵称或备注长度超出限制。' }, { status: 400 });

  const { data, error } = await authenticated.supabase.rpc('register_for_tournament', {
    p_tournament_id: tournamentId,
    p_game_name: gameId.gameName,
    p_game_tag: gameId.gameTag,
    p_current_rank: currentRank,
    p_primary_role: primaryRole,
    p_secondary_role: secondaryRole,
    p_group_nickname: groupNickname,
    p_note: note,
    p_invite_code: inviteCode,
  });

  if (error) {
    const key = Object.keys(messages).find((candidate) => error.message.includes(candidate));
    return NextResponse.json({ message: key ? messages[key] : '报名未能提交，请稍后重试。' }, { status: 400 });
  }
  return NextResponse.json({ registration: data }, { status: 201 });
}
