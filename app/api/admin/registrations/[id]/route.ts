import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/auth/server';
import type { RegistrationStatus } from '@/types';

const allowed: RegistrationStatus[] = ['APPROVED', 'WAITLISTED', 'REJECTED'];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminClient();
  if ('error' in admin) return NextResponse.json({ message: admin.error === 'ADMIN_REQUIRED' ? '管理员权限不足。' : '请先登录。' }, { status: admin.error === 'ADMIN_REQUIRED' ? 403 : 401 });
  const body = await request.json() as Record<string, unknown>;
  const status = String(body.status ?? '') as RegistrationStatus;
  if (!allowed.includes(status)) return NextResponse.json({ message: '审核状态无效。' }, { status: 400 });
  const { id } = await params;
  const { data, error } = await admin.supabase.from('tournament_registrations').update({ status }).eq('id', id).select('id').maybeSingle();
  if (error || !data) {
    const capacityReached = error?.message.includes('APPROVED_CAPACITY_REACHED');
    return NextResponse.json({ message: capacityReached ? '正式通过名额已满，不能继续通过。可先设为候补。' : '报名记录不存在或无法更新。' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
