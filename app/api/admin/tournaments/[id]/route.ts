import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/auth/server';
import { parseTournamentInput } from '@/lib/admin/tournament-input';
import type { TournamentStatus } from '@/types';

const actionStatuses: Record<string, TournamentStatus> = {
  OPEN_REGISTRATION: 'REGISTRATION',
  CLOSE_REGISTRATION: 'REGISTRATION_CLOSED',
  LOCK_ROSTER: 'ROSTER_LOCKED',
};

async function requireAdmin() {
  return getAdminClient();
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if ('error' in admin) return NextResponse.json({ message: admin.error === 'ADMIN_REQUIRED' ? '管理员权限不足。' : '请先登录。' }, { status: admin.error === 'ADMIN_REQUIRED' ? 403 : 401 });
  const body = await request.json() as Record<string, unknown>;
  const { id } = await params;
  const { data: existing, error: loadError } = await admin.supabase.from('tournaments').select('registration_type').eq('id', id).maybeSingle();
  if (loadError || !existing) return NextResponse.json({ message: '赛事不存在或保存失败。' }, { status: 404 });
  const parsed = parseTournamentInput(body, { requireInviteForPrivate: false, existingRegistrationType: existing.registration_type });
  if (!parsed.value) return NextResponse.json({ message: parsed.error }, { status: 400 });
  const { data, error } = await admin.supabase.from('tournaments').update(parsed.value).eq('id', id).select('id, slug').maybeSingle();
  if (error || !data) {
    const message = error?.message.includes('tournaments_slug_key')
      ? '这个链接标识已经被使用。'
      : error?.message.includes('PLAYER_LIMIT_BELOW_APPROVED')
        ? '正式名额不能低于当前已通过人数。'
        : '赛事不存在或保存失败。';
    return NextResponse.json({ message }, { status: 400 });
  }
  return NextResponse.json({ tournament: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if ('error' in admin) return NextResponse.json({ message: admin.error === 'ADMIN_REQUIRED' ? '管理员权限不足。' : '请先登录。' }, { status: admin.error === 'ADMIN_REQUIRED' ? 403 : 401 });
  const body = await request.json() as Record<string, unknown>;
  const nextStatus = actionStatuses[String(body.action ?? '')];
  if (!nextStatus) return NextResponse.json({ message: '赛事操作无效。' }, { status: 400 });
  const { id } = await params;
  const { data, error } = await admin.supabase.from('tournaments').update({ status: nextStatus }).eq('id', id).select('id, status').maybeSingle();
  if (error || !data) {
    const invalidTransition = error?.message.includes('INVALID_TOURNAMENT_STATUS_TRANSITION');
    return NextResponse.json({ message: invalidTransition ? '当前赛事状态不能执行这个操作。' : '赛事状态更新失败。' }, { status: 400 });
  }
  return NextResponse.json({ tournament: data });
}
