import { NextResponse } from 'next/server';
import { authGuardErrorResponse } from '@/lib/auth/api-response';
import { getAuthenticatedClient } from '@/lib/auth/server';
import { parseGameId } from '@/lib/game-id';
import type { PlayerRole } from '@/types';

const roles: PlayerRole[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

export async function PUT(request: Request) {
  const authenticated = await getAuthenticatedClient();
  if ('error' in authenticated) return authGuardErrorResponse(authenticated.error);

  const body = await request.json() as Record<string, unknown>;
  const gameId = parseGameId(String(body.game_id ?? ''));
  const primaryRole = String(body.primary_role ?? '') as PlayerRole;
  const secondaryValue = String(body.secondary_role ?? '');
  const secondaryRole = secondaryValue ? secondaryValue as PlayerRole : null;
  const currentRank = String(body.current_rank ?? '').trim();
  const groupNickname = String(body.group_nickname ?? '').trim() || null;
  const bio = String(body.bio ?? '').trim() || null;

  if (!gameId) return NextResponse.json({ message: '游戏 ID 格式应类似 玩家名字#12345。' }, { status: 400 });
  if (!roles.includes(primaryRole) || (secondaryRole && !roles.includes(secondaryRole))) return NextResponse.json({ message: '游戏位置无效。' }, { status: 400 });
  if (secondaryRole === primaryRole) return NextResponse.json({ message: '主位置与副位置不能相同。' }, { status: 400 });
  if (!currentRank || currentRank.length > 40 || (groupNickname?.length ?? 0) > 50 || (bio?.length ?? 0) > 500) return NextResponse.json({ message: '档案内容长度不符合要求。' }, { status: 400 });

  const { error } = await authenticated.supabase.from('player_profiles').upsert({
    account_id: authenticated.account.id,
    game_name: gameId.gameName,
    game_tag: gameId.gameTag,
    primary_role: primaryRole,
    secondary_role: secondaryRole,
    current_rank: currentRank,
    group_nickname: groupNickname,
    bio,
  }, { onConflict: 'account_id' });

  if (error) return NextResponse.json({ message: '保存失败，请检查游戏 ID 与资料格式。' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
