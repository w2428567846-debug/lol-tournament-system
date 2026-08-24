import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/auth/server';
import type { PlayerRole } from '@/types';

const roles: PlayerRole[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
const servers = ['JP1', 'KR', 'TW2', 'SG2', 'NA1', 'EUW1'];

export async function PUT(request: Request) {
  const authenticated = await getAuthenticatedClient();
  if ('error' in authenticated) return NextResponse.json({ message: authenticated.error === 'AUTH_REQUIRED' ? '请先登录。' : 'Supabase 尚未配置。' }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const displayName = String(body.display_name ?? '').trim();
  const riotId = String(body.riot_id ?? '').trim();
  const server = String(body.server ?? '');
  const primaryRole = String(body.primary_role ?? '') as PlayerRole;
  const secondaryValue = String(body.secondary_role ?? '');
  const secondaryRole = secondaryValue ? secondaryValue as PlayerRole : null;
  const rank = String(body.rank ?? '').trim();
  const groupNickname = String(body.group_nickname ?? '').trim() || null;
  const bio = String(body.bio ?? '').trim() || null;

  if (displayName.length < 2 || displayName.length > 32) return NextResponse.json({ message: '显示名称需为 2–32 个字符。' }, { status: 400 });
  if (!/^.{1,16}#[A-Za-z0-9]{2,5}$/.test(riotId)) return NextResponse.json({ message: 'Riot ID 格式应类似 PlayerName#JP1。' }, { status: 400 });
  if (!servers.includes(server) || !roles.includes(primaryRole) || (secondaryRole && !roles.includes(secondaryRole))) return NextResponse.json({ message: '服务器或位置无效。' }, { status: 400 });
  if (secondaryRole === primaryRole) return NextResponse.json({ message: '主位置与副位置不能相同。' }, { status: 400 });
  if (!rank || rank.length > 40 || (groupNickname?.length ?? 0) > 50 || (bio?.length ?? 0) > 500) return NextResponse.json({ message: '档案内容长度不符合要求。' }, { status: 400 });

  const { error } = await authenticated.supabase.from('player_profiles').upsert({
    user_id: authenticated.user.id,
    display_name: displayName,
    riot_id: riotId,
    server,
    primary_role: primaryRole,
    secondary_role: secondaryRole,
    rank,
    group_nickname: groupNickname,
    bio,
  }, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ message: '保存失败，请确认 Riot ID 未被其他资料占用。' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
