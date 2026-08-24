import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/auth/server';

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authenticated = await getAuthenticatedClient();
  if ('error' in authenticated) return NextResponse.json({ message: '请先登录。' }, { status: 401 });
  const { id } = await params;

  const { data, error } = await authenticated.supabase
    .from('tournament_registrations')
    .update({ status: 'CANCELLED' })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error || !data) return NextResponse.json({ message: '无法取消这次报名。' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
