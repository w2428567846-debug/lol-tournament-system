import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/auth/server';
import { parseTournamentInput } from '@/lib/admin/tournament-input';

export async function POST(request: Request) {
  const admin = await getAdminClient();
  if ('error' in admin) return NextResponse.json({ message: admin.error === 'ADMIN_REQUIRED' ? '管理员权限不足。' : '请先登录。' }, { status: admin.error === 'ADMIN_REQUIRED' ? 403 : 401 });

  const body = await request.json() as Record<string, unknown>;
  const parsed = parseTournamentInput(body, { requireInviteForPrivate: true });
  if (!parsed.value) return NextResponse.json({ message: parsed.error }, { status: 400 });
  const status = body.intent === 'OPEN_REGISTRATION' ? 'REGISTRATION' : 'DRAFT';

  const { data, error } = await admin.supabase
    .from('tournaments')
    .insert({ ...parsed.value, status, created_by: admin.account.id })
    .select('id, slug')
    .single();

  if (error) {
    const duplicateSlug = error.message.includes('tournaments_slug_key');
    return NextResponse.json({ message: duplicateSlug ? '这个链接标识已经被使用。' : '赛事创建失败，请检查资料。' }, { status: 400 });
  }
  return NextResponse.json({ tournament: data }, { status: 201 });
}
