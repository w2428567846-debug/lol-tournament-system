import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/auth/server';
import type { RegistrationStatus } from '@/types';

const allowed: RegistrationStatus[] = ['APPROVED', 'WAITLISTED', 'REJECTED'];

function reviewErrorMessage(message: string) {
  if (message.includes('APPROVED_CAPACITY_REACHED')) return '批量通过会超过正式名额上限，本次操作已全部取消。';
  if (message.includes('INVALID_ADMIN_REVIEW_TRANSITION')) return '所选报名中包含不能进行此操作的状态，本次操作已全部取消。';
  if (message.includes('ROSTER_LOCKED')) return '所选报名中有已锁定名单，本次操作已全部取消。';
  return '批量状态更新失败。';
}

export async function PATCH(request: Request) {
  const admin = await getAdminClient();
  if ('error' in admin) return NextResponse.json({ message: admin.error === 'ADMIN_REQUIRED' ? '管理员权限不足。' : '请先登录。' }, { status: admin.error === 'ADMIN_REQUIRED' ? 403 : 401 });

  const body = await request.json() as Record<string, unknown>;
  const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
  const status = String(body.status ?? '') as RegistrationStatus;
  const reviewNote = String(body.review_note ?? '').trim() || null;
  if (ids.length < 1 || ids.length > 100 || !allowed.includes(status)) return NextResponse.json({ message: '批量操作参数无效。' }, { status: 400 });
  if ((reviewNote?.length ?? 0) > 500) return NextResponse.json({ message: '审核备注不能超过 500 个字符。' }, { status: 400 });

  const { data, error } = await admin.supabase
    .from('tournament_registrations')
    .update({ status, review_note: reviewNote })
    .in('id', ids)
    .select('id');

  if (error) {
    return NextResponse.json({ message: reviewErrorMessage(error.message) }, { status: 400 });
  }
  return NextResponse.json({ updated: data?.length ?? 0 });
}
