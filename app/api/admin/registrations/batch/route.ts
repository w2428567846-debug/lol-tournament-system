import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/auth/server';
import type { RegistrationStatus } from '@/types';

const allowed: RegistrationStatus[] = ['APPROVED', 'WAITLISTED', 'REJECTED'];

export async function PATCH(request: Request) {
  const admin = await getAdminClient();
  if ('error' in admin) return NextResponse.json({ message: admin.error === 'ADMIN_REQUIRED' ? '管理员权限不足。' : '请先登录。' }, { status: admin.error === 'ADMIN_REQUIRED' ? 403 : 401 });

  const body = await request.json() as Record<string, unknown>;
  const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
  const status = String(body.status ?? '') as RegistrationStatus;
  if (ids.length < 1 || ids.length > 100 || !allowed.includes(status)) return NextResponse.json({ message: '批量操作参数无效。' }, { status: 400 });

  const { data, error } = await admin.supabase
    .from('tournament_registrations')
    .update({ status })
    .in('id', ids)
    .select('id');

  if (error) {
    const capacityReached = error.message.includes('APPROVED_CAPACITY_REACHED');
    return NextResponse.json({ message: capacityReached ? '批量通过会超过正式名额上限，本次操作已全部取消。' : '批量状态更新失败。' }, { status: 400 });
  }
  return NextResponse.json({ updated: data?.length ?? 0 });
}
