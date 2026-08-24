import { NextResponse } from 'next/server';
import { authGuardErrorResponse } from '@/lib/auth/api-response';
import { getAdminClient } from '@/lib/auth/server';
import type { RegistrationStatus } from '@/types';

const allowed: RegistrationStatus[] = ['APPROVED', 'WAITLISTED', 'REJECTED'];

function reviewErrorMessage(message = '') {
  if (message.includes('APPROVED_CAPACITY_REACHED')) return '正式通过名额已满，不能继续通过。可先设为候补。';
  if (message.includes('INVALID_ADMIN_REVIEW_TRANSITION')) return '当前状态不能进行这项审核操作，请刷新页面后重试。';
  if (message.includes('ROSTER_LOCKED')) return '名单已锁定，不能再审核或改动报名状态。';
  return '报名记录不存在或无法更新。';
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminClient();
  if ('error' in admin) return authGuardErrorResponse(admin.error);
  const body = await request.json() as Record<string, unknown>;
  const status = String(body.status ?? '') as RegistrationStatus;
  const reviewNote = String(body.review_note ?? '').trim() || null;
  if (!allowed.includes(status)) return NextResponse.json({ message: '审核状态无效。' }, { status: 400 });
  if ((reviewNote?.length ?? 0) > 500) return NextResponse.json({ message: '审核备注不能超过 500 个字符。' }, { status: 400 });
  const { id } = await params;
  const { data, error } = await admin.supabase
    .from('tournament_registrations')
    .update({ status, review_note: reviewNote })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ message: reviewErrorMessage(error?.message) }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
