import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/auth/server';
import { parseGameId } from '@/lib/game-id';
import type { PlayerRole } from '@/types';

const roles: PlayerRole[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

const messages: Record<string, string> = {
  ROSTER_LOCKED: '报名已经关闭或名单已锁定，不能再修改。',
  REGISTRATION_NOT_EDITABLE: '当前报名状态不能自行修改。',
  GAME_ID_ALREADY_REGISTERED: '这个游戏 ID 已经报名过这项赛事。',
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authenticated = await getAuthenticatedClient();
  if ('error' in authenticated) return NextResponse.json({ message: '请先登录。' }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const gameId = parseGameId(String(body.game_id ?? ''));
  const currentRank = String(body.current_rank ?? '').trim();
  const primaryRole = String(body.primary_role ?? '') as PlayerRole;
  const secondaryValue = String(body.secondary_role ?? '');
  const secondaryRole = secondaryValue ? secondaryValue as PlayerRole : null;
  const groupNickname = String(body.group_nickname ?? '').trim() || null;
  const note = String(body.note ?? '').trim() || null;

  if (!gameId || !currentRank || currentRank.length > 40 || !roles.includes(primaryRole) || (secondaryRole && !roles.includes(secondaryRole))) {
    return NextResponse.json({ message: '请填写有效的游戏 ID、段位和位置。' }, { status: 400 });
  }
  if (primaryRole === secondaryRole) return NextResponse.json({ message: '首选与第二位置不能相同。' }, { status: 400 });
  if ((groupNickname?.length ?? 0) > 50 || (note?.length ?? 0) > 500) return NextResponse.json({ message: '群昵称或备注长度超出限制。' }, { status: 400 });

  const { id } = await params;
  const { data, error } = await authenticated.supabase
    .from('tournament_registrations')
    .update({
      game_name: gameId.gameName,
      game_tag: gameId.gameTag,
      rank_snapshot: currentRank,
      primary_role: primaryRole,
      secondary_role: secondaryRole,
      group_nickname_snapshot: groupNickname,
      note,
    })
    .eq('id', id)
    .select('id, status')
    .maybeSingle();

  if (error || !data) {
    const key = error ? Object.keys(messages).find((candidate) => error.message.includes(candidate)) : undefined;
    const duplicate = error?.message.includes('unique_game_id_tournament');
    return NextResponse.json({ message: duplicate ? messages.GAME_ID_ALREADY_REGISTERED : key ? messages[key] : '无法修改这次报名。' }, { status: 400 });
  }

  return NextResponse.json({ registration: data });
}
